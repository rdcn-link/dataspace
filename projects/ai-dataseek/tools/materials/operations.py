"""Trusted materials diagnostics; input names describe the required physical units."""
from __future__ import annotations
import base64,json,sys
from pathlib import Path
from common import clean,emit
import mechanics as m
import thermal as t
import electronic as e
import structure as s

OPERATIONS={
'materials_elastic_modulus':m.elastic,
'materials_offset_yield':m.offset_yield,
'materials_true_stress_strain':m.true_curve,
'materials_strain_energy':m.strain_energy,
'materials_creep_rate':m.creep,
'materials_fatigue_basquin':m.fatigue,
'materials_vickers_hardness':m.vickers,
'materials_elastic_tensor_vrh':m.elastic_tensor,
'materials_thermal_expansion':t.expansion,
'materials_flash_diffusivity':t.flash,
'materials_dsc_enthalpy':t.dsc,
'materials_tga_analysis':t.tga,
'materials_arrhenius_fit':t.arrhenius,
'materials_kissinger_fit':t.kissinger,
'materials_band_edges':e.band_edges,
'materials_dos_integral':e.dos_integral,
'materials_tauc_gap':e.tauc,
'materials_four_probe_resistivity':e.four_probe,
'materials_specific_capacity':e.capacity,
'materials_impedance_rc_fit':e.impedance,
'materials_williamson_hall':s.williamson_hall,
'materials_cubic_lattice_fit':s.cubic_lattice,
'materials_lattice_strain':s.lattice_strain,
'materials_micrograph_particles':s.microscopy,
'materials_bet_surface_area':s.bet,
}

def run(op,args):
    if op not in OPERATIONS:raise ValueError('未注册的材料工具')
    definitions=json.loads(Path(__file__).with_name('manifest.json').read_text())['tools']
    schema=next(item['parameters'] for item in definitions if item['name']==op)
    if not isinstance(args,dict) or set(args)-set(schema['properties']):
        raise ValueError('输入必须为仅含已声明参数的对象')
    if set(schema['required'])-set(args):
        raise ValueError('缺少必填参数：'+', '.join(sorted(set(schema['required'])-set(args))))
    resolved={key:value['default'] for key,value in schema['properties'].items() if 'default' in value}
    resolved.update(args)
    return emit(op,resolved,OPERATIONS[op](resolved))

if __name__=='__main__':
    try:
        args=json.loads(base64.urlsafe_b64decode(sys.argv[2]+'='*(-len(sys.argv[2])%4)))
        payload=run(sys.argv[1],args)
    except Exception as exc:
        payload={'success':False,'error':f'{type(exc).__name__}: {exc}'}
    print(json.dumps(clean(payload),ensure_ascii=False,allow_nan=False))
