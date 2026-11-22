"""Run an inspection or a generic task with explicit owning-node placement."""
import io,json,os,sys,hashlib,zipfile,urllib.request
from pathlib import Path
from urllib.parse import quote
sys.path.insert(0,'/mnt/data/conet/dacp-codex/dacp-client')
import pyarrow.flight as flight
from dacp.union import Union
root=Path(os.environ['NPP_OUTPUT']);spec=json.loads((root/'task.json').read_text());binding=spec['source'];params=spec['parameters'];mode=os.environ.get('NPP_MODE','run');count=len(params['years'])
config=json.loads(Path(os.environ.get('NPP_CONNECTION_CONFIG','/mnt/data/conet/conet-server/.state/network/connection.json')).read_text())
catalog=json.load(urllib.request.urlopen('http://127.0.0.1:8870/api/catalog',timeout=30));row=next((r for r in catalog['datasets'] if r['id']==binding['publicId'] and r['node_id']==binding['nodeId']),None)
if row is None or row.get('metadata',{}).get('datasetId')!=binding['datasetId'] or row.get('metadata',{}).get('synthetic')!=binding['synthetic'] or row['dacp_uri']!=binding['uri'] or config['node_urls'].get(row['node_id'])!=binding['nodeAddress']:raise ValueError('Dataset owner/namespace changed; reselect and inspect')
registry=json.loads(Path(os.environ['NPP_ADAPTER_REGISTRY']).read_text());live=next((a for a in registry['adapters'] if a['id']==binding['adapter']['id']),None)
if live!=binding['adapter']:raise ValueError('Adapter version/mapping changed after task creation')
parameters=dict(years=params['years'],adapter=binding['adapter'],region=params['region'],methods=params['methods'],expectedHashes=spec.get('expectedHashes',{}))
with Union(config['union_url'],token=Path(config['token_file']).read_text().strip(),ca=config['ca'],timeout=1800) as union:
 directory=json.loads(next(union.client.do_action(flight.Action('dacp.nodes',b''))).body.to_pybytes());owner=next((n for n in directory['nodes'] if n['address'].rstrip('/')==binding['nodeAddress'].rstrip('/')),None)
 needed=count+1 if mode=='inspect' else 2*count+2
 if not owner or owner['state']!='approved' or owner['capacity']<needed:raise ValueError('Owning node unavailable or insufficient bounded-stream capacity')
 phases=['inspect'] if mode=='inspect' else ['prepare','finalize'];steps=[];upstream=None
 for phase in phases:
  inputs={}
  for i,year in enumerate(params['years']):
   key=phase+'_y'+str(i).zfill(2);steps.append(dict(id=key,node=owner['id'],operator='read_item@1.0',inputs={},params=dict(uri=binding['uri'].rstrip('/')+'/'+quote(binding['files'][str(year)],safe='/'),view='bytes')));inputs['y'+str(i).zfill(2)]=key
  if upstream:inputs['reference']=upstream
  steps.append(dict(id=phase,node=owner['id'],operator=spec['template']['operators'][phase].replace('{N}',str(count)),inputs=inputs,params=parameters));upstream=phase
 job=dict(name=spec.get('name','Generic NPP')+' / '+mode,steps=steps,outputs=dict(result=phases[-1]));(root/'bound-job.json').write_text(json.dumps(job,ensure_ascii=False,indent=2))
 with union.submit(json.dumps(job,ensure_ascii=False),execution_policy=dict(timeout_seconds=1200)) as run:
  (root/'batch-execution.json').write_text(json.dumps(dict(jobIds=dict(bound=run.job_id),state='running',phase=mode)));print('Union '+run.job_id,flush=True);payload=bytearray();complete=False
  for event in run.results():
   if event['type']=='data':payload.extend(event['data'])
   if event['type']=='complete':complete=True
   if len(payload)>32*1024*1024:raise ValueError('Result exceeds 32MiB output contract')
  status=run.status();(root/'bound-union-status.json').write_text(json.dumps(status,ensure_ascii=False,indent=2))
  if not complete or status['state']!='succeeded' or len(status['steps'])!=needed or any(s['state']!='succeeded' for s in status['steps']):raise ValueError('Incomplete generic workflow')
 with zipfile.ZipFile(io.BytesIO(payload)) as z:
  names=['inspection.json'] if mode=='inspect' else spec['template']['outputs'][:-1]+['all-node-results.json','common-mask.bin']
  for name in names:(root/name).write_bytes(z.read(name))
 if mode=='inspect':
  doc=json.loads((root/'inspection.json').read_text());doc.update(jobId=run.job_id,ownerNode=binding['nodeId'],allStepsSucceeded=True);(root/'inspection.json').write_text(json.dumps(doc,ensure_ascii=False,indent=2))
 else:
  report=json.loads((root/'report.json').read_text());verification=json.loads((root/'verification.json').read_text());report.update(sourceBinding=binding,taskParameters=params,inspectionId=spec['inspectionId'],executionEvidence=spec['executionEvidence'],operatorVersions=[s['operator'] for s in steps if s['operator']!='read_item@1.0'],node=binding['nodeId'],unionJobIds=dict(bound=run.job_id),dacpSteps=needed,independentPhysicalHosts=False);verification.update(allStepsSucceeded=True,owningNodePlacement=owner['id']);(root/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));(root/'verification.json').write_text(json.dumps(verification,ensure_ascii=False,indent=2))
  with zipfile.ZipFile(root/'result.zip','w',zipfile.ZIP_DEFLATED) as z:
   for name in spec['template']['outputs'][:-1]+['task.json','bound-job.json','bound-union-status.json','all-node-results.json','common-mask.bin']:z.write(root/name,name)
 (root/'batch-execution.json').write_text(json.dumps(dict(jobIds=dict(bound=run.job_id),state='succeeded',phase=mode)));print(json.dumps(dict(state='passed',mode=mode,node=binding['nodeId'],years=params['years'])),flush=True)
