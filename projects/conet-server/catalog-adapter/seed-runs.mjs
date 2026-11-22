import fs from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const execute=promisify(execFile);
const base='/mnt/data/conet/domain-validation/applications/svc-048';
export async function executeSeedRun(job,run,persist){
 const folder=base+'/'+run.id;
 run.executionKind='seed-weight-union';run.unionExecuted=false;
 run.approvals=job.collaboration.computeNodes.map(node=>({node,status:'approved',mode:'simulation-auto-approve',rights:'仅供合成种子测量验证；不授予真实数据或科研成果权益'}));
 run.referenceDatasets=job.datasets.map(d=>({id:d.id,title:d.title,source:d.source,metadataReferenceOnly:true}));
 run.scope='同一服务器上的独立DACP节点，经Union调度；仅合成种子数据';
 run.state='running';run.logs.push('模拟审批通过；提交千粒重专用Union工作流');await persist(run);
 try{
  if(job.collaboration.mode!=='partitioned')throw Error('千粒重验证目前仅支持多节点分片协同');
  await fs.mkdir(folder,{recursive:true});
  await fs.writeFile(folder+'/request.json',JSON.stringify({nodes:job.collaboration.computeNodes,mode:job.collaboration.mode,parameters:job.parameters}));
  await execute('docker',['run','--rm','--network','host','-e','PYTHONPATH=/mnt/data/conet/seed-weight/client-deps:/opt/dataseek-deps:/opt/xstream-sdk','-v','/mnt/data/conet:/mnt/data/conet:ro','-v','/mnt/data/conet/domain-validation:/validation','--entrypoint','/usr/local/bin/python','conet/dataseek-scientific:1.0','/mnt/data/conet/seed-weight/run_union.py',folder+'/request.json','/validation/applications/svc-048/'+run.id],{timeout:360000,maxBuffer:4*1024*1024});
  const report=JSON.parse(await fs.readFile(folder+'/report.json','utf8'));
  run.report=report;run.aggregate={count:report.validRows,groups:report.groups,unit:report.unit,method:report.method};
  run.unionExecuted=report.unionExecuted;run.unionJobId=report.unionJobId;run.scientificOperatorsExecuted=true;run.state='succeeded';
  run.logs.push('Union结果流完整结束；节点科学算子和跨节点摘要汇聚完成');
 }catch(e){run.state='failed';run.error=(e.stderr||e.message).slice(-5000);run.logs.push('执行失败，未发布不完整成果');}
 run.finishedAt=new Date().toISOString();await persist(run);
}
export async function seedArtifact(run,name){
 if(run?.executionKind!=='seed-weight-union'||run.state!=='succeeded'||!['result.zip','comparison.csv','comparison.png'].includes(name))return null;
 return fs.readFile(base+'/'+run.id+'/'+name);
}
