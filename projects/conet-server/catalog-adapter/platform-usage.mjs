// Statistics use durable execution events, never planned operator-version references.
export const usageVersion=1;
const observed=new Set(['running','succeeded','failed']);
const values=x=>x&&typeof x==='object'?Object.values(x):[];
export async function collectTaskUsage(task,readJob){
 const raw=task.raw||{},operators=new Map(),nodes=new Map(),datasets=new Map(),started=new Set(),missing=[];let evidenceJobs=0;
 const addOperator=(key,operator,step)=>{if(typeof operator==='string'&&operator){operators.set(key,{eventId:key,id:operator,name:operator});if(step)started.add(step)}};
 if(raw.usage){
  for(const[key,op]of Object.entries(raw.usage.operator_events||{}))addOperator(key,op,key.split('/').at(-1));
  for(const[key,n]of Object.entries(raw.usage.node_events||{}))if(n.execution_id)nodes.set(key,{eventId:key,id:n.identity||key,name:n.node||n.identity||key});
  for(const d of values(raw.usage.dataset_events))if(d.uri)datasets.set(d.uri,{id:d.uri,name:d.name||d.uri});
 }else{
  const ids=[...new Set([raw.job_id,raw.report?.jobId,...values(raw.report?.unionJobIds)].filter(x=>typeof x==='string'&&/^[A-Za-z0-9-]{1,100}$/.test(x)))];
  for(const id of ids){let job;try{job=await readJob(id)}catch{missing.push(id);continue}evidenceJobs++;
   const stepMap=new Map((Array.isArray(job.steps)?job.steps:[]).map(s=>[s.id,s]));
   const attempts=Array.isArray(job.attempts)&&job.attempts.length?job.attempts:[job];
   for(const a of attempts){const aid=a.attempt_id||a.record_id||a.job_id||id;
    const step=(sid,state)=>{const s=stepMap.get(sid);if(s&&!s.replayed&&observed.has(state))addOperator(id+'/'+aid+'/'+sid,s.operator||raw.step_operators?.[sid],sid)};
    for(const s of Array.isArray(a.steps)?a.steps:[])step(s.id,s.state);
    for(const[identity,n]of Object.entries(a.nodes||{})){if(n.execution_id)nodes.set(id+'/'+identity+'/'+n.execution_id,{eventId:id+'/'+identity+'/'+n.execution_id,id:identity,name:[...stepMap.values()].find(s=>s.node_identity===identity)?.node||identity});for(const[sid,state]of Object.entries(n.steps||{}))step(sid,state)}
   }
  }
 }
 // A dataset use requires an observed read step; source metadata alone is not execution evidence.
 if(!raw.usage){const reads=[...operators.values()].some(o=>o.id.startsWith('read_item@'));if(reads){const id=task.lineage?.datasetId||task.source?.datasetId||raw.datasetId;if(id)datasets.set(id,{id,name:task.source?.title||id})}}
 return {version:usageVersion,rawHash:task.rawHash||null,recordedAt:new Date().toISOString(),operators:[...operators.values()],nodes:[...nodes.values()],datasets:[...datasets.values()],evidenceJobs,missingJobIds:missing,hasExecutionEvidence:!!raw.usage||evidenceJobs>0};
}
export function aggregateUsage(tasks,applications){
 const names=new Map(applications.map(a=>[a._id,a.title])),counts={apps:new Map(),datasets:new Map(),operators:new Map(),nodes:new Map()};let observedJobs=0,missingEvidence=0;const seen={operators:new Set(),nodes:new Set()};
 const add=(kind,id,name)=>{if(!id)return;const r=counts[kind].get(id)||{id,name:name||id,count:0};r.count++;counts[kind].set(id,r)};
 const rows=tasks.filter(t=>t.raw&&t.synthetic!==true);for(const t of rows){add('apps',t.applicationId,names.get(t.applicationId));const u=t.usageEvidence;if(!u||u.version!==usageVersion||u.rawHash!==(t.rawHash||null)||!u.hasExecutionEvidence){missingEvidence++;continue}observedJobs++;for(const kind of ['operators','datasets','nodes'])for(const x of u[kind]||[]){if(seen[kind]){if(seen[kind].has(x.eventId))continue;seen[kind].add(x.eventId)}add(kind,x.id,x.name)}}
 return {submissions:rows.length,observed_jobs:observedJobs,missing_execution_evidence:missingEvidence,recorded_at:new Date().toISOString(),...Object.fromEntries(Object.entries(counts).map(([k,m])=>[k,[...m.values()].sort((a,b)=>b.count-a.count||a.id.localeCompare(b.id))])),definitions:{apps:'持久化受理记录，每次提交一次；包含失败记录',operators:'仅计已观测的运行、成功或失败步骤，每执行尝试和步骤去重；不计排队、回放或仅有版本引用的记录',datasets:'实际读取的数据资源，每任务每资源一次',nodes:'已确认接收任务的节点，每执行ID和节点一次',coverage:'历史记录缺少执行证据时不推算补数'}};
}
