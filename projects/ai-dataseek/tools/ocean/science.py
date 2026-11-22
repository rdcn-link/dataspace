"""Coordinate and selection rules shared by ocean calculations and views."""
from __future__ import annotations

import numpy as np
import xarray as xr


def vertical(ds, a, args):
    from operations import coord
    name = coord(ds, 'vertical', args)
    c = ds[name]
    if c.dims[0] not in a.dims or c.attrs.get('formula_terms'):
        raise ValueError('垂直坐标须为物理深度或海水压力；模型层需先按 CF 公式转换')
    unit = str(c.attrs.get('units', '')).lower()
    values = np.asarray(c.values, dtype=float)
    if not values.size or not np.all(np.isfinite(values)) or (values.size > 1 and not
            (np.all(np.diff(values) > 0) or np.all(np.diff(values) < 0))):
        raise ValueError('垂直坐标须有限、唯一且单调')
    length = {'m': 1, 'meter': 1, 'meters': 1, 'metre': 1, 'metres': 1, 'cm': .01, 'km': 1000}
    pressure = {'dbar': 1, 'decibar': 1, 'pa': .0001, 'hpa': .01, 'bar': 10}
    if unit in length:
        positive = c.attrs.get('positive')
        if positive is None and c.attrs.get('standard_name') == 'depth':
            positive = 'down'
        if positive not in ('up', 'down'):
            raise ValueError('深度坐标必须声明 positive=up/down 或 standard_name=depth')
        values = values * length[unit] * (-1 if positive == 'up' else 1)
        kind, label = 'depth', '深度 (m，向下为正)'
    elif unit in pressure and c.attrs.get('standard_name') == 'sea_water_pressure':
        values = values * pressure[unit]
        kind, label = 'pressure', '海水压力 (dbar)'
    else:
        raise ValueError('无法确认物理垂直坐标；不将模型层号、sigma 或未声明单位解释为深度')
    return name, values, kind, label


def depth_pick(ds, a, args):
    name, values, kind, _ = vertical(ds, a, args)
    if 'depth_value' in args:
        requested = float(args['depth_value'])
        if not np.isfinite(requested) or not values.min() <= requested <= values.max():
            raise ValueError('请求的深度/压力超出坐标范围')
        index = int(np.argmin(abs(values - requested)))
    else:
        index = int(args.get('depth_index', 0))
    if index < 0 or index >= len(values):
        raise ValueError('depth_index 超出范围')
    return a.isel({ds[name].dims[0]: index}), {'vertical_value': float(values[index]), 'vertical_kind': kind, 'depth_index': index}


def quality(ds, a, args, key='qc_variable'):
    from operations import bounded
    name = args.get(key)
    if not name:
        return a
    if name not in ds:
        raise ValueError('质量标记变量不存在')
    qc = ds[name]
    if qc.dims != a.dims or qc.shape != a.shape:
        raise ValueError('质量标记必须与目标变量逐维匹配')
    bounded(a); bounded(qc)
    finite = xr.apply_ufunc(np.isfinite, qc) if np.issubdtype(qc.dtype, np.number) else qc.notnull()
    if 'reject_bits' in args and args.get('accepted_flags'):
        raise ValueError('accepted_flags 与 reject_bits 只能选择一种规则')
    if 'reject_bits' in args:
        bits = args['reject_bits']
        if not isinstance(bits, int) or bits < 0 or bits > 2**31-1:
            raise ValueError('reject_bits 须为非负 31 位整数掩码')
        if not np.issubdtype(qc.dtype, np.number) or bool(((qc.where(finite, 0) % 1) != 0).any()):
            raise ValueError('位掩码要求整数质量标记')
        mask = finite & ((qc.where(finite, 0).astype('int64') & bits) == 0)
    elif args.get('accepted_flags'):
        allowed = args['accepted_flags']
        if np.issubdtype(qc.dtype, np.number):
            allowed = [float(v) for v in allowed]
        else:
            qc = qc.astype(str)
            allowed = [str(v) for v in allowed]
        mask = finite & qc.isin(allowed)
    else:
        raise ValueError('使用质量标记时须明确 accepted_flags 或 reject_bits')
    return a.where(mask)


def paired(ds, a, name, args, qc_key):
    from operations import bounded
    if name not in ds.data_vars:
        raise ValueError('配对变量不存在')
    b = ds[name]
    if a.dims != b.dims or a.shape != b.shape:
        raise ValueError('配对变量须同格点逐维匹配，交错网格需先重网格')
    bounded(b)
    return quality(ds, b, args, qc_key)


def region(ds, a, args):
    from operations import grid
    lon, lat = grid(ds, a, args)
    box = np.asarray(args['bbox'], dtype=float)
    if box.shape != (4,) or not np.all(np.isfinite(box)):
        raise ValueError('bbox 须为 west,south,east,north 四个有限数值')
    west, south, east, north = box
    if not -90 <= south <= north <= 90:
        raise ValueError('无效纬度范围')
    xv = (ds[lon] + 180) % 360 - 180
    if abs(east - west) >= 360:
        xm = xr.ones_like(xv, dtype=bool)
    else:
        west, east = (west + 180) % 360 - 180, (east + 180) % 360 - 180
        xm = ((xv >= west) & (xv <= east)) if west <= east else ((xv >= west) | (xv <= east))
    ym = (ds[lat] >= south) & (ds[lat] <= north)
    a = a.isel({ds[lon].dims[0]: np.flatnonzero(xm.values), ds[lat].dims[0]: np.flatnonzero(ym.values)})
    if not a.size:
        raise ValueError('区域未包含任何格点')
    for c in (ds[lon], ds[lat]):
        if c.size > 2 and not np.allclose(np.diff(c), np.diff(c)[0], rtol=1e-5, atol=1e-7):
            raise ValueError('余弦面积权重仅支持等间距经纬度网格')
    weights = np.cos(np.deg2rad(ds[lat].isel({ds[lat].dims[0]: np.flatnonzero(ym.values)})))
    return a, weights, [ds[lon].dims[0], ds[lat].dims[0]]


def transect(ds, a, args):
    from operations import point, bounded
    line = np.asarray(args['line'], dtype=float)
    count = int(args.get('samples', 100))
    if line.shape != (2, 2) or not np.all(np.isfinite(line)) or np.any(abs(line[:, 1]) > 90) or not 2 <= count <= 256:
        raise ValueError('断面须给出两个经纬度端点，采样数须为 2–256')
    # Explicit lon/lat linear track, shortest longitude arc; no hidden interpolation across land.
    dx = (line[1, 0] - line[0, 0] + 180) % 360 - 180
    xs = line[0, 0] + np.linspace(0, dx, count)
    ys = np.linspace(line[0, 1], line[1, 1], count)
    columns, selected_x, selected_y = [], [], []
    for x, y in zip(xs, ys):
        col, info = point(ds, a, {**args, 'longitude': x, 'latitude': y})
        if col.size * count > 2_000_000:
            raise ValueError('断面超过 200 万数值，请减少采样或先裁剪')
        columns.append(bounded(col).drop_vars([n for n in col.coords if col[n].ndim == 0]))
        selected_x.append(info['selected_longitude']); selected_y.append(info['selected_latitude'])
    rlat = np.deg2rad(ys)
    h = np.sin(np.diff(rlat)/2)**2 + np.cos(rlat[:-1])*np.cos(rlat[1:])*np.sin(np.deg2rad(np.diff(xs))/2)**2
    distance = np.r_[0, np.cumsum(6371.0088 * 2 * np.arcsin(np.sqrt(np.clip(h, 0, 1))))]
    out = xr.concat(columns, dim='sample').assign_coords(distance_km=('sample', distance),
        longitude_requested=('sample', xs), latitude_requested=('sample', ys),
        longitude_selected=('sample', selected_x), latitude_selected=('sample', selected_y))
    out.distance_km.attrs['units'] = 'km'
    return out


def thermodynamics(ds, a, args):
    import gsw
    from operations import bounded, grid
    lon, lat = grid(ds, a, args)
    z, values, kind, _ = vertical(ds, a, args)
    b = paired(ds, a, args['salinity_variable'], args, 'salinity_qc_variable')
    if a.attrs.get('standard_name') != 'sea_water_temperature' or a.attrs.get('units') not in ('degree_Celsius', 'degrees_Celsius', 'degC'):
        raise ValueError('TEOS-10 要求明确的现场温度 sea_water_temperature，单位摄氏度')
    if b.attrs.get('standard_name') != 'sea_water_practical_salinity' or b.attrs.get('units') not in ('1', '1e-3', 'psu', 'PSU'):
        raise ValueError('TEOS-10 要求明确的实用盐度 sea_water_practical_salinity')
    bounded(a)
    zz = xr.DataArray(values, dims=ds[z].dims)
    p = zz if kind == 'pressure' else xr.apply_ufunc(gsw.p_from_z, -zz, ds[lat])
    p, latitude, longitude, temp = xr.broadcast(p, ds[lat], ds[lon], a)
    p = p.transpose(*a.dims); latitude = latitude.transpose(*a.dims); longitude = longitude.transpose(*a.dims)
    if bool((p < 0).any()):
        raise ValueError('海水压力不能为负')
    salinity = b.where(b >= 0)
    sa = xr.apply_ufunc(gsw.SA_from_SP, salinity, p, longitude, latitude)
    ct = xr.apply_ufunc(gsw.CT_from_t, sa, a, p)
    rho = xr.apply_ufunc(gsw.rho, sa, ct, p)
    sigma0 = xr.apply_ufunc(gsw.sigma0, sa, ct)
    out = xr.Dataset({'absolute_salinity': sa, 'conservative_temperature': ct, 'density': rho, 'sigma0': sigma0})
    for name, units in [('absolute_salinity', 'g kg-1'), ('conservative_temperature', 'degree_Celsius'), ('density', 'kg m-3'), ('sigma0', 'kg m-3')]:
        out[name].attrs = {'units': units, 'long_name': name.replace('_', ' ')}
    out.sigma0.attrs['reference_pressure_dbar'] = 0
    return out
