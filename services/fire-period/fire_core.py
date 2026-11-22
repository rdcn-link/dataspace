"""Strict timestamp normalization and detection-count summaries; no wildfire inference."""
import csv, hashlib, io, json, math
from datetime import datetime, timedelta, timezone
MAPPING=dict(detection_id='detection_id',timestamp='timestamp',longitude='longitude',latitude='latitude',confidence='confidence',source_type='source_type')
DEFAULT_SCOPE=dict(start='2024-05-01T00:00:00+08:00',end='2024-05-04T00:00:00+08:00',period='day',timezone='UTC+08:00',minConfidence=80,bbox=[121,50,127,54],invalidPolicy='reject',groupBySource=True)
TZ=timezone(timedelta(hours=8))
def instant(value):
    if not isinstance(value,str):raise ValueError('Timestamp must be an ISO string')
    value=datetime.fromisoformat(value.replace('Z','+00:00'))
    if value.tzinfo is None:raise ValueError('Timestamp requires an explicit UTC offset')
    return value.astimezone(TZ)
def scope_for(params):
    scope=dict(DEFAULT_SCOPE); supplied=params.get('analysisScope') or {}
    if not isinstance(supplied,dict) or set(supplied)-set(scope):raise ValueError('Unknown analysis scope')
    scope.update(supplied)
    if scope['timezone']!='UTC+08:00' or scope['period'] not in ('hour','day','month','season','year'):raise ValueError('Use UTC+08:00 and hour/day/month/season/year bins')
    if not isinstance(scope['groupBySource'],bool):raise ValueError('groupBySource must be boolean')
    if scope['invalidPolicy'] not in ('reject','exclude'):raise ValueError('invalidPolicy must be reject or exclude')
    start,end=instant(scope['start']),instant(scope['end'])
    if end<=start or end-start>timedelta(days=10958):raise ValueError('Time window must be positive and at most thirty years')
    threshold=scope['minConfidence'];bbox=scope['bbox']
    if isinstance(threshold,bool) or not isinstance(threshold,(int,float)) or not math.isfinite(threshold) or not 0<=threshold<=100:raise ValueError('Confidence must use the declared 0..100 numeric scale')
    if not isinstance(bbox,list) or len(bbox)!=4 or any(isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x) for x in bbox):raise ValueError('bbox must be four finite numbers')
    if not -180<=bbox[0]<bbox[2]<=180 or not -90<=bbox[1]<bbox[3]<=90:raise ValueError('Invalid longitude/latitude bounding box')
    scope['start']=start.isoformat();scope['end']=end.isoformat()
    return scope,start,end
def bucket(t,period):
    if period=='year':return str(t.year)
    if period=='season':
        year=t.year+(t.month==12)
        season='winter' if t.month in (12,1,2) else 'spring' if t.month<=5 else 'summer' if t.month<=8 else 'autumn'
        return f'{year}-{season}'
    return t.strftime('%Y-%m' if period=='month' else '%Y-%m-%d' if period=='day' else '%Y-%m-%dT%H:00+08:00')
def bins(scope):
    _,start,end=scope_for({'analysisScope':scope});current=start.replace(minute=0,second=0,microsecond=0)
    if scope['period']!='hour':current=current.replace(hour=0)
    if scope['period'] in ('month','season','year'):current=current.replace(day=1)
    out=[]
    while current<end:
        label=bucket(current,scope['period'])
        if label not in out:out.append(label)
        if len(out)>9000:raise ValueError('Too many bins')
        if scope['period'] in ('month','season','year'):current=current.replace(year=current.year+(current.month==12),month=current.month%12+1)
        else:current+=timedelta(hours=1) if scope['period']=='hour' else timedelta(days=1)
    return out
def normalize(raw,params):
    mapping=params.get('fieldMapping') or MAPPING
    if not isinstance(mapping,dict) or set(mapping)!=set(MAPPING) or len(set(mapping.values()))!=6 or any(not isinstance(x,str) or not x for x in mapping.values()):raise ValueError('Bind six distinct detection/time/coordinate/confidence/source columns')
    scope,start,end=scope_for(params);limit=params.get('sampleLimit',1000)
    bins(scope) # Bound the number of time bins before reading data or plotting.
    if isinstance(limit,bool) or not isinstance(limit,int) or not 1<=limit<=20000:raise ValueError('sampleLimit must be 1..20000')
    reader=csv.DictReader(io.StringIO(raw.decode('utf-8-sig')))
    if not reader.fieldnames or not set(mapping.values())<=set(reader.fieldnames):raise ValueError('Missing mapped columns')
    rows=[];seen=set();invalid=[];filtered=0;count=0
    for line,record in enumerate(reader,2):
        count+=1
        if count>limit:raise ValueError('sampleLimit exceeded; input is never truncated')
        r={k:(record.get(v) or '').strip() for k,v in mapping.items()}
        # Duplicates are always fatal, including records removed by filters.
        if r['detection_id'] in seen:raise ValueError('Duplicate detection ID')
        if r['detection_id']:seen.add(r['detection_id'])
        try:
            if not r['detection_id']:raise ValueError('Missing detection ID')
            if r['source_type'] not in ('human','modis'):raise ValueError('source_type must explicitly be human or modis')
            t=instant(r['timestamp']);lon,lat,confidence=[float(r[k]) for k in ('longitude','latitude','confidence')]
            if not all(math.isfinite(x) for x in (lon,lat,confidence)) or not -180<=lon<=180 or not -90<=lat<=90 or not 0<=confidence<=100:raise ValueError('Invalid coordinate/confidence value')
            left,bottom,right,top=scope['bbox']
            if not (start<=t<end and left<=lon<=right and bottom<=lat<=top and confidence>=scope['minConfidence']):filtered+=1;continue
            rows.append(dict(detection_id=r['detection_id'],period=bucket(t,scope['period']),source=r['source_type'] if scope['groupBySource'] else 'all'))
        except (ValueError,TypeError) as e:
            if scope['invalidPolicy']=='reject':raise ValueError(f'CSV line {line}: {e}') from e
            invalid.append(dict(line=line,reason=str(e)))
    quality=dict(inputRows=count,validRows=len(rows),excludedRows=len(invalid),filteredRows=filtered,exclusions=invalid,scope=scope)
    return rows,quality,[hashlib.sha256(x.encode()).hexdigest() for x in sorted(seen)]
def merge(summaries,expected):
    if len(summaries)!=len(expected) or {s['node'] for s in summaries}!=set(expected):raise ValueError('Missing/duplicate node')
    hashes=set();counts={};contracts=set()
    for s in summaries:
        if s['serviceId']!='svc-023' or s['version']!='1.1' or s['unit']!='detection records':raise ValueError('Incompatible summary')
        contracts.add(s['parameterHash'])
        if len(s['detectionHashes'])!=len(set(s['detectionHashes'])) or hashes.intersection(s['detectionHashes']):raise ValueError('Duplicate detection across nodes')
        hashes.update(s['detectionHashes'])
        if sum(g['count'] for g in s['groups'])!=s['validRows'] or s['inputRows']!=s['validRows']+s['filteredRows']+s['excludedRows']:raise ValueError('Inconsistent counts')
        if len({(g['period'],g['source']) for g in s['groups']})!=len(s['groups']):raise ValueError('Duplicate period/source summary')
        for g in s['groups']:
            if not isinstance(g['count'],int) or isinstance(g['count'],bool) or g['count']<0:raise ValueError('Invalid count')
            key=(g['period'],g['source']);counts[key]=counts.get(key,0)+g['count']
    if len(contracts)!=1 or any(s['scope']!=summaries[0]['scope'] for s in summaries):raise ValueError('Parameter/timezone mismatch')
    scope=summaries[0]['scope'];periods=bins(scope)
    sources=['human','modis'] if scope['groupBySource'] else ['all']
    if set(counts)-{(p,s) for p in periods for s in sources}:raise ValueError('Unexpected time/source bin')
    return dict(serviceId='svc-023',version='1.1',synthetic=True,dataMeaning='Synthetic detections only; detection records are not distinct wildfires or burnt area',unit='detection records',scope=scope,nodes=expected,inputRows=sum(s['inputRows'] for s in summaries),validRows=sum(s['validRows'] for s in summaries),excludedRows=sum(s['excludedRows'] for s in summaries),filteredRows=sum(s['filteredRows'] for s in summaries),groups=[dict(period=p,source=s,count=counts.get((p,s),0)) for p in periods for s in sources],provenance=[{k:v for k,v in s.items() if k not in ('groups','detectionHashes')} for s in summaries],method='Exact sum of disjoint detection-ID partitions; UTC+08:00 bins; start inclusive/end exclusive; explicit zero bins; meteorological seasons with December assigned to next winter-year; separate human/MODIS records without wildfire-event inference')
