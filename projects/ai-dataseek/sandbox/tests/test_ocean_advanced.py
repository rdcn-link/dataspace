"""Analytic synthetic fields exercise scientific definitions and edge cases."""
import json
from pathlib import Path

import numpy as np
import pytest

from test_ocean_plugin import ocean, invoke, read


def test_mixed_layer_threshold_and_censoring(ocean,tmp_path):
    result=invoke(ocean,tmp_path,'ocean_mixed_layer_depth',visualize=True)
    out=read(result)
    np.testing.assert_allclose(out.mixed_layer_depth,16)
    assert bool((out.detection_status==0).all())
    assert out.mixed_layer_depth.attrs['reference_depth_m']==10
    assert len(result['artifacts'])==2
    assert Path(result['artifacts'][1]['path']).read_bytes().startswith(b'\x89PNG')
    out=read(invoke(ocean,tmp_path,'ocean_mixed_layer_depth',threshold=20))
    assert bool(out.mixed_layer_depth.isnull().all()) and bool((out.detection_status==1).all())
    ds,path=ocean;ds.temperature.values[:,2,:,:]=np.nan;ds.to_netcdf(path)
    out=read(invoke(ocean,tmp_path,'ocean_mixed_layer_depth'))
    assert bool((out.detection_status==2).all())


def test_density_mixed_layer_and_missing_salinity(ocean,tmp_path):
    result=invoke(ocean,tmp_path,'ocean_mixed_layer_depth',criterion='density',salinity_variable='salinity')
    out=read(result)
    assert bool((out.mixed_layer_depth>10).all()) and bool((out.mixed_layer_depth<100).all())
    assert out.mixed_layer_depth.attrs['threshold']==.03
    result=invoke(ocean,tmp_path,'ocean_mixed_layer_depth',criterion='density')
    assert not result['success']


def test_thermocline_and_uppermost_isotherm(ocean,tmp_path):
    result=invoke(ocean,tmp_path,'ocean_thermocline',visualize=True)
    out=read(result)
    np.testing.assert_allclose(out.thermocline_depth,5)
    np.testing.assert_allclose(out.temperature_gradient,-.3)
    assert len(result['artifacts'])==3
    out=read(invoke(ocean,tmp_path,'ocean_isotherm_depth',temperature_value=8,visualize=True))
    assert float(out.isotherm_depth.isel(time=0,lat=0,lon=0))==pytest.approx(20/3)
    ds,path=ocean;ds.temperature.values[:]=ds.temperature.values[:,::-1,:,:];ds.to_netcdf(path)
    out=read(invoke(ocean,tmp_path,'ocean_thermocline'))
    assert bool(out.thermocline_depth.isnull().all())


def test_integrals_and_no_partial_columns(ocean,tmp_path):
    result=invoke(ocean,tmp_path,'ocean_heat_content',top_depth=0,bottom_depth=100,density=1000,heat_capacity=4000,visualize=True)
    out=read(result)
    assert float(out.heat_content.isel(time=0,lat=0,lon=0))==pytest.approx(580*4_000_000)
    assert out.heat_content.attrs['reference_density']==1000
    out=read(invoke(ocean,tmp_path,'ocean_freshwater_content',variable='salinity',top_depth=0,bottom_depth=100,visualize=True))
    assert float(out.freshwater_content.isel(time=0,lat=0,lon=0))==pytest.approx(86/35)
    ds,path=ocean;ds.temperature.values[:,1,:,:]=np.nan;ds.to_netcdf(path)
    out=read(invoke(ocean,tmp_path,'ocean_heat_content',top_depth=0,bottom_depth=100))
    assert bool(out.heat_content.isnull().all())
    result=invoke(ocean,tmp_path,'ocean_heat_content',top_depth=0,bottom_depth=101)
    assert not result['success'] and '观测深度' in result['error']


def test_vertical_interpolation_reversed_and_gap(ocean,tmp_path):
    ds,path=ocean
    ds=ds.isel(depth=slice(None,None,-1));ds=ds.assign_coords(depth=-ds.depth)
    ds.depth.attrs={'units':'m','positive':'up','standard_name':'height'};ds.to_netcdf(path)
    out=read(invoke((ds,path),tmp_path,'ocean_vertical_interpolate',depth_levels=[5,55],visualize=True))
    np.testing.assert_allclose(out.temperature.isel(time=0,lat=0,lon=0),[8.5,5.5])
    assert out.ocean_depth.attrs['positive']=='down'
    ds.temperature.values[:,1,:,:]=np.nan;ds.to_netcdf(path)
    out=read(invoke((ds,path),tmp_path,'ocean_vertical_interpolate',depth_levels=[5,55]))
    assert bool(out.temperature.isnull().all())
    result=invoke((ds,path),tmp_path,'ocean_vertical_interpolate',depth_levels=[5,5])
    assert not result['success']


def test_buoyancy_matches_gsw_and_retains_instability(ocean,tmp_path):
    gsw=pytest.importorskip('gsw')
    out=read(invoke(ocean,tmp_path,'ocean_buoyancy_frequency',salinity_variable='salinity',visualize=True))
    p=gsw.p_from_z(-np.array([0.,10.,100.]),0)
    sa=gsw.SA_from_SP(np.array([34.,34.1,34.2]),p,120,0)
    ct=gsw.CT_from_t(sa,[10,7,4],p)
    expected,mid=gsw.Nsquared(sa,ct,p,lat=0)
    np.testing.assert_allclose(out.buoyancy_frequency_squared.isel(time=0,lat=0,lon=0),expected)
    np.testing.assert_allclose(out.mid_pressure.isel(time=0,lat=0,lon=0),mid)
    assert out.lat.attrs['units']=='degrees_north' and out.lon.attrs['units']=='degrees_east'
    assert out.buoyancy_frequency_squared.dims==('time','ocean_mid_layer','lat','lon')
    assert bool((out.buoyancy_frequency_squared>0).all())
    ds,path=ocean;ds.temperature.values[:]=ds.temperature.values[:,::-1,:,:];ds.salinity.values[:]=35;ds.to_netcdf(path)
    out=read(invoke(ocean,tmp_path,'ocean_buoyancy_frequency',salinity_variable='salinity'))
    assert bool((out.buoyancy_frequency_squared<0).all())


def test_spherical_current_diagnostics_and_boundaries(ocean,tmp_path):
    ds,path=ocean
    latitude=np.deg2rad(ds.lat.values)[None,None,:,None]
    ds.u.values[:]=1/np.cos(latitude)
    ds.v.values[:]=latitude/np.cos(latitude)
    ds.to_netcdf(path)
    out=read(invoke(ocean,tmp_path,'ocean_current_diagnostics',variable='u',northward_variable='v',visualize=True))
    np.testing.assert_allclose(out.relative_vorticity.isel(lat=1,lon=1),0,atol=1e-20)
    np.testing.assert_allclose(out.horizontal_divergence.isel(lat=1,lon=1),1/(6371008.8*np.cos(np.pi/6)))
    assert bool(out.relative_vorticity.isel(lat=0).isnull().all())
    assert bool(out.horizontal_divergence.isel(lon=-1).isnull().all())


def test_time_anomaly_and_paired_eddy_energy(ocean,tmp_path):
    kw={'baseline_start':'2024-01-01','baseline_end':'2024-01-03'}
    result=invoke(ocean,tmp_path,'ocean_temporal_anomaly',**kw,visualize=True)
    out=read(result)
    np.testing.assert_allclose(out.anomaly.isel(time=0),-2)
    np.testing.assert_allclose(out.anomaly.isel(time=2),2)
    assert out.attrs['baseline_start']==kw['baseline_start']
    assert len(result['artifacts'])==3
    ds,path=ocean;ds.u.values[:]=np.array([1,2,3])[:,None,None,None];ds.v.values[:]=0;ds.to_netcdf(path)
    out=read(invoke(ocean,tmp_path,'ocean_eddy_kinetic_energy',variable='u',northward_variable='v',**kw,visualize=True))
    np.testing.assert_allclose(out.eddy_kinetic_energy.isel(time=0),.5)
    np.testing.assert_allclose(out.eddy_kinetic_energy.isel(time=1),0)
    np.testing.assert_allclose(out.baseline_mean_eke,1/3)
    ds.v.values[0]=np.nan;ds.to_netcdf(path)
    out=read(invoke(ocean,tmp_path,'ocean_eddy_kinetic_energy',variable='u',northward_variable='v',**kw))
    np.testing.assert_allclose(out.baseline_mean_eke,.125)
    assert bool(out.eddy_kinetic_energy.isel(time=0).isnull().all())
    result=invoke(ocean,tmp_path,'ocean_temporal_anomaly',baseline_start='2024-01-01',baseline_end='2024-01-01')
    assert not result['success'] and '至少' in result['error']
