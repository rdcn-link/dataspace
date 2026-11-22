"""Self-contained HTML artifact displayed by the existing sandboxed HTML preview."""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np


def render(ds, a, args):
    from operations import coord, grid, clean, output_path, artifact, MAX_VALUES
    from science import vertical, paired
    if a.size > MAX_VALUES:
        raise ValueError('浏览总数据超过 200 万数值，请先使用 netcdf_subset 裁剪')
    lon, lat = grid(ds, a, args)
    z, depths, kind, label = vertical(ds, a, args)
    t = coord(ds, 'time', args, False)
    dims = ([ds[t].dims[0]] if t and ds[t].dims[0] in a.dims else []) + [ds[z].dims[0], ds[lat].dims[0], ds[lon].dims[0]]
    if len(set(dims)) != len(dims) or set(a.dims) != set(dims):
        raise ValueError('浏览变量须仅包含独立的时间（可选）、垂直、纬度、经度维度；请先裁剪额外维度')
    for name in (lon, lat):
        c = ds[name].values
        if len(c) > 2 and not np.allclose(np.diff(c), np.diff(c)[0], rtol=1e-5, atol=1e-7):
            raise ValueError('联动浏览的区域面积权重要求等间距经纬度网格，请先使用 netcdf_regrid')
    variables = [(a.name, a)]
    for key, qc in [('salinity_variable', 'salinity_qc_variable'), ('eastward_variable', 'eastward_qc_variable'), ('northward_variable', 'northward_qc_variable')]:
        if args.get(key) and args[key] not in [n for n, _ in variables]:
            variables.append((args[key], paired(ds, a, args[key], args, qc)))
    if bool(args.get('eastward_variable')) != bool(args.get('northward_variable')):
        raise ValueError('海流箭头须同时指定 eastward_variable 和 northward_variable')
    if args.get('eastward_variable'):
        u, v = ds[args['eastward_variable']], ds[args['northward_variable']]
        if u.attrs.get('standard_name') != 'eastward_sea_water_velocity' or v.attrs.get('standard_name') != 'northward_sea_water_velocity' or u.attrs.get('units') != v.attrs.get('units') or u.attrs.get('units') not in ('m/s', 'm s-1', 'cm/s', 'cm s-1'):
            raise ValueError('海流箭头要求同单位的地理东向/北向速度分量')
    if a.size * len(variables) > MAX_VALUES:
        raise ValueError('浏览总数据超过 200 万数值，请先使用 netcdf_subset 裁剪；不会静默抽样')
    order = {ds[lon].dims[0]: np.argsort(ds[lon].values), ds[lat].dims[0]: np.argsort(ds[lat].values), ds[z].dims[0]: np.argsort(depths)}
    payload = {'x': sorted(ds[lon].values.tolist()), 'y': sorted(ds[lat].values.tolist()), 'z': sorted(depths.tolist()),
        'verticalLabel': label, 'verticalKind': kind,
        'times': [str(v) for v in ds[t].values] if t and ds[t].dims[0] in a.dims else ['无时间维度'],
        'variables': {}, 'initial': a.name, 'salinity': args.get('salinity_variable'),
        'u': args.get('eastward_variable'), 'v': args.get('northward_variable'),
        'quality': '已按显式质量规则筛选' if args.get('qc_variable') else '未应用质量标记；已排除缺测值'}
    quality_by_variable = {args[key]: bool(args.get(qc)) for key, qc in [('salinity_variable', 'salinity_qc_variable'), ('eastward_variable', 'eastward_qc_variable'), ('northward_variable', 'northward_qc_variable')] if args.get(key)}
    quality_by_variable[a.name] = bool(args.get('qc_variable'))
    for name, variable in variables:
        data = variable.isel(order).transpose(*dims).values
        payload['variables'][name] = {'units': str(variable.attrs.get('units', '未声明')),
                                       'quality': '已按显式质量规则筛选' if quality_by_variable.get(name) else '未应用质量标记；已排除缺测值',
                                       'values': clean(data.reshape(-1))}
    path = output_path(args, '.html')
    encoded = json.dumps(clean(payload), ensure_ascii=False, allow_nan=False).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    root = Path(__file__).parent
    html = (root / 'viewer.html').read_text().replace('/*OCEAN_MATH*/', (root / 'ocean_math.js').read_text()).replace('/*OCEAN_UI*/', (root / 'viewer.js').read_text()).replace('/*OCEAN_DATA*/', encoded)
    path.write_text(html, encoding='utf-8')
    return {'answer_ready': True, 'output_path': str(path), 'artifacts': [artifact(path, 'text/html')],
        'summary': {'variables': list(payload['variables']), 'shape': [len(payload[k]) for k in ('times', 'z', 'y', 'x')],
                    'vertical_kind': kind, 'quality': payload['quality']},
        'method': 'linked_rectilinear_ocean_view_nearest_cell_cos_latitude_mean',
        'warnings': ['断面采用经纬度线性路径、最近格点采样；缺测不插值。温盐图仅显示有效配对，不自动判定水团。']}
