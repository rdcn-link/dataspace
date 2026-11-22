"""Companion figures; full coordinates and values remain in the NetCDF artifact."""
from __future__ import annotations

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt


def is_vertical(c):
    return c.attrs.get('positive') in ('up', 'down') or c.attrs.get('standard_name') in ('depth', 'height', 'sea_water_pressure')


def axis(a, dim):
    candidates = [c for c in a.coords.values() if c.dims == (dim,)]
    physical = [c for c in candidates if is_vertical(c) or c.attrs.get('standard_name') in ('time', 'latitude', 'longitude') or c.attrs.get('units')]
    c = (physical or candidates or [None])[0]
    if c is None:
        return np.arange(a.sizes[dim]), dim + ' index', None
    return c.values, str(c.name) + (' (' + str(c.attrs['units']) + ')' if c.attrs.get('units') else ''), c


def categorical_ticks(ax, values, direction='x'):
    ticks = np.unique(np.linspace(0, len(values)-1, min(5, len(values))).astype(int))
    setter = ax.set_xticks if direction == 'x' else ax.set_yticks
    setter(ticks, [str(values[i])[:19] for i in ticks], rotation=20 if direction == 'x' else 0)


def preview(ds, path, method):
    fig, ax = plt.subplots(figsize=(8, 5), constrained_layout=True)
    try:
        if 'temperature' in ds and 'salinity' in ds and ds.temperature.dims == ('observation',):
            ax.scatter(ds.salinity.values, ds.temperature.values, s=5, alpha=.5)
            ax.set_xlabel('Salinity (' + ds.salinity.attrs.get('units', '?') + ')')
            ax.set_ylabel('Temperature (' + ds.temperature.attrs.get('units', '?') + ')')
        else:
            a = next(iter(ds.data_vars.values()))
            selected = []
            while a.ndim > 2:
                dim = a.dims[0]
                selected.append(dim + '=index 0')
                a = a.isel({dim: 0})
            value_label = a.name + ' (' + a.attrs.get('units', '?') + ')'
            if a.ndim == 0:
                ax.text(.5, .5, str(a.item()), ha='center', va='center', transform=ax.transAxes)
            elif a.ndim == 1:
                values, label, c = axis(a, a.dims[0])
                if c is not None and is_vertical(c):
                    ax.plot(a.values, values)
                    ax.set_xlabel(value_label); ax.set_ylabel(label)
                    if c.attrs.get('positive', 'down') == 'down': ax.invert_yaxis()
                else:
                    ax.plot(np.arange(a.size), a.values)
                    categorical_ticks(ax, values)
                    ax.set_xlabel(label); ax.set_ylabel(value_label)
            else:
                y, x = a.dims
                vertical = [d for d in a.dims if axis(a, d)[2] is not None and is_vertical(axis(a, d)[2])]
                if vertical:
                    y = vertical[0]; x = next(d for d in a.dims if d != y); a = a.transpose(y, x)
                xx, xlabel, xc = axis(a, x)
                yy, ylabel, yc = axis(a, y)
                if x == 'sample' and 'distance_km' in ds:
                    xx = ds.distance_km.values; xlabel = 'Distance (km)'
                numeric_x = np.issubdtype(np.asarray(xx).dtype, np.number)
                numeric_y = np.issubdtype(np.asarray(yy).dtype, np.number)
                mesh = ax.pcolormesh(xx if numeric_x else np.arange(len(xx)), yy if numeric_y else np.arange(len(yy)), a.values, shading='nearest', cmap='viridis')
                if not numeric_x: categorical_ticks(ax, xx)
                if not numeric_y: categorical_ticks(ax, yy, 'y')
                fig.colorbar(mesh, ax=ax, label=value_label)
                ax.set_xlabel(xlabel); ax.set_ylabel(ylabel)
                if vertical and yc.attrs.get('positive', 'down') == 'down': ax.invert_yaxis()
            if selected: ax.set_title('Preview: ' + ', '.join(selected))
        fig.suptitle(method.replace('_', ' '))
        fig.savefig(path, dpi=130)
        return path
    finally:
        plt.close(fig)
