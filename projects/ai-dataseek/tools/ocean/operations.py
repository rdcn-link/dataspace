"""Bounded ocean analyses. Never infer physical depth from a model-level index."""
from __future__ import annotations

import base64
import json
import os
import sys
from pathlib import Path

import numpy as np
import xarray as xr

MAX_VALUES = 2_000_000
ALIASES = {'longitude': ('lon', 'longitude'), 'latitude': ('lat', 'latitude'),
           'vertical': ('depth', 'deptht', 'lev', 'level', 'pres', 'pressure'),
           'time': ('time',)}
STANDARD = {'longitude': ('longitude',), 'latitude': ('latitude',),
            'vertical': ('depth', 'height', 'sea_water_pressure'), 'time': ('time',)}


def clean(v):
    if isinstance(v, dict):
        return {str(k): clean(x) for k, x in v.items()}
    if isinstance(v, (list, tuple)):
        return [clean(x) for x in v]
    if isinstance(v, np.ndarray):
        return clean(v.tolist())
    if isinstance(v, np.generic):
        return clean(v.item())
    if isinstance(v, float) and not np.isfinite(v):
        return None
    return v


def coord(ds, role, args, required=True):
    explicit = args.get(role + '_coordinate')
    candidates = [explicit] if explicit else [n for n in ds.variables if
        ds[n].attrs.get('standard_name') in STANDARD[role] or n.lower() in ALIASES[role]]
    candidates = list(dict.fromkeys(candidates))
    if len(candidates) != 1:
        if not candidates and not required:
            return None
        raise ValueError(f'{role} 坐标缺失或不唯一，请显式指定 {role}_coordinate')
    name = candidates[0]
    if name not in ds or ds[name].ndim != 1:
        raise ValueError(f'{role} 当前要求一维独立坐标；曲线网格及轨迹数据请先转换')
    return name


def bounded(a):
    if a.size > MAX_VALUES:
        raise ValueError('所选数据超过 200 万数值，请先使用 netcdf_subset 裁剪时间、区域或深度')
    return a.load()


def pick(ds, args):
    name = args.get('variable')
    if name not in ds.data_vars:
        raise ValueError('请从文件探查结果中明确指定 variable，不自动选取首个变量')
    a = ds[name]
    if not np.issubdtype(a.dtype, np.number):
        raise ValueError('目标变量必须是数值型')
    for role in ALIASES:
        candidates = [args[role + '_coordinate']] if args.get(role + '_coordinate') else [n for n in ds.variables if ds[n].attrs.get('standard_name') in STANDARD[role] or n.lower() in ALIASES[role]]
        for coordinate in candidates:
            if coordinate in ds and ds[coordinate].ndim == 1 and set(ds[coordinate].dims) <= set(a.dims):
                a = a.assign_coords({coordinate: ds[coordinate]})
    return a


def time_pick(ds, a, args):
    t = coord(ds, 'time', args, False)
    if t and ds[t].dims[0] in a.dims:
        index = int(args.get('time_index', 0))
        if index < 0 or index >= ds[t].size:
            raise ValueError('time_index 超出范围')
        return a.isel({ds[t].dims[0]: index})
    return a


def grid(ds, a, args):
    names = [coord(ds, role, args) for role in ('longitude', 'latitude')]
    for name, role in zip(names, ('longitude', 'latitude')):
        c = ds[name]
        if c.dims[0] not in a.dims or c.size < 1 or c.size > MAX_VALUES:
            raise ValueError('变量不包含指定水平坐标')
        values = np.asarray(c.values, dtype=float)
        if not np.all(np.isfinite(values)) or (len(values) > 1 and not
                (np.all(np.diff(values) > 0) or np.all(np.diff(values) < 0))):
            raise ValueError('水平坐标须有限、唯一且单调')
        unit = str(c.attrs.get('units', '')).lower()
        accepted = ('degrees_east', 'degree_east', 'degrees_e', 'degree_e') if role == 'longitude' else ('degrees_north', 'degree_north', 'degrees_n', 'degree_n')
        if unit not in accepted:
            raise ValueError('水平坐标须明确声明经纬度角度单位，不能将投影坐标当作经纬度')
        if role == 'longitude' and np.ptp(values) >= 360:
            raise ValueError('经度不得包含重复的周期端点或超过一个周期')
        if role == 'latitude' and np.any(np.abs(values) > 90):
            raise ValueError('纬度超出有效范围')
    return names


def point(ds, a, args):
    lon, lat = grid(ds, a, args)
    x, y = float(args['longitude']), float(args['latitude'])
    if not np.isfinite(y) or not -90 <= y <= 90 or not np.isfinite(x):
        raise ValueError('无效经纬度')
    xv, yv = ds[lon].values, ds[lat].values
    center = float(np.mean(xv))
    mapped = center + (x - center + 180) % 360 - 180
    if not float(np.min(xv)) <= mapped <= float(np.max(xv)) or not float(np.min(yv)) <= y <= float(np.max(yv)):
        raise ValueError('选点超出网格覆盖范围')
    # Longitude distance is circular; preserve the selected source coordinate.
    ix = int(np.argmin(np.abs((xv - x + 180) % 360 - 180)))
    iy = int(np.argmin(np.abs(yv - y)))
    return a.isel({ds[lon].dims[0]: ix, ds[lat].dims[0]: iy}), {
        'selected_longitude': float(xv[ix]), 'selected_latitude': float(yv[iy]),
        'method': 'nearest_grid_cell'}


def output_path(args, suffix):
    path = Path(args['output_path']).resolve()
    root = Path(os.getenv('AI_DATASEEK_OUTPUT_ROOT', '/home/ubuntu/output')).resolve()
    if root not in path.parents:
        raise ValueError('输出必须位于分析结果目录内')
    if path.suffix.lower() != suffix:
        raise ValueError(f'输出路径必须使用 {suffix} 扩展名')
    if path == Path(args['input_path']).resolve():
        raise ValueError('输出不可覆盖源文件')
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def artifact(path, kind):
    return {'path': str(path), 'type': kind, 'size_bytes': path.stat().st_size}


def export(a, args, method, all_previews=False):
    path = output_path(args, '.nc')
    result = a.to_dataset(name=a.name or 'result') if isinstance(a, xr.DataArray) else a
    # Keep scientific coordinate metadata, never copy arbitrary source attributes/host paths.
    allowed = {'units', 'standard_name', 'long_name', 'positive', 'calendar', 'axis', 'convention', 'reference_pressure_dbar', 'flag_values', 'flag_meanings', 'threshold', 'reference_depth_m', 'criterion', 'temperature_value', 'top_depth_m', 'bottom_depth_m', 'reference_salinity', 'reference_temperature', 'reference_density', 'heat_capacity'}
    result = result.copy(deep=False)
    result.attrs = {'processing_method': method}
    for key in ('baseline_start', 'baseline_end'):
        if key in args:
            result.attrs[key] = str(args[key])
    for name in result.variables:
        result[name].attrs = {k: v for k, v in result[name].attrs.items() if k in allowed}
    result.to_netcdf(path)
    with xr.open_dataset(path) as check:
        if not check.data_vars:
            raise ValueError('结果校验失败')
    artifacts = [artifact(path, 'application/x-netcdf')]
    if args.get('visualize', True):
        from plots import preview
        names = [n for n in result if not n.endswith(('_status', '_count'))] if all_previews else [None]
        for index, name in enumerate(names):
            target = path.with_suffix('.png') if index == 0 else path.with_name(path.stem + f'-{index+1}.png')
            png = preview(result[[name]] if name else result, target, method)
            if png:
                item = artifact(png, 'image/png')
                if name:
                    item['variable'] = name
                artifacts.append(item)
    return {'output_path': str(path), 'method': method, 'dimensions': dict(result.sizes),
            'artifacts': artifacts, 'answer_ready': True}


def run(op, args):
    from science import vertical, depth_pick, quality, paired, region, transect, thermodynamics
    with xr.open_dataset(args['input_path']) as ds:
        if op == 'ocean_inspect':
            return {'file': Path(args['input_path']).name, 'dimensions': dict(ds.sizes),
                    'variables': [{'name': n, 'dimensions': list(v.dims), 'units': v.attrs.get('units'),
                                   'standard_name': v.attrs.get('standard_name'),
                                   'positive': v.attrs.get('positive'),
                                   'formula_terms': v.attrs.get('formula_terms'),
                                   'ancillary_variables': v.attrs.get('ancillary_variables'),
                                   'flag_values': clean(v.attrs.get('flag_values')),
                                   'flag_masks': clean(v.attrs.get('flag_masks')),
                                   'flag_meanings': v.attrs.get('flag_meanings')}
                                  for n, v in list(ds.variables.items())[:256]],
                    'truncated': len(ds.variables) > 256,
                    'note': '深度、压力和模型层号不等价；质量标记需显式应用，不自动接受可疑观测。'}
        a = pick(ds, args)
        a = quality(ds, a, args)
        from advanced import TOOLS, run as run_advanced
        if op in TOOLS:
            return export(run_advanced(op, ds, a, args), args, op, all_previews=True)
        if op == 'ocean_qc_mask':
            if not args.get('qc_variable'):
                raise ValueError('必须指定 qc_variable')
            return {**export(a, args, 'explicit_quality_flag_mask'),
                    'valid_count': int(a.count()), 'masked_or_missing_count': int(a.size - a.count())}
        if op == 'ocean_depth_slice':
            a = time_pick(ds, a, args)
            a, info = depth_pick(ds, a, args)
            return {**export(bounded(a), args, op), **info}
        if op == 'ocean_transect':
            a = time_pick(ds, a, args)
            vertical(ds, a, args)
            return export(transect(ds, a, args), args, 'ocean_transect_nearest_lonlat_linear_track')
        if op == 'ocean_thermodynamics':
            return export(thermodynamics(ds, a, args), args, 'TEOS-10_SA_CT_density_sigma0')
        if op in ('ocean_profile', 'ocean_time_depth'):
            a, info = point(ds, a, args)
            z, _, _, _ = vertical(ds, a, args)
            if ds[z].dims[0] not in a.dims:
                raise ValueError('变量不含垂直维度')
            if op == 'ocean_profile':
                a = time_pick(ds, a, args)
            else:
                t = coord(ds, 'time', args)
                if ds[t].dims[0] not in a.dims:
                    raise ValueError('变量不含时间维度')
            return {**export(bounded(a), args, op), **info,
                    'vertical_units': ds[z].attrs.get('units'), 'positive': ds[z].attrs.get('positive')}
        if op == 'ocean_region_timeseries':
            t = coord(ds, 'time', args)
            if ds[t].dims[0] not in a.dims:
                raise ValueError('变量不含时间维度')
            if 'depth_index' in args or 'depth_value' in args:
                a, _ = depth_pick(ds, a, args)
            a, weights, dims = region(ds, a, args)
            bounded(a)
            out = a.weighted(weights).mean(dims, keep_attrs=True)
            return export(out, args, 'cos_latitude_area_weighted_mean_valid_cells')
        if op == 'ocean_current_speed':
            b = paired(ds, a, args['northward_variable'], args, 'northward_qc_variable')
            if a.attrs.get('standard_name') != 'eastward_sea_water_velocity' or b.attrs.get('standard_name') != 'northward_sea_water_velocity':
                raise ValueError('流速分量必须以 standard_name 声明为地理东向与北向，不能将模型网格方向当作真北')
            if a.dims != b.dims or a.shape != b.shape:
                raise ValueError('流速分量必须同格点、同维度；交错网格需先重网格')
            if a.attrs.get('units') != b.attrs.get('units') or a.attrs.get('units') not in ('m/s', 'm s-1', 'cm/s', 'cm s-1'):
                raise ValueError('流速分量需有相同且明确的速度单位')
            bounded(a); bounded(b)
            speed = np.hypot(a, b).rename('speed')
            speed.attrs = {'units': a.attrs['units'], 'long_name': 'Horizontal current speed'}
            direction = ((np.rad2deg(np.arctan2(a, b)) + 360) % 360).where(speed > 0).rename('direction')
            direction.attrs = {'units': 'degree', 'convention': 'towards, clockwise from true north; input must be earth-relative'}
            return export(xr.Dataset({'speed': speed, 'direction': direction}), args, 'earth_relative_vector_speed_direction')
        if op == 'ocean_temperature_salinity':
            b = paired(ds, a, args['salinity_variable'], args, 'salinity_qc_variable')
            if a.dims != b.dims or a.shape != b.shape:
                raise ValueError('温盐变量须同格点逐项配对')
            bounded(a); bounded(b)
            good = np.isfinite(a.values) & np.isfinite(b.values)
            av, bv = a.values[good], b.values[good]
            if av.size < 2:
                raise ValueError('有效温盐配对不足')
            corr = float(np.corrcoef(av, bv)[0, 1]) if av.std() and bv.std() else None
            result = xr.Dataset({'temperature': ('observation', av), 'salinity': ('observation', bv)})
            result.temperature.attrs = a.attrs; result.salinity.attrs = b.attrs
            return {**export(result, args, 'finite_paired_temperature_salinity_no_unit_conversion'),
                    'valid_pairs': int(av.size), 'correlation': corr,
                    'note': '仅配对统计，不推断水团；未将实用盐度转换为绝对盐度。'}
        if op == 'ocean_interactive_view':
            from viewer import render
            return render(ds, a, args)
        raise ValueError('未知海洋工具')


if __name__ == '__main__':
    try:
        args = json.loads(base64.urlsafe_b64decode(sys.argv[2]).decode())
        result = {'success': True, **run(sys.argv[1], args)}
    except Exception as exc:
        result = {'success': False, 'error': f'{type(exc).__name__}: {exc}'}
    print(json.dumps(clean(result), ensure_ascii=False, allow_nan=False))
