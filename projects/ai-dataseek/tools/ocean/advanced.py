"""Ocean diagnostics with explicit definitions, bounded arrays and no gap filling."""
from __future__ import annotations

import numpy as np
import xarray as xr

from science import vertical, paired, thermodynamics

TOOLS = {
    'ocean_mixed_layer_depth', 'ocean_thermocline', 'ocean_isotherm_depth',
    'ocean_buoyancy_frequency', 'ocean_heat_content', 'ocean_freshwater_content',
    'ocean_vertical_interpolate', 'ocean_current_diagnostics',
    'ocean_eddy_kinetic_energy', 'ocean_temporal_anomaly',
}


def finite_number(args, name, default=None, positive=False):
    v = float(args.get(name, default))
    if not np.isfinite(v) or (positive and v <= 0):
        raise ValueError(f'{name} 必须为有限' + ('正数' if positive else '数值'))
    return v


def temperature(a):
    if a.attrs.get('units') not in ('degree_Celsius', 'degrees_Celsius', 'degC'):
        raise ValueError('温度须明确为摄氏度，请先使用 netcdf_unit_convert')
    return a


def depth_array(ds, a, args):
    from operations import bounded
    name, z, kind, _ = vertical(ds, a, args)
    if kind != 'depth':
        raise ValueError('此工具要求物理深度（米），不能将压力当作几何厚度')
    if z.size < 2 or np.min(z) < 0:
        raise ValueError('需要至少两个非负物理深度层')
    dim = ds[name].dims[0]
    order = np.argsort(z)
    a = bounded(a.isel({dim: order}))
    return a.where(np.isfinite(a)), z[order], dim


def interp_column(values, z, targets):
    # Only adjacent finite endpoints; never drop missing levels and bridge their gap.
    result = np.full(len(targets), np.nan)
    for i, target in enumerate(targets):
        k = int(np.searchsorted(z, target))
        if k < len(z) and z[k] == target:
            result[i] = values[k]
        elif 0 < k < len(z) and np.isfinite(values[k-1:k+1]).all():
            result[i] = values[k-1] + (values[k]-values[k-1])*(target-z[k-1])/(z[k]-z[k-1])
    return result


def profile_apply(a, dim, fn, names, units):
    result = xr.apply_ufunc(fn, a, input_core_dims=[[dim]], output_core_dims=[[]]*len(names), vectorize=True, output_dtypes=[float]*len(names))
    if len(names) == 1:
        result = (result,)
    ds = xr.Dataset({name: arr for name, arr in zip(names, result)})
    for name, unit in zip(names, units):
        ds[name].attrs = {'units': unit, 'long_name': name.replace('_', ' ')}
    return ds


def mixed_layer(ds, a, args):
    criterion = args.get('criterion', 'temperature')
    if criterion == 'density':
        if not args.get('salinity_variable'):
            raise ValueError('密度混合层判据必须指定 salinity_variable')
        a = thermodynamics(ds, a, args).sigma0
    elif criterion == 'temperature':
        temperature(a)
    else:
        raise ValueError('criterion 仅支持 temperature 或 density')
    a, z, dim = depth_array(ds, a, args)
    reference = finite_number(args, 'reference_depth', 10)
    threshold = finite_number(args, 'threshold', .2 if criterion == 'temperature' else .03, True)
    if not z[0] <= reference < z[-1]:
        raise ValueError('参考深度必须在观测范围内且上方/下方具备插值所需层')
    levels = np.r_[reference, z[z > reference]]
    def fn(values):
        v = interp_column(values, z, levels)
        if not np.isfinite(v[0]): return np.nan, 3.
        difference = abs(v-v[0]) if criterion == 'temperature' else v-v[0]
        for i in range(1, len(v)):
            if not np.isfinite(v[i]): return np.nan, 2.
            if difference[i] >= threshold:
                depth = levels[i-1] + (threshold-difference[i-1])/(difference[i]-difference[i-1])*(levels[i]-levels[i-1])
                return depth, 0.
        return np.nan, 1.
    out = profile_apply(a, dim, fn, ['mixed_layer_depth', 'detection_status'], ['m', '1'])
    out.mixed_layer_depth.attrs.update(positive='down', threshold=threshold, reference_depth_m=reference, criterion=criterion)
    out.detection_status.attrs.update(flag_values=[0,1,2,3], flag_meanings='detected no_crossing_within_observed_depth missing_gap invalid_reference')
    return out


def thermocline(ds, a, args):
    temperature(a)
    a,z,dim = depth_array(ds,a,args)
    lower=finite_number(args,'min_depth',float(z[0])); upper=finite_number(args,'max_depth',float(z[-1]))
    if not z[0] <= lower < upper <= z[-1]: raise ValueError('温跃层搜索深度范围无效')
    mid=(z[:-1]+z[1:])/2
    eligible=(z[:-1]>=lower)&(z[1:]<=upper)
    if not eligible.any(): raise ValueError('搜索范围内没有完整相邻层')
    def fn(v):
        gradient=np.diff(v)/np.diff(z)
        valid=eligible & np.isfinite(gradient) & (gradient<0)
        if not valid.any(): return np.nan,np.nan
        index=int(np.argmin(np.where(valid,gradient,np.inf)))
        return mid[index],gradient[index]
    return profile_apply(a,dim,fn,['thermocline_depth','temperature_gradient'],['m','degree_Celsius m-1'])


def isotherm(ds,a,args):
    temperature(a); a,z,dim=depth_array(ds,a,args)
    target=finite_number(args,'temperature_value')
    def fn(v):
        for i in range(len(v)):
            if not np.isfinite(v[i]): return np.nan
            if v[i]==target: return z[i]
            if i and (v[i-1]-target)*(v[i]-target)<0:
                return z[i-1]+(target-v[i-1])/(v[i]-v[i-1])*(z[i]-z[i-1])
        return np.nan
    out=profile_apply(a,dim,fn,['isotherm_depth'],['m'])
    out.isotherm_depth.attrs.update(temperature_value=target, positive='down')
    return out


def layer_integral(ds,a,args,fresh=False):
    if fresh:
        if a.attrs.get('standard_name') != 'sea_water_practical_salinity' or a.attrs.get('units') not in ('1','1e-3','psu','PSU'):
            raise ValueError('淡水含量要求明确的实用盐度')
        a=a.where(a>=0)
    else:
        temperature(a)
    a,z,dim=depth_array(ds,a,args)
    top=finite_number(args,'top_depth'); bottom=finite_number(args,'bottom_depth')
    if not z[0] <= top < bottom <= z[-1]: raise ValueError('积分区间必须完全位于观测深度范围内')
    levels=np.r_[top,z[(z>top)&(z<bottom)],bottom]
    reference=finite_number(args,'reference_salinity',35,True) if fresh else finite_number(args,'reference_temperature',0)
    density=finite_number(args,'density',1025,True); cp=finite_number(args,'heat_capacity',3990,True)
    def fn(v):
        selected=interp_column(v,z,levels)
        if not np.isfinite(selected).all(): return np.nan
        integrand=(reference-selected)/reference if fresh else density*cp*(selected-reference)
        return float(np.trapz(integrand,levels))
    name='freshwater_content' if fresh else 'heat_content'
    out=profile_apply(a,dim,fn,[name],['m' if fresh else 'J m-2'])
    out[name].attrs.update(top_depth_m=top,bottom_depth_m=bottom)
    if fresh: out[name].attrs['reference_salinity']=reference
    else: out[name].attrs.update(reference_temperature=reference,reference_density=density,heat_capacity=cp,convention='constant density and heat capacity approximation; relative to reference temperature')
    return out


def interpolate(ds,a,args):
    a,z,dim=depth_array(ds,a,args)
    targets=np.asarray(args['depth_levels'],dtype=float)
    if targets.ndim != 1 or not 1 <= targets.size <= 256 or not np.isfinite(targets).all() or (np.diff(targets)<=0).any() or targets[0]<z[0] or targets[-1]>z[-1]:
        raise ValueError('目标深度须为观测范围内递增唯一的 1–256 个有限值')
    if a.size//len(z)*len(targets)>2_000_000: raise ValueError('插值结果超过 200 万数值，请先裁剪')
    if 'ocean_depth' in a.dims or 'ocean_depth' in a.coords: raise ValueError('源坐标与输出 ocean_depth 冲突，请先重命名')
    out=xr.apply_ufunc(lambda v:interp_column(v,z,targets),a,input_core_dims=[[dim]],output_core_dims=[['ocean_depth']],vectorize=True,output_dtypes=[float])
    out=out.assign_coords(ocean_depth=targets).rename(a.name)
    out.attrs=dict(a.attrs);out.ocean_depth.attrs={'units':'m','positive':'down','standard_name':'depth'}
    return out.to_dataset()


def buoyancy(ds,a,args):
    import gsw
    from operations import grid
    lon,lat=grid(ds,a,args)
    name,z,kind,_=vertical(ds,a,args);dim=ds[name].dims[0]
    if len(z)<2 or np.min(z)<0: raise ValueError('层结诊断需要至少两个非负深度/压力层')
    thermo=thermodynamics(ds,a,args)
    order=np.argsort(z); thermo=thermo.isel({dim:order});z=z[order]
    coordinate=xr.DataArray(z,dims=[dim],coords={dim:thermo[dim]} if dim in thermo.coords else None)
    pressure=coordinate if kind=='pressure' else xr.apply_ufunc(gsw.p_from_z,-coordinate,ds[lat])
    pressure,latitude,sa=xr.broadcast(pressure,ds[lat],thermo.absolute_salinity)
    ct=thermo.conservative_temperature
    axis=sa.get_axis_num(dim)
    n2,mid_pressure=gsw.Nsquared(sa.values,ct.transpose(*sa.dims).values,pressure.values,latitude.values,axis=axis)
    dims=tuple('ocean_mid_layer' if d==dim else d for d in sa.dims)
    coords={n:c for n,c in sa.coords.items() if dim not in c.dims}
    if 'ocean_mid_layer' in coords or 'ocean_mid_layer' in dims[:axis]+dims[axis+1:]: raise ValueError('输出层坐标名称冲突')
    coords['ocean_mid_layer']=np.arange(len(z)-1)
    out=xr.Dataset({'buoyancy_frequency_squared':(dims,n2),'mid_pressure':(dims,mid_pressure)},coords=coords)
    out.buoyancy_frequency_squared.attrs={'units':'s-2','long_name':'Squared buoyancy frequency; negative values indicate static instability'}
    out.mid_pressure.attrs={'units':'dbar','standard_name':'sea_water_pressure'}
    if kind=='depth':
        out=out.assign_coords(mid_depth=('ocean_mid_layer',(z[:-1]+z[1:])/2))
        out.mid_depth.attrs={'units':'m','positive':'down','standard_name':'depth'}
    else:
        out=out.assign_coords(mid_sea_pressure=('ocean_mid_layer',(z[:-1]+z[1:])/2))
        out.mid_sea_pressure.attrs={'units':'dbar','standard_name':'sea_water_pressure'}
    return out.transpose(*('ocean_mid_layer' if d == dim else d for d in a.dims))


def velocity(ds,a,args):
    from operations import bounded
    b=paired(ds,a,args['northward_variable'],args,'northward_qc_variable')
    if a.attrs.get('standard_name')!='eastward_sea_water_velocity' or b.attrs.get('standard_name')!='northward_sea_water_velocity':
        raise ValueError('需要地理东向/北向流速，模型交错网格须先转换')
    units={'m/s':1.,'m s-1':1.,'cm/s':.01,'cm s-1':.01}
    if a.attrs.get('units') not in units or b.attrs.get('units') not in units: raise ValueError('流速单位须为 m/s 或 cm/s')
    bounded(a)
    u=a*units[a.attrs['units']];v=b*units[b.attrs['units']]
    valid=np.isfinite(u)&np.isfinite(v)
    return u.where(valid),v.where(valid)


def current_diagnostics(ds,a,args):
    from operations import grid
    lon,lat=grid(ds,a,args);u,v=velocity(ds,a,args)
    xd,yd=ds[lon].dims[0],ds[lat].dims[0]
    x,y=np.deg2rad(ds[lon].values),np.deg2rad(ds[lat].values)
    if min(len(x),len(y))<3 or np.max(abs(ds[lat].values))>=89:
        raise ValueError('流场微分需要至少 3×3 格点且远离极点（绝对纬度小于 89°）')
    cos=xr.DataArray(np.cos(y),dims=[yd],coords={yd:a[yd]} if yd in a.coords else None)
    radius=6371008.8
    def derivative(field,dim,values):
        result=np.gradient(field.values,values,axis=field.get_axis_num(dim),edge_order=2)
        # Interior finite differences only; no extrapolation at regional/periodic edges.
        idx=[slice(None)]*field.ndim;idx[field.get_axis_num(dim)]=[0,-1];result[tuple(idx)]=np.nan
        return field.copy(data=result).where(np.isfinite(field))
    div=(derivative(u,xd,x)+derivative(v*cos,yd,y))/(radius*cos)
    vort=(derivative(v,xd,x)-derivative(u*cos,yd,y))/(radius*cos)
    out=xr.Dataset({'relative_vorticity':vort,'horizontal_divergence':div})
    for n in out:out[n].attrs={'units':'s-1','long_name':n.replace('_',' '),'convention':'spherical finite differences; boundary cells missing; no periodic seam extrapolation'}
    return out


def time_baseline(ds,a,args):
    from operations import coord,bounded
    t=coord(ds,'time',args);dim=ds[t].dims[0]
    if dim not in a.dims or ds[t].size<2: raise ValueError('至少需要两个时间样本')
    values=ds[t].values
    try:
        if not all(values[i]>values[i-1] for i in range(1,len(values))): raise ValueError('时间坐标须递增且唯一')
        if np.issubdtype(values.dtype,np.number): raise ValueError('时间须为已解码的 CF 日期')
        a=bounded(a).where(np.isfinite(a)).assign_coords({dim:values})
        baseline=a.sel({dim:slice(args['baseline_start'],args['baseline_end'])})
    except (TypeError,KeyError) as exc:
        raise ValueError('基准日期无法匹配已解码时间坐标') from exc
    if baseline.sizes[dim]<2: raise ValueError('基准时段至少需要两个时间样本')
    return a,baseline,dim


def temporal_anomaly(ds,a,args):
    a,baseline,dim=time_baseline(ds,a,args)
    count=baseline.count(dim);mean=baseline.mean(dim).where(count>=2)
    out=xr.Dataset({'anomaly':a-mean,'baseline_mean':mean,'baseline_valid_count':count})
    for n in ('anomaly','baseline_mean'):out[n].attrs={'units':a.attrs.get('units','1'),'convention':'equal-sample baseline mean; not a seasonal climatology'}
    out.baseline_valid_count.attrs={'units':'1'}
    return out


def eddy_energy(ds,a,args):
    u,v=velocity(ds,a,args)
    u,bu,dim=time_baseline(ds,u,args);v,bv,_=time_baseline(ds,v,args)
    valid=bu.count(dim)>=2
    um=bu.mean(dim).where(valid);vm=bv.mean(dim).where(valid)
    eke=.5*((u-um)**2+(v-vm)**2)
    mean=.5*((bu-um)**2+(bv-vm)**2).mean(dim)
    out=xr.Dataset({'eddy_kinetic_energy':eke,'baseline_mean_eke':mean})
    for n in out:out[n].attrs={'units':'m2 s-2','convention':'equal-sample deviations from paired baseline mean; no seasonal/trend removal'}
    return out


def run(op,ds,a,args):
    functions={
        'ocean_mixed_layer_depth':mixed_layer,'ocean_thermocline':thermocline,
        'ocean_isotherm_depth':isotherm,'ocean_vertical_interpolate':interpolate,
        'ocean_buoyancy_frequency':buoyancy,'ocean_current_diagnostics':current_diagnostics,
        'ocean_eddy_kinetic_energy':eddy_energy,'ocean_temporal_anomaly':temporal_anomaly,
        'ocean_heat_content':lambda ds,a,args:layer_integral(ds,a,args),
        'ocean_freshwater_content':lambda ds,a,args:layer_integral(ds,a,args,True),
    }
    coordinate_attrs = {name: dict(value.attrs) for name, value in ds.variables.items() if value.ndim == 1}
    result=functions[op](ds,a,args)
    for name in result.coords:
        if name in coordinate_attrs:
            result[name].attrs = coordinate_attrs[name]
    return result
