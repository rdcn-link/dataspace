import {validateParameters,template} from './npp-spec.mjs';
import {verifiedInspection} from './npp-inspections.mjs';
import {runGeneric} from './npp-runtime.mjs';
import {resolveSource,selectYears} from './npp-sources.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const execute=promisify(execFile),root=process.env.NPP_RUN_ROOT||'/mnt/data/conet/catalog-integration/npp-runs',legacy='/mnt/data/conet/domain-validation/applications/svc-015';
const files=['task.json','map.png','map.json','binding.json','bound-job.json','bound-union-status.json','annual.csv','annual.png','result.zip','report.json','verification.json','native-job.json','common-job.json','native-union-status.json','common-union-status.json','all-node-results.json','common-mask.bin','source-metadata.json','node-observations.json','README.md','README_zh.md'];
let initialization,working=false;
const valid=id=>/^[0-9a-f-]{36}$/.test(id);
const folder=id=>{if(!valid(id))throw Error('无效记录编号');return path.join(root,id)};
async function save(r){const p=path.join(folder(r.id),'record.json'),tmp=p+'.tmp';await fs.writeFile(tmp,JSON.stringify(r,null,2));await fs.rename(tmp,p)}
async function records(){const rows=[];for(const n of await fs.readdir(root)){if(!valid(n))continue;try{rows.push(JSON.parse(await fs.readFile(path.join(root,n,'record.json'),'utf8')))}catch(e){if(e.code!=='ENOENT')throw e}}return rows.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id))}
async function ensure(){if(!initialization)initialization=(async()=>{
 await fs.mkdir(root,{recursive:true});
 try{await fs.access(path.join(root,'legacy.json'))}catch(e){if(e.code!=='ENOENT')throw e;
  const report=JSON.parse(await fs.readFile(legacy+'/report.json','utf8')),verification=JSON.parse(await fs.readFile(legacy+'/verification.json','utf8'));if(report.state!=='succeeded'||verification.state!=='passed')throw Error('首次真实结果尚未核验');
  const id=randomUUID(),out=path.join(folder(id),'outputs');await fs.mkdir(out,{recursive:true});for(const name of files){try{await fs.copyFile(path.join(legacy,name),path.join(out,name))}catch(e){if(e.code!=='ENOENT')throw e}}
  const at=(await fs.stat(legacy+'/report.json')).mtime.toISOString();await save({id,name:'首次真实数据分析（已验证）',state:'succeeded',createdAt:at,finishedAt:at,yearStart:2001,yearEnd:2024,datasetId:report.datasetId,imported:true});await fs.writeFile(path.join(root,'legacy.json'),JSON.stringify({id}));
 }
 for(const r of await records())if(r.state==='running'){
  try{await execute('docker',['stop','npp-run-'+r.id],{timeout:15000})}catch{}
  r.state='interrupted';r.error='服务重启，运行已中断。历史文件保留，可重新开始分析。';r.finishedAt=new Date().toISOString();await save(r);
 }
})().catch(e=>{initialization=null;throw e});await initialization;void work().catch(e=>console.error('NPP queue failed:',e.message));}
async function work(){if(working)return;working=true;try{for(;;){const next=(await records()).filter(r=>r.state==='queued').sort((a,b)=>a.createdAt.localeCompare(b.createdAt))[0];if(!next)break;await perform(next)}}finally{working=false;if((await records()).some(r=>r.state==='queued'))void work().catch(e=>console.error('NPP queue failed:',e.message))}}
async function perform(r){const out=path.join(folder(r.id),'outputs');await fs.mkdir(out,{recursive:true});r.state='running';r.startedAt=new Date().toISOString();await save(r);

 try{if(!r.taskSpec)throw Error('此旧任务缺少通用模板快照，请重新配置分析');await fs.writeFile(path.join(out,'task.json'),JSON.stringify(r.taskSpec,null,2));const result=await runGeneric(out,'run',r.id);await fs.writeFile(path.join(folder(r.id),'run.log'),result.stdout+'\n'+result.stderr);const report=JSON.parse(await fs.readFile(path.join(out,'report.json'),'utf8')),v=JSON.parse(await fs.readFile(path.join(out,'verification.json'),'utf8'));if(report.state!=='succeeded'||v.state!=='passed'||report.years[0]!==r.yearStart||report.years[1]!==r.yearEnd)throw Error('结果或独立核验不完整');r.state='succeeded';r.summary={firstMean:report.firstMean,lastMean:report.lastMean,endpointChangePercent:report.endpointChangePercent,olsSlopePerYear:report.olsSlopePerYear,commonPixels:report.commonPixels};}
 catch(e){r.state='failed';r.error=(e.stderr||e.message).slice(-5000);await fs.writeFile(path.join(folder(r.id),'run.log'),(e.stdout||'')+'\n'+(e.stderr||e.message))}
 r.finishedAt=new Date().toISOString();await save(r);
}
export const validateInput=validateParameters;
export async function list(){await ensure();return {rows:await records()}}
export async function create(input,actor='platform-engineering-validation',executionEvidence={kind:'engineering-validation',formalApproval:false},requestedId){if(requestedId){if(!valid(requestedId))throw Error('无效执行编号');try{const existing=await read(requestedId);if(existing)return existing}catch(e){if(e.code!=='ENOENT')throw e}}const params=validateInput(input);const source=await resolveSource(params.sourceKey);if(params.sourceContractHash!==source.contractHash)throw Error('数据集版本已变化，请重新配置');const years=selectYears(source,params.yearStart,params.yearEnd);if(source.synthetic&&!params.allowSynthetic)throw Error('合成数据只用于验证，必须明确确认');const inspected=await verifiedInspection(params,actor);await ensure();const r={id:requestedId||randomUUID(),...params,createdBy:actor,executionEvidence,source,synthetic:source.synthetic,datasetId:source.datasetId,caseKind:source.synthetic?'synthetic-demo':executionEvidence.formalApproval?'user-case':'real-validation',state:'queued',createdAt:new Date().toISOString()};r.taskSpec={name:r.name,template:await template(),source,parameters:{years,methods:r.methods,region:r.region},inspectionId:inspected.id,expectedHashes:Object.fromEntries(inspected.result.files.map(f=>[String(f.year),f.inputHash])),executionEvidence};await fs.mkdir(folder(r.id),{recursive:true});await save(r);void work().catch(e=>console.error('NPP queue failed:',e.message));return r}
export async function read(id){await ensure();if(!valid(id))return null;let r;try{r=JSON.parse(await fs.readFile(path.join(folder(id),'record.json'),'utf8'))}catch(e){if(e.code==='ENOENT')return null;throw e}if(r.state==='succeeded'){r.report=JSON.parse(await fs.readFile(path.join(folder(id),'outputs/report.json'),'utf8'));r.report.verification=JSON.parse(await fs.readFile(path.join(folder(id),'outputs/verification.json'),'utf8'))}else if(r.state==='running'){try{const p=JSON.parse(await fs.readFile(path.join(folder(id),'outputs/batch-execution.json'),'utf8'));r.progress=p.jobIds?.bound?'所属节点就地分析与独立核验':p.jobIds?.common?'共同有效区域复算与独立核验':'各年有效区域统计与共同掩膜生成'}catch{r.progress='准备真实DACP分析'}}return r}
export async function artifact(id,name){const r=await read(id);if(!r||r.state!=='succeeded'||!files.includes(name))return null;return fs.readFile(path.join(folder(id),'outputs',name))}
