import json
import os
from pathlib import Path
import subprocess

import numpy as np
import pandas as pd
import pytest
from PIL import Image
from scripts.tool_plugin_runner import load_handler,load_registry
ROOT=Path(__file__).resolve().parents[2]
R=8.31446261815324


def cases():
    strain=np.linspace(0,.02,41);stress=np.minimum(200000*strain,250)
    tensile={'strain':strain,'stress_MPa':stress}
    temp=np.array([300.,400,500,600]);cycles=np.array([1e3,1e4,1e5,1e6]);energies=np.linspace(1.6,3,15)
    f=np.logspace(-2,5,60);z=5+100/(1+2j*np.pi*f*100*1e-4)
    theta=np.array([15.,25,35,45]);wavelength=1.5406;beta=(.9*wavelength/500+4*.001*np.sin(np.deg2rad(theta)))/np.cos(np.deg2rad(theta));instrument=np.full(4,.05)
    hkl=np.array([[1,0,0],[1,1,0],[1,1,1],[2,0,0]])
    pressure=np.linspace(.05,.3,9);vm=.1;c=100;amount=vm*c*pressure/((1-pressure)*(1+(c-1)*pressure))
    stiffness=np.zeros((6,6));stiffness[:3,:3]=100;np.fill_diagonal(stiffness[:3,:3],200);np.fill_diagonal(stiffness[3:,3:],50)
    return [
        ('elastic_modulus',tensile,{'fit_min':0,'fit_max':.001},'young_modulus_GPa',200),
        ('offset_yield',tensile,{'fit_min':0,'fit_max':.001},'proof_stress_MPa',250),
        ('true_stress_strain',tensile,{'uniform_strain_max':.001},'point_count',3),
        ('strain_energy',{'strain':[0,.005,.01],'stress_MPa':[0,5,10]}, {},'observed_work_density_MJ_m3',.05),
        ('creep_rate',{'time_s':[0,10,20,30],'strain':[0,.001,.002,.003]},{'fit_min':0,'fit_max':30},'secondary_creep_rate_s_1',.0001),
        ('fatigue_basquin',{'cycles_to_failure':cycles,'stress_amplitude_MPa':1000*cycles**(-.1),'failed':[1]*4},{},'exponent_b',-.1),
        ('vickers_hardness',{'force_N':[9.80665],'diagonal1_mm':[.1],'diagonal2_mm':[.1]}, {},'mean_HV',185.44),
        ('elastic_tensor_vrh',{'stiffness_GPa':stiffness.tolist()}, {},'young_Hill_GPa',400/3),
        ('thermal_expansion',{'temperature_K':[300,400,500],'length_m':[.1,.1001,.1002]},{'fit_min':300,'fit_max':500,'reference_length_m':.1},'linear_expansion_K_1',1e-5),
        ('flash_diffusivity',{'time_s':np.arange(11),'temperature_K':300+10*np.minimum(np.arange(11)/4,1)},{'pulse_time_s':0,'baseline_temperature_K':300,'plateau_temperature_K':310,'thickness_m':.001},'thermal_diffusivity_m2_s',6.94e-8),
        ('dsc_enthalpy',{'time_s':[0,5,10],'heat_flow_W':[3,3,3]},{'baseline_W':1,'mass_g':.01,'start_time_s':0,'end_time_s':10},'signed_enthalpy_J_g',2000),
        ('tga_analysis',{'temperature_K':[300,400,500],'mass_mg':[10,9,8]}, {},'threshold_temperature_K',350),
        ('arrhenius_fit',{'temperature_K':temp,'rate':1e7*np.exp(-50000/R/temp)}, {},'apparent_activation_energy_kJ_mol',50),
        ('kissinger_fit',{'peak_temperature_K':temp,'heating_rate_K_s':np.exp(20-60000/R/temp)*temp**2}, {},'apparent_activation_energy_kJ_mol',60),
        ('band_edges',{'k_index':[0,0,1,1],'band_index':[0,1,0,1],'energy_eV':[-1,2,0,3],'occupation':[2,0,2,0]},{'full_occupation':2},'sampled_gap_eV',2),
        ('dos_integral',{'energy_eV':[-2,-1,0,1,2],'dos_states_eV_cell':[2]*5},{'energy_min_eV':-1,'energy_max_eV':1},'integrated_states_per_cell',4),
        ('tauc_gap',{'photon_energy_eV':energies,'absorption_cm_1':np.sqrt(100*(energies-1.5))/energies},{'fit_min':2,'fit_max':3,'tauc_power':2},'tauc_gap_eV',1.5),
        ('four_probe_resistivity',{'current_A':[-.01,0,.01],'voltage_V':[-.099,.001,.101]},{'thickness_m':1e-6},'resistivity_ohm_m',np.pi/np.log(2)*10e-6),
        ('specific_capacity',{'time_s':[0,1800,3600],'current_A':[.001]*3},{'active_mass_g':.002},'specific_capacity_mAh_g',500),
        ('impedance_rc_fit',{'frequency_Hz':f,'real_ohm':z.real,'imag_ohm':z.imag}, {},'capacitance_F',1e-4),
        ('williamson_hall',{'two_theta_deg':2*theta,'fwhm_deg':np.sqrt(np.rad2deg(beta)**2+instrument**2),'instrument_fwhm_deg':instrument},{'wavelength_angstrom':wavelength},'coherent_domain_size_nm',50),
        ('cubic_lattice_fit',{'two_theta_deg':np.rad2deg(2*np.arcsin(wavelength*np.sqrt((hkl*hkl).sum(axis=1))/8)),'h':hkl[:,0],'k':hkl[:,1],'l':hkl[:,2]},{'wavelength_angstrom':wavelength},'cubic_lattice_parameter_angstrom',4),
        ('lattice_strain',{'reference_cell_angstrom':np.eye(3).tolist(),'current_cell_angstrom':(1.01*np.eye(3)).tolist()}, {},'relative_volume_change',1.01**3-1),
        ('micrograph_particles','image',{'threshold_8bit':100,'pixel_size_um':.5},'retained_object_count',2),
        ('bet_surface_area',{'relative_pressure':pressure,'adsorbed_mol_kg':amount},{'fit_min':.05,'fit_max':.3,'molecular_cross_section_nm2':.162},'BET_area_m2_g',vm*6.02214076e23*.162e-18/1000),
    ]


def prepare(tmp_path,op,data):
    if op=='micrograph_particles':
        p=tmp_path/'source.png';image=np.full((80,100),255,dtype=np.uint8);image[10:20,10:20]=0;image[30:50,40:60]=0;image[0:10,80:90]=0;Image.fromarray(image).save(p)
    elif op in ('elastic_tensor_vrh','lattice_strain'):
        p=tmp_path/'source.json';p.write_text(json.dumps(data))
    else:
        p=tmp_path/'source.csv';pd.DataFrame(data).to_csv(p,index=False)
    return p


def invoke(tmp_path,op,data,args):
    p=prepare(tmp_path,op,data);before=p.read_bytes()
    payload={'input_path':str(p),'output_path':str(tmp_path/'output'/'result.json'),**args}
    _,handler=load_registry(ROOT/'tools')['materials_'+op]
    run=subprocess.run(load_handler(handler)('materials_'+op,payload),capture_output=True,text=True,env={**os.environ,'AI_DATASEEK_OUTPUT_ROOT':str(tmp_path/'output')},timeout=40)
    assert run.returncode==0,run.stderr
    assert p.read_bytes()==before
    return json.loads(run.stdout)


@pytest.mark.parametrize('op,data,args,key,expected',cases(),ids=[c[0] for c in cases()])
def test_registered_materials_numerical_results_and_artifacts(tmp_path,op,data,args,key,expected):
    result=invoke(tmp_path,op,data,args)
    assert result['success'],result
    assert result['summary'][key]==pytest.approx(expected,rel=1e-5,abs=1e-10)
    assert len(result['artifacts'])==3
    for artifact in result['artifacts']:assert Path(artifact['path']).stat().st_size>0
    assert Path(result['artifacts'][2]['path']).read_bytes().startswith(b'\x89PNG')
    text=Path(result['artifacts'][0]['path']).read_text()
    assert str(tmp_path) not in text and 'input_path' not in text
    assert len(pd.read_csv(result['artifacts'][1]['path']))==result['row_count']


@pytest.mark.parametrize('op,data,args,word',[
 ('specific_capacity',{'time_s':[0,1,2],'current_A':[1,-1,1]},{'active_mass_g':1},'极性'),
 ('fatigue_basquin',{'cycles_to_failure':[100,200,300],'stress_amplitude_MPa':[100,90,80],'failed':[1,0,1]}, {},'删失'),
 ('dos_integral',{'energy_eV':[0,1,2],'dos_states_eV_cell':[1,np.nan,1]},{'energy_min_eV':0,'energy_max_eV':2},'缺测'),
 ('dos_integral',{'energy_eV':[0,1,2],'dos_states_eV_cell':[1,1,1]},{'energy_min_eV':0,'energy_max_eV':3},'区间'),
 ('elastic_tensor_vrh',{'stiffness_GPa':(-np.eye(6)).tolist()}, {},'正定'),
 ('williamson_hall',{'two_theta_deg':[30,40,50],'fwhm_deg':[.1]*3,'instrument_fwhm_deg':[.2]*3},{'wavelength_angstrom':1.54},'仪器展宽'),
 ('creep_rate',{'time_s':[0,2,1],'strain':[0,.1,.2]},{'fit_min':0,'fit_max':2},'递增'),
])
def test_materials_rejects_invalid_science_inputs(tmp_path,op,data,args,word):
    result=invoke(tmp_path,op,data,args)
    assert not result['success'] and word in result['error']


def test_materials_output_symlink_cannot_modify_source(tmp_path):
    outside=tmp_path/'protected.csv';outside.write_text('private source')
    output=tmp_path/'output';output.mkdir();(output/'result.csv').symlink_to(outside)
    result=invoke(tmp_path,'specific_capacity',{'time_s':[0,1],'current_A':[1,1]},{'active_mass_g':1})
    assert not result['success'] and '越出' in result['error']
    assert outside.read_text()=='private source'


def test_materials_unsupported_name_not_registered():
    registry=load_registry(ROOT/'tools')
    assert len([name for name in registry if name.startswith('materials_')])==25


def test_materials_defaults_and_calibrated_centroids(tmp_path):
    out=invoke(tmp_path,'micrograph_particles','image',{'threshold_8bit':100,'pixel_size_um':.5})
    assert out['success'],out
    assert out['parameters']['exclude_boundary'] is True
    assert out['parameters']['min_area_pixels']==5
    rows=pd.read_csv(out['artifacts'][1]['path'])
    assert rows.iloc[0]['centroid_x_um']==pytest.approx(7.5)
    assert rows.iloc[0]['centroid_y_um']==pytest.approx(7.5)
    assert rows.iloc[0]['area_um2']==25
