import io,json,os,sys,zipfile,urllib.request
from pathlib import Path
from urllib.parse import quote
import pyarrow.flight as flight
from dacp.union import Union
root=Path('/output');task=json.loads((root/'task.json').read_text());source=task['source'];config=json.loads(Path('/connection.json').read_text());catalog=json.load(urllib.request.urlopen('http://127.0.0.1:8870/api/catalog'));row=next((r for r in catalog['datasets'] if r['id']==source['publicId'] and r['node_id']==source['nodeId'] and r['metadata'].get('datasetId')==source['datasetId']),None)
if not row or row['dacp_uri']!=source['uri']:raise ValueError('Frozen source namespace no longer matches')
with Union(config['union_url'],token=Path('/token').read_text().strip(),ca='/ca',timeout=1200) as union:
 directory=json.loads(next(union.client.do_action(flight.Action('dacp.nodes',b''))).body.to_pybytes());owner=next((n for n in directory['nodes'] if n['address'].rstrip('/')==config['node_urls'][source['nodeId']].rstrip('/')),None)
 if not owner or owner['state']!='approved' or owner['capacity']<2:raise ValueError('Source owner not available')
 job=dict(name=task['name'],steps=[dict(id='read',node=owner['id'],operator='read_item@1.0',inputs={},params=dict(uri=source['uri'].rstrip('/')+'/'+quote(source['filename'],safe=''),view='bytes')),dict(id='analyze',node=owner['id'],operator=task['template']['operator'],inputs=dict(source='read'),params=task['parameters'])],outputs=dict(result='analyze'))
 (root/'job.json').write_text(json.dumps(job,ensure_ascii=False,indent=2))
 with union.submit(json.dumps(job),execution_policy=dict(timeout_seconds=900)) as run:
  (root/'progress.json').write_text(json.dumps(dict(jobId=run.job_id,phase='owning-node-read-and-analysis')));payload=bytearray();complete=False
  for event in run.results():
   if event['type']=='data':payload.extend(event['data'])
   if event['type']=='complete':complete=True
   if len(payload)>100000000:raise ValueError('Result exceeds 100MB')
  status=run.status();(root/'status.json').write_text(json.dumps(status))
  if not complete or status['state']!='succeeded' or len(status['steps'])!=2 or any(s['state']!='succeeded' for s in status['steps']):raise ValueError('Incomplete scientific execution')
 with zipfile.ZipFile(io.BytesIO(payload)) as z:
  for name in ['report.json','verification.json','table.csv','chart.png','contact.png','derived.zip']:
   if name in z.namelist():(root/name).write_bytes(z.read(name))
 report=json.loads((root/'report.json').read_text());actual=report['inputFileHashes'].get(source['filename']);expected=source.get('sha256')
 if not expected or actual!=expected:raise ValueError('Input content differs from the frozen data adapter hash')
 report.update(source=source,synthetic=False,jobId=run.job_id,owningNode=source['nodeId'],originalArchiveEvidence=source.get('originalArchiveEvidence'));(root/'report.json').write_text(json.dumps(report,ensure_ascii=False))
 verification=json.loads((root/'verification.json').read_text());verification.update(frozenSourceHashVerified=True,expectedSha256=expected,actualSha256=actual,executionStepsSucceeded=True);(root/'verification.json').write_text(json.dumps(verification))
 with zipfile.ZipFile(root/'result.zip','w',zipfile.ZIP_DEFLATED) as z:
  for name in ['task.json','job.json','status.json','report.json','verification.json','table.csv','chart.png','contact.png','derived.zip']:
   if (root/name).exists():z.write(root/name,name)
 print(json.dumps(dict(state='passed',jobId=run.job_id,summary=report['summary'])))
