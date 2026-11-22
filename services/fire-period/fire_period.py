import csv, hashlib, importlib.util, io, json, os, sys, tempfile, zipfile
from pathlib import Path
from fire_core import normalize, merge, bins

def read_bundle(raw):
    if len(raw)>32*1024*1024:raise ValueError('Summary too large')
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        if z.getinfo('summary.json').file_size>8*1024*1024:raise ValueError('Summary too large')
        return json.loads(z.read('summary.json'))

def tools():
    spec=importlib.util.spec_from_file_location('seed_tabular', '/opt/ai-dataseek/tools/tabular/operations.py')
    module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module); return module

def emit(ctx, folder):
    buffer=io.BytesIO()
    with zipfile.ZipFile(buffer,'w',zipfile.ZIP_DEFLATED) as z:
        for p in folder.rglob('*'):
            if p.is_file(): z.write(p,p.relative_to(folder).as_posix())
    ctx.bytes_output('result','zip').write(buffer.getvalue())

def local(ctx, folder):
    raw=b''.join(ctx.input('source').bytes())
    if len(raw)>16*1024*1024:raise ValueError('Input too large')
    params=ctx.params;rows,quality,hashes=normalize(raw,params);op=tools()
    source=folder/'normalized.csv'
    with source.open('w',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=['detection_id','period','source']);writer.writeheader();writer.writerows(rows)
    profile=op.table_profile(dict(input_path=str(source)))
    aggregate=op.filter_aggregate(dict(input_path=str(source),group_by=['period','source'],aggregations={'detection_id':'count'},output_path=str(folder/'local-aggregate.csv')))
    groups=[dict(period=x['period'],source=x['source'],count=int(x['detection_id'])) for x in csv.DictReader((folder/'local-aggregate.csv').open())]
    # Empty local selections are valid and retain zero bins for the final merge.
    chart_source,ys=write_series(folder,groups,quality['scope'],'local-series.csv')
    chart=op.visualize(dict(input_path=str(chart_source),chart='bar' if len(bins(quality['scope']))<=24 else 'line',x='period',y=ys,title='Synthetic human/MODIS records / UTC+08:00',output_path=str(folder/'local-chart.png')))
    parameterHash=hashlib.sha256(json.dumps(dict(fieldMapping=params['fieldMapping'],scope=quality['scope'],sampleLimit=params['sampleLimit']),sort_keys=True).encode()).hexdigest()
    summary=dict(serviceId='svc-023',version='1.1',node=params['node'],synthetic=True,unit='detection records',**quality,groups=groups,detectionHashes=hashes,parameterHash=parameterHash,inputHash=hashlib.sha256(raw).hexdigest(),operators=['table_profile','table_filter_aggregate','tabular_visualize'],scientificOperatorsExecuted=True)
    (folder/'summary.json').write_text(json.dumps(summary,ensure_ascii=False))
    source.unlink()
    for column in profile['summary']['columns'].values():column.pop('examples',None)
    (folder/'operator-reports.json').write_text(json.dumps([profile,aggregate,chart],ensure_ascii=False))

def write_series(folder,groups,scope,name):
    sources=['human','modis'] if scope['groupBySource'] else ['all'];counts={(g['period'],g['source']):g['count'] for g in groups}
    ys=['count_'+s for s in sources];path=folder/name
    with path.open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=['period',*ys]);w.writeheader();w.writerows([dict(period=p,**{'count_'+s:counts.get((p,s),0) for s in sources}) for p in bins(scope)])
    return path,ys

def main(kind):
    from xstream_operator import OperatorContext, descriptor, result, run_inference
    if len(sys.argv)>1 and sys.argv[1] in ('infer','infer-worker'):
        def infer(inputs,params):
            ports=['source'] if kind=='local' else ['p'+str(i) for i in range(len(params['nodes']))]
            if set(inputs)!=set(ports) or any('bytes' not in v.get('representations',[]) for v in inputs.values()): raise ValueError('Expected byte streams on all declared ports')
            return result({'result':descriptor(['bytes'],['zip'],certainty='known')})
        run_inference(infer); return
    with OperatorContext() as ctx, tempfile.TemporaryDirectory(prefix='fire-period-') as d:
        folder=Path(d);os.environ['AI_DATASEEK_OUTPUT_ROOT']=d
        if kind=='local': local(ctx,folder)
        else:
            report=merge([read_bundle(b''.join(ctx.input('p'+str(i)).bytes())) for i in range(len(ctx.params['nodes']))],ctx.params['nodes'])
            (folder/'summary.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
            with (folder/'comparison.csv').open('w',newline='') as f:
                writer=csv.DictWriter(f,fieldnames=list(report['groups'][0]));writer.writeheader();writer.writerows(report['groups'])
            chart_path,ys=write_series(folder,report['groups'],report['scope'],'comparison-chart.csv')
            tools().visualize(dict(input_path=str(chart_path),chart='bar' if len(bins(report['scope']))<=24 else 'line',x='period',y=ys,title='Synthetic human/MODIS records / UTC+08:00',output_path=str(folder/'comparison.png')))
        emit(ctx,folder)
