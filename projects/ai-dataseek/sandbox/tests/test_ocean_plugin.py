import json
import os
from pathlib import Path
import subprocess
import numpy as np
import pytest
import xarray as xr
from scripts.tool_plugin_runner import load_registry, load_handler

ROOT = Path(__file__).resolve().parents[2]

@pytest.fixture
def ocean(tmp_path):
    t,z,y,x=np.indices((3,3,3,4)); dims=('time','depth','lat','lon'); shape=t.shape
    ds=xr.Dataset({'temperature':(dims,(10+2*t-3*z+y+.1*x).astype(float)), 'salinity':(dims,34+.1*z+.01*x+np.zeros_like(t)), 'u':(dims,np.full(shape,3.)), 'v':(dims,np.full(shape,4.)), 'qc':(dims,np.ones(shape,dtype='int16'))},coords={'time':np.array(['2024-01-01','2024-01-02','2024-01-03'],dtype='datetime64[ns]'),'depth':[0.,10.,100.],'lat':[0.,30.,60.],'lon':[120.,121.,122.,123.]})
    ds.depth.attrs={'units':'m','positive':'down','standard_name':'depth'}
    ds.lat.attrs={'units':'degrees_north','standard_name':'latitude'}
    ds.lon.attrs={'units':'degrees_east','standard_name':'longitude'}
    for n,unit,std in [('temperature','degree_Celsius','sea_water_temperature'),('salinity','1','sea_water_practical_salinity'),('u','m s-1','eastward_sea_water_velocity'),('v','m s-1','northward_sea_water_velocity')]: ds[n].attrs={'units':unit,'standard_name':std}
    ds.qc.attrs={'flag_values':[1,4],'flag_meanings':'good bad'};ds.qc.values[0,0,0,0]=4
    path=tmp_path/'source.nc';ds.to_netcdf(path)
    return ds,path

def invoke(ocean,tmp_path,name,**kw):
    args={'input_path':str(ocean[1]),'variable':'temperature','output_path':str(tmp_path/'output'/('result.html' if name=='ocean_interactive_view' else 'result.nc')),'visualize':False,**kw}
    _,handler=load_registry(ROOT/'tools')[name]
    proc=subprocess.run(load_handler(handler)(name,args),capture_output=True,text=True,env={**os.environ,'AI_DATASEEK_OUTPUT_ROOT':str(tmp_path/'output')},timeout=40)
    assert proc.returncode==0,proc.stderr
    return json.loads(proc.stdout)

def read(result):
    assert result['success'],result
    with xr.open_dataset(result['output_path']) as ds:return ds.load()

def test_profile_slice_region_transect(ocean,tmp_path):
    ds,_=ocean
    p=read(invoke(ocean,tmp_path,'ocean_profile',longitude=121,latitude=30,time_index=1))
    np.testing.assert_allclose(p.temperature,[13.1,10.1,7.1])
    s=read(invoke(ocean,tmp_path,'ocean_depth_slice',depth_value=12,time_index=2))
    np.testing.assert_allclose(s.temperature,ds.temperature.isel(time=2,depth=1))
    r=read(invoke(ocean,tmp_path,'ocean_region_timeseries',bbox=[120,0,123,60],depth_index=0))
    np.testing.assert_allclose(r.temperature,ds.temperature.isel(depth=0).weighted(np.cos(np.deg2rad(ds.lat))).mean(['lat','lon']))
    sec=read(invoke(ocean,tmp_path,'ocean_transect',line=[[120,0],[123,60]],samples=4,time_index=1))
    np.testing.assert_allclose(sec.temperature.isel(sample=0),ds.temperature.isel(time=1,lat=0,lon=0))
    np.testing.assert_allclose(sec.temperature.isel(sample=-1),ds.temperature.isel(time=1,lat=2,lon=3))
    assert np.all(np.diff(sec.distance_km)>0)

def test_quality_values_and_bits(ocean,tmp_path):
    for rule in [{'accepted_flags':[1]},{'reject_bits':4}]:
        out=read(invoke(ocean,tmp_path,'ocean_qc_mask',qc_variable='qc',**rule))
        assert np.isnan(out.temperature.values[0,0,0,0]) and int(out.temperature.count())==107
    result=invoke(ocean,tmp_path,'ocean_profile',longitude=121,latitude=30,qc_variable='qc')
    assert not result['success'] and 'accepted_flags' in result['error']

def test_current_thermodynamics(ocean,tmp_path):
    result=read(invoke(ocean,tmp_path,'ocean_current_speed',variable='u',northward_variable='v'))
    np.testing.assert_allclose(result.speed,5);np.testing.assert_allclose(result.direction,36.86989765)
    pytest.importorskip('gsw')
    result=read(invoke(ocean,tmp_path,'ocean_thermodynamics',salinity_variable='salinity'))
    assert set(result.data_vars)=={'absolute_salinity','conservative_temperature','density','sigma0'}
    assert float(result.density.min())>1020
    np.testing.assert_allclose(result.density.isel(depth=0),result.sigma0.isel(depth=0)+1000)

def test_inspect_time_depth_ts_png(ocean,tmp_path):
    info=invoke(ocean,tmp_path,'ocean_inspect');assert info['success']
    assert next(v for v in info['variables'] if v['name']=='qc')['flag_values']==[1,4]
    out=read(invoke(ocean,tmp_path,'ocean_time_depth',longitude=120,latitude=0));assert out.temperature.dims==('time','depth')
    result=invoke(ocean,tmp_path,'ocean_temperature_salinity',salinity_variable='salinity',visualize=True)
    assert result['success'],result
    assert result['valid_pairs']==108 and len(result['artifacts'])==2
    assert Path(result['artifacts'][1]['path']).read_bytes().startswith(b'\x89PNG')

def test_view_reorders_masks_and_hides_paths(ocean,tmp_path):
    ds,source=ocean
    ds=ds.isel(lat=slice(None,None,-1),depth=slice(None,None,-1)).transpose('lon','time','lat','depth')
    ds=ds.assign_coords(depth=-ds.depth);ds.depth.attrs={'units':'m','positive':'up','standard_name':'height'}
    ds.attrs['private_path']='/private/datasets/source.nc';ds.to_netcdf(source)
    result=invoke(ocean,tmp_path,'ocean_interactive_view',salinity_variable='salinity',eastward_variable='u',northward_variable='v',qc_variable='qc',accepted_flags=[1])
    assert result['success'],result
    html=Path(result['output_path']).read_text();d=json.loads(html.split('<script id="ocean-data" type="application/json">')[1].split('</script>')[0])
    assert d['variables']['temperature']['quality'].startswith('已按')
    assert d['variables']['salinity']['quality'].startswith('未应用')
    assert d['z']==[0,10,100] and d['y']==[0,30,60]
    assert d['variables']['temperature']['values'][0] is None and d['variables']['temperature']['values'][1]==10.1
    assert str(source) not in html and '/private/datasets' not in html and '/*OCEAN_' not in html and '<script src=' not in html

@pytest.mark.parametrize('attrs,match',[({'units':'1','standard_name':'ocean_sigma_coordinate'},'模型层'),({'units':'m'},'positive')])
def test_reject_ambiguous_depth(ocean,tmp_path,attrs,match):
    ds,path=ocean;ds.depth.attrs=attrs;ds.to_netcdf(path)
    result=invoke(ocean,tmp_path,'ocean_interactive_view');assert not result['success'] and match in result['error']

def test_output_escape_and_invalid_selection(ocean,tmp_path):
    for kwargs,match in [({'output_path':str(tmp_path/'bad.nc'),'longitude':121,'latitude':30},'输出'),({'longitude':0,'latitude':30},'覆盖范围'),({'longitude':121,'latitude':30,'time_index':-1},'time_index')]:
        result=invoke(ocean,tmp_path,'ocean_profile',**kwargs);assert not result['success'] and match in result['error']

def test_auxiliary_coordinates_preserved(ocean,tmp_path):
    ds,path=ocean
    ds=ds.rename_dims({'depth':'lev','lat':'j','lon':'i'})
    ds.to_netcdf(path)
    out=read(invoke(ocean,tmp_path,'ocean_profile',longitude=121,latitude=30,visualize=True))
    assert 'depth' in out.coords and out.depth.attrs['units']=='m'
    np.testing.assert_allclose(out.temperature,[11.1,8.1,5.1])
    result=invoke(ocean,tmp_path,'ocean_interactive_view')
    assert result['success'],result

def test_pressure_is_not_labeled_depth_and_conflicting_qc_rejected(ocean,tmp_path):
    ds,path=ocean;ds.depth.attrs={'units':'Pa','standard_name':'sea_water_pressure'};ds.to_netcdf(path)
    result=invoke(ocean,tmp_path,'ocean_interactive_view')
    assert result['success'],result
    html=Path(result['output_path']).read_text();d=json.loads(html.split('<script id="ocean-data" type="application/json">')[1].split('</script>')[0])
    assert d['verticalKind']=='pressure' and d['z']==[0,.001,.01]
    result=invoke(ocean,tmp_path,'ocean_qc_mask',qc_variable='qc',accepted_flags=[1],reject_bits=4)
    assert not result['success'] and '只能选择' in result['error']

def test_zero_currents_and_missing_region(ocean,tmp_path):
    ds,path=ocean;ds.u.values[:]=0;ds.v.values[:]=0;ds.temperature.values[:]=np.nan;ds.to_netcdf(path)
    result=read(invoke(ocean,tmp_path,'ocean_current_speed',variable='u',northward_variable='v'))
    assert bool(result.direction.isnull().all()) and float(result.speed.max())==0
    result=read(invoke(ocean,tmp_path,'ocean_region_timeseries',bbox=[120,0,123,60],depth_index=1))
    assert bool(result.temperature.isnull().all())
