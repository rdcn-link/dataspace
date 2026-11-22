import io,json,os,sys,zipfile,urllib.request
from pathlib import Path
from urllib.parse import quote
sys.path.insert(0,'/mnt/data/conet/dacp-codex/dacp-client')
import pyarrow.flight as flight
from dacp.union import Union
root=Path(os.environ['PRECIP_OUTPUT']);task=json.loads((root/'task.json').read_text());source=task['source'];config=json.loads(Path('/mnt/data/conet/conet-server/.state/network/connection.json').read_text());catalog=json.load(urllib.request.urlopen('http://127.0.0.1:8870/api/catalog'));row=next((r for r in catalog['datasets'] if r['id']==source['publicId'] and r['node_id']==source['nodeId'] and r['metadata'].get('datasetId')==source['datasetId']),None)
if not row or row['dacp_uri']!=source['uri']:raise ValueError('Source namespace changed')
with Union(config['union_url'],token=Path(config['token_file']).read_text().strip(),ca=config['ca'],timeout=900) as union:
 directory=json.loads(next(union.client.do_action(flight.Action('dacp.nodes',b''))).body.to_pybytes());owner=next((n for n in directory['nodes'] if n['address'].rstrip('/')==config['node_urls'][source['nodeId']].rstrip('/')),None)
 if not owner or owner['state']!='approved' or owner['capacity']<2:raise ValueError('Owning node unavailable')
 job=dict(name=task['name'],steps=[dict(id='read',node=owner['id'],operator='read_item@1.0',inputs={},params=dict(uri=source['uri'].rstrip('/')+'/'+quote(source['archive'],safe=''),view='bytes')),dict(id='analyze',node=owner['id'],operator=task['template']['operator'],inputs=dict(source='read'),params=task['parameters'])],outputs=dict(result='analyze'))
 (root/'job.json').write_text(json.dumps(job,ensure_ascii=False,indent=2))
 with union.submit(json.dumps(job),execution_policy=dict(timeout_seconds=900)) as run:
  (root/'progress.json').write_text(json.dumps(dict(jobId=run.job_id,phase='owning-node-read-and-aggregation')));payload=bytearray();complete=False
  for event in run.results():
   if event['type']=='data':payload.extend(event['data'])
   if event['type']=='complete':complete=True
   if len(payload)>33554432:raise ValueError('Result exceeds output limit')
  status=run.status();(root/'status.json').write_text(json.dumps(status))
  if not complete or status['state']!='succeeded' or len(status['steps'])!=2 or any(s['state']!='succeeded' for s in status['steps']):raise ValueError('Incomplete precipitation job')
 with zipfile.ZipFile(io.BytesIO(payload)) as z:
  for name in ['report.json','verification.json','periods.csv','periods.png','map.png']:(root/name).write_bytes(z.read(name))
 report=json.loads((root/'report.json').read_text());report.update(source=source,synthetic=source['synthetic'],executionEvidence=dict(kind='engineering-validation',formalApproval=False),jobId=run.job_id,owningNode=source['nodeId']);(root/'report.json').write_text(json.dumps(report))
 with zipfile.ZipFile(root/'result.zip','w',zipfile.ZIP_DEFLATED) as z:
  for name in ['task.json','job.json','status.json','report.json','verification.json','periods.csv','periods.png','map.png']:z.write(root/name,name)
 print(json.dumps(dict(state='passed',jobId=run.job_id,periods=len(report['records']))))
