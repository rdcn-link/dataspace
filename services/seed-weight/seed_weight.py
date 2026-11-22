"""Seed-weight application plugin: local scientific pipeline and summary-only merge."""
import csv, hashlib, importlib.util, io, json, math, os, sys, tempfile, zipfile
from pathlib import Path

VERSION = '1.0'
MAPPING = dict(sample_id='sample_id', species='species', life_form='life_form', weight='weight', unit='unit')

def normalize(raw, params):
    mapping = params.get('fieldMapping') or MAPPING
    if set(mapping) != set(MAPPING) or not all(isinstance(v, str) and v for v in mapping.values()):
        raise ValueError('Bind sample_id, species, life_form, weight and unit explicitly')
    scope = params.get('analysisScope') or {}
    if set(scope) - {'groupBy', 'species', 'invalidPolicy'}: raise ValueError('Unsupported analysis scope')
    group = scope.get('groupBy', 'species')
    if group not in ('species', 'life_form'): raise ValueError('groupBy must be species or life_form')
    policy = scope.get('invalidPolicy', 'reject')
    if policy not in ('reject', 'exclude'): raise ValueError('invalidPolicy must be reject or exclude')
    selected = scope.get('species', [])
    if not isinstance(selected, list) or any(not isinstance(x, str) for x in selected): raise ValueError('species must be an array of names')
    limit = params.get('sampleLimit', 1000)
    if isinstance(limit, bool) or not isinstance(limit, int) or not 1 <= limit <= 20000: raise ValueError('sampleLimit must be 1..20000; overflow is rejected, never truncated')
    reader = csv.DictReader(io.StringIO(raw.decode('utf-8-sig')))
    if not reader.fieldnames or not set(mapping.values()) <= set(reader.fieldnames): raise ValueError('Missing mapped columns')
    rows, rejected, filtered, seen = [], [], 0, set()
    count = 0
    for line, record in enumerate(reader, 2):
        count += 1
        if count > limit: raise ValueError('Input exceeds sampleLimit')
        try:
            r = {k: (record[v] or '').strip() for k, v in mapping.items()}
            if not r['sample_id'] or not r['species'] or not r['life_form']: raise ValueError('Empty sample ID/species/life form')
            if r['sample_id'] in seen: raise ValueError('Duplicate sample ID')
            seen.add(r['sample_id'])
            factors = {'g': 1., 'mg': .001, '克': 1., '毫克': .001}
            if r['unit'] not in factors: raise ValueError('Unsupported or absent mass unit')
            weight = float(r['weight']) * factors[r['unit']]
            if not math.isfinite(weight) or weight <= 0: raise ValueError('Weight must be finite and positive')
            if selected and r['species'] not in selected:
                filtered += 1
                continue
            rows.append(dict(sample_id=r['sample_id'], species=r['species'], life_form=r['life_form'], weight_g=weight, weight_g_squared=weight*weight))
        except (ValueError, TypeError, KeyError) as exc:
            if 'Duplicate' in str(exc) or policy == 'reject': raise ValueError(f'CSV line {line}: {exc}') from exc
            rejected.append(dict(line=line, reason=str(exc)))
    if not rows: raise ValueError('No valid observations remain')
    return rows, dict(inputRows=count, validRows=len(rows), excludedRows=len(rejected), filteredRows=filtered, exclusions=rejected, groupBy=group, unit='g/1000 seeds')

def read_bundle(raw):
    if len(raw) > 32*1024*1024: raise ValueError('Summary bundle too large')
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        item=z.getinfo('summary.json')
        if item.file_size > 8*1024*1024: raise ValueError('Summary too large')
        return json.loads(z.read(item))

def merge(summaries, expected):
    if len(summaries) != len(expected) or {s['node'] for s in summaries} != set(expected): raise ValueError('Missing or duplicate node')
    keys, merged, contracts = set(), {}, set()
    for s in summaries:
        if s['serviceId'] != 'svc-048' or s['version'] != VERSION or s['unit'] != 'g/1000 seeds': raise ValueError('Incompatible summary version/unit')
        contracts.add(s['parameterHash'])
        if len(s['sampleHashes']) != s['validRows'] or len(set(s['sampleHashes'])) != s['validRows']: raise ValueError('Invalid sample manifest')
        if keys.intersection(s['sampleHashes']): raise ValueError('Duplicate sample across partitions')
        keys.update(s['sampleHashes'])
        if sum(g['count'] for g in s['groups']) != s['validRows']: raise ValueError('Group counts do not match manifest')
        for g in s['groups']:
            if g['count'] < 1 or not all(math.isfinite(g[k]) for k in ('mean', 'm2', 'min', 'max')) or g['m2'] < 0: raise ValueError('Invalid sufficient statistics')
            if g['group'] not in merged: merged[g['group']] = dict(g); continue
            a=merged[g['group']]; n=a['count']+g['count']; delta=g['mean']-a['mean']
            a['m2'] += g['m2'] + delta*delta*a['count']*g['count']/n
            a['mean'] += delta*g['count']/n; a['count']=n
            a['min']=min(a['min'],g['min']); a['max']=max(a['max'],g['max'])
    if len(contracts) != 1: raise ValueError('Parameter mismatch between nodes')
    groups=[]
    for g in sorted(merged.values(), key=lambda x:x['group']):
        g['sampleSD']=math.sqrt(g['m2']/(g['count']-1)) if g['count']>1 else None
        g['cvPercent']=100*g['sampleSD']/g['mean'] if g['sampleSD'] is not None else None
        groups.append(g)
    return dict(serviceId='svc-048', version=VERSION, synthetic=True, dataMeaning='Synthetic seed measurements for software validation; no claim about the 404-species dataset', unit='g/1000 seeds', groupBy=summaries[0]['groupBy'], nodes=expected, inputRows=sum(s['inputRows'] for s in summaries), validRows=sum(s['validRows'] for s in summaries), excludedRows=sum(s['excludedRows'] for s in summaries), filteredRows=sum(s['filteredRows'] for s in summaries), groups=groups, provenance=[{k:v for k,v in s.items() if k not in ('groups','sampleHashes')} for s in summaries], method='Parallel Welford merge of n/mean/M2; sample SD uses n-1; extrema merged exactly; no global median inferred')

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
    if len(raw)>16*1024*1024: raise ValueError('Input too large')
    p=ctx.params; rows,quality=normalize(raw,p); group=quality['groupBy']; op=tools()
    source=folder/'normalized.csv'
    with source.open('w',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
    profile=op.table_profile(dict(input_path=str(source)))
    aggregate=op.filter_aggregate(dict(input_path=str(source),group_by=[group],aggregations={'weight_g':'mean','weight_g_squared':'sum','sample_id':'count'},output_path=str(folder/'local-aggregate.csv')))
    aggregate_rows=list(csv.DictReader((folder/'local-aggregate.csv').open()))
    stats=[]
    for item in aggregate_rows:
        values=[r['weight_g'] for r in rows if r[group]==item[group]]
        mean=float(item['weight_g']); n=int(item['sample_id'])
        stats.append(dict(group=item[group],count=n,mean=mean,m2=sum((x-mean)**2 for x in values),min=min(values),max=max(values)))
    chart=op.visualize(dict(input_path=str(folder/'local-aggregate.csv'),chart='bar',x=group,y=['weight_g'],title='Synthetic seed thousand-weight / g',output_path=str(folder/'local-chart.png')))
    parameter_hash=hashlib.sha256(json.dumps({k:p[k] for k in ('fieldMapping','analysisScope','sampleLimit')},sort_keys=True,ensure_ascii=False).encode()).hexdigest()
    summary=dict(serviceId='svc-048',version=VERSION,node=p['node'],synthetic=True,**quality,parameterHash=parameter_hash,inputHash=hashlib.sha256(raw).hexdigest(),sampleHashes=[hashlib.sha256(r['sample_id'].encode()).hexdigest() for r in rows],groups=stats,operators=['table_profile','table_filter_aggregate','tabular_visualize'],scientificOperatorsExecuted=True)
    (folder/'summary.json').write_text(json.dumps(summary,ensure_ascii=False))
    # Summaries cross node boundaries; raw rows and profile examples remain local.
    source.unlink()
    profile['summary']['columns']={k:{a:b for a,b in v.items() if a!='examples'} for k,v in profile['summary']['columns'].items()}
    (folder/'operator-reports.json').write_text(json.dumps([profile,aggregate,chart],ensure_ascii=False))

def main(kind):
    from xstream_operator import OperatorContext, descriptor, result, run_inference
    if len(sys.argv)>1 and sys.argv[1] in ('infer','infer-worker'):
        def infer(inputs,params):
            ports=['source'] if kind=='local' else ['p'+str(i) for i in range(len(params['nodes']))]
            if set(inputs)!=set(ports) or any('bytes' not in v.get('representations',[]) for v in inputs.values()): raise ValueError('Expected byte streams on all declared ports')
            return result({'result':descriptor(['bytes'],['zip'],certainty='known')})
        run_inference(infer); return
    with OperatorContext() as ctx, tempfile.TemporaryDirectory(prefix='seed-weight-') as d:
        folder=Path(d);os.environ['AI_DATASEEK_OUTPUT_ROOT']=d
        if kind=='local': local(ctx,folder)
        else:
            report=merge([read_bundle(b''.join(ctx.input('p'+str(i)).bytes())) for i in range(len(ctx.params['nodes']))],ctx.params['nodes'])
            (folder/'summary.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
            with (folder/'comparison.csv').open('w',newline='') as f:
                writer=csv.DictWriter(f,fieldnames=list(report['groups'][0]));writer.writeheader();writer.writerows(report['groups'])
            tools().visualize(dict(input_path=str(folder/'comparison.csv'),chart='bar',x='group',y=['mean'],title='Synthetic seed thousand-weight / g',output_path=str(folder/'comparison.png')))
        emit(ctx,folder)
