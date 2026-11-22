"""Bounded, unit-explicit input and auditable output for materials experiments."""
from __future__ import annotations
import json
import os
from pathlib import Path
import numpy as np
import pandas as pd
from scipy.stats import linregress

MAX_ROWS=100_000
MAX_BYTES=20_000_000


def number(args,key,default=None,positive=False):
    value=float(args.get(key,default))
    if not np.isfinite(value) or (positive and value<=0):
        raise ValueError(f'{key} 必须为有限'+('正数' if positive else '数值'))
    return value


def source(args):
    path=Path(args['input_path'])
    if not path.is_file() or path.stat().st_size>MAX_BYTES:
        raise ValueError('输入须为不超过 20MB 的本地数据文件')
    return path


def table(args,names,min_rows=2):
    path=source(args)
    if path.suffix.lower() not in ('.csv','.tsv'):
        raise ValueError('实验表格须为 CSV 或 TSV；请先使用已有表格工具转换')
    columns=args.get('columns',{})
    if not isinstance(columns,dict):raise ValueError('columns 须为逻辑列名到实际表头的映射')
    df=pd.read_csv(path,sep='\t' if path.suffix.lower()=='.tsv' else ',',nrows=MAX_ROWS+1)
    if not min_rows<=len(df)<=MAX_ROWS:raise ValueError(f'输入需要 {min_rows}–{MAX_ROWS} 行')
    result={}
    for name in names:
        actual=columns.get(name,name)
        if actual not in df:raise ValueError(f'缺少列 {name}；可通过 columns 映射实际表头')
        try:values=pd.to_numeric(df[actual],errors='raise').to_numpy(dtype=float)
        except (ValueError,TypeError) as exc:raise ValueError(f'{name} 必须为数值') from exc
        if not np.isfinite(values).all():raise ValueError(f'{name} 含缺测或非有限值；请先明确处理，不自动删行跨越间隙')
        result[name]=values
    return result


def positive(*arrays):
    if any((np.asarray(a)<=0).any() for a in arrays):raise ValueError('此计算要求严格正值')


def increasing(x):
    if not (np.diff(x)>0).all():raise ValueError('横坐标须严格递增且唯一；请先分离升降程或循环')


def window(x,args,lo='fit_min',hi='fit_max',minimum=3):
    lower=number(args,lo);upper=number(args,hi)
    if lower>=upper or lower<x.min() or upper>x.max():raise ValueError('所选区间须完全位于观测范围内')
    mask=(x>=lower)&(x<=upper)
    if mask.sum()<minimum:raise ValueError(f'所选区间至少需要 {minimum} 个观测点')
    return mask


def linear(x,y):
    if len(x)<3 or np.unique(x).size<3:raise ValueError('线性拟合至少需要三个不同横坐标')
    fit=linregress(x,y)
    if not np.isfinite([fit.slope,fit.intercept]).all():raise ValueError('拟合不可辨识')
    prediction=fit.intercept+fit.slope*x
    return {'slope':float(fit.slope),'intercept':float(fit.intercept),'r_squared':float(fit.rvalue**2),'slope_stderr':float(fit.stderr),'rmse':float(np.sqrt(np.mean((y-prediction)**2))),'sample_count':len(x)},prediction


def interval(x,y,lower,upper):
    increasing(x)
    if not x[0]<=lower<upper<=x[-1]:raise ValueError('积分区间不得超出观测范围')
    xx=np.r_[lower,x[(x>lower)&(x<upper)],upper]
    return xx,np.interp(xx,x,y)


def result(summary,columns,*,x=None,ys=None,xlabel='',ylabel='',kind='line',notes=None):
    return {'summary':summary,'columns':columns,'plot':{'x':x,'ys':ys or {},'xlabel':xlabel,'ylabel':ylabel,'kind':kind},'notes':notes or []}


def fit_result(x,y,summary,xlabel,ylabel,notes=None):
    fit,prediction=linear(x,y)
    return result({**summary,**fit},{'x':x,'observed':y,'fitted':prediction},x=x,ys={'observed':y,'fit':prediction},xlabel=xlabel,ylabel=ylabel,notes=notes)


def clean(value):
    if isinstance(value,dict):return {str(k):clean(v) for k,v in value.items()}
    if isinstance(value,(tuple,list)):return [clean(v) for v in value]
    if isinstance(value,np.ndarray):return clean(value.tolist())
    if isinstance(value,np.generic):return clean(value.item())
    if isinstance(value,float) and not np.isfinite(value):return None
    return value


def output_path(args):
    target=Path(args['output_path']).resolve()
    root=Path(os.getenv('AI_DATASEEK_OUTPUT_ROOT','/home/ubuntu/output')).resolve()
    if root not in target.parents or target.suffix.lower()!='.json':raise ValueError('output_path 须为分析结果目录下的 .json 文件')
    input_path=source(args).resolve()
    for candidate in (target, target.with_suffix('.csv'), target.with_suffix('.png')):
        resolved = candidate.resolve()
        if root not in resolved.parents:
            raise ValueError('结果文件链接不得越出分析结果目录')
        if input_path == resolved:
            raise ValueError('输出不可覆盖源文件')
    target.parent.mkdir(parents=True,exist_ok=True)
    return target


def emit(op,args,data):
    from plots import render
    path=output_path(args)
    columns=data['columns']
    sizes={len(v) for v in columns.values()}
    if len(sizes)>1:raise ValueError('结果列长度不一致')
    pd.DataFrame(columns).to_csv(path.with_suffix('.csv'),index=False)
    render(data,path.with_suffix('.png'),op)
    payload={'success':True,'answer_ready':True,'operation':op,'summary':clean(data['summary']),'notes':data['notes'],
        'parameters':{k:clean(v) for k,v in args.items() if k not in ('input_path','output_path','columns')},
        'row_count':next(iter(sizes),0),'columns':list(columns),'provenance':{'plugin':'materials','version':'1.0.0'},'artifacts':[]}
    # JSON itself records no host source path; artifact locations are returned to the existing artifact pipeline.
    path.write_text(json.dumps(payload,ensure_ascii=False,allow_nan=False,indent=2),encoding='utf-8')
    payload['artifacts']=[{'path':str(p),'type':kind,'size_bytes':p.stat().st_size} for p,kind in [(path,'application/json'),(path.with_suffix('.csv'),'text/csv'),(path.with_suffix('.png'),'image/png')]]
    return payload
