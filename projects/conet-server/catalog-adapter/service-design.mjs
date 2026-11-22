import {applicationPlugin} from './application-plugins.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const home=path.dirname(fileURLToPath(import.meta.url));
const catalog=JSON.parse(await fs.readFile(path.join(home,'services.json'),'utf8'));
const index=new Map(catalog.services.map(s=>[s.id,s]));
export const jobRoot=process.env.SERVICE_JOB_DIRECTORY||'/mnt/data/conet/catalog-integration/service-jobs';
export function serviceList(){return {evidence:catalog.evidence,total:index.size,categories:[...new Set(catalog.services.map(s=>s.category))],rows:[...catalog.services].sort((a,b)=>(b.displayPriority||0)-(a.displayPriority||0)).map(s=>({id:s.id,title:s.title,category:s.category,displayPriority:s.displayPriority||0,realDataVerified:s.runtimeValidation?.realDataAnalyticalWorkflowVerified===true,resultPreviewURL:s.resultPreviewURL||null,validationLabel:s.runtimeValidation?.validationLabel||null,question:s.question,outputSummary:s.outputSummary,sourceNodes:s.sourceNodes,datasetCount:s.datasets.length,operatorCount:s.operators.length,planningIds:s.planningIds,designStatus:s.designStatus,executionEnabled:false}))};}
export function serviceDetail(id){return index.get(id)||null;}
function invalid(message){const e=Error(message);e.statusCode=400;throw e;}
export function makeJob(input){
 const service=index.get(input.serviceId);if(!service)invalid('服务不存在');
 const name=String(input.name||service.title).trim();if(!name||name.length>150)invalid('任务名称需为1到150字');
 if(!Array.isArray(input.datasetIds)||!input.datasetIds.length||input.datasetIds.length>service.datasets.length||new Set(input.datasetIds).size!==input.datasetIds.length||input.datasetIds.some(id=>!service.datasets.some(d=>d.id===id)))invalid('请选择该服务关联的数据集');
 const node=String(input.node||'source');if(!['source','a','b','c','d','e'].includes(node))invalid('节点不在允许范围内');
 const parameters=input.parameters;if(!parameters||typeof parameters!=='object'||Array.isArray(parameters))invalid('请填写服务参数');
 if(typeof parameters.input_path!=='string'||!parameters.input_path||parameters.input_path.length>300||parameters.input_path.startsWith('/')||parameters.input_path.includes('\\')||parameters.input_path.split('/').includes('..')||/^[A-Za-z]:/.test(parameters.input_path))invalid('输入文件必须是工作区相对路径');
 for(const field of ['fieldMapping','analysisScope'])if(!parameters[field]||typeof parameters[field]!=='object'||Array.isArray(parameters[field]))invalid('字段映射和分析范围必须是JSON对象');
 if(!Number.isInteger(parameters.sampleLimit)||parameters.sampleLimit<1||parameters.sampleLimit>1000000)invalid('样本上限必须为1到1000000');
 const overrides=input.operatorParameters??{};if(typeof overrides!=='object'||Array.isArray(overrides))invalid('算子参数必须是JSON对象');
 if(service.id==='svc-048'&&Object.keys(overrides).length)invalid('千粒重执行使用应用参数，不支持单步覆盖');
 const allowed=new Set(service.workflow.steps.filter(s=>s.kind==='operator').map(s=>s.id));
 for(const [id,value]of Object.entries(overrides)){if(!allowed.has(id)||!value||typeof value!=='object'||Array.isArray(value))invalid('算子参数步骤无效');}
 const mode=input.collaborationMode||'partitioned';if(!service.collaboration.modes.some(m=>m.id===mode))invalid('协同模式无效');
 const nodes=input.computeNodes||['a','b'];if(!Array.isArray(nodes)||nodes.length<2||nodes.length>5||new Set(nodes).size!==nodes.length||nodes.some(n=>!service.collaboration.nodes.includes(n)))invalid('请选择2到5个不同的模拟节点');
 const plugin=applicationPlugin(service.id);try{plugin?.validate?.({parameters,overrides,mode,nodes});}catch(e){invalid(e.message)}
 const workflow=structuredClone(service.workflow);for(const step of workflow.steps)if(overrides[step.id])step.parameters={...step.parameters,...overrides[step.id]};
 const baseFlow=structuredClone(workflow);if(mode!=='source'){
 workflow.steps=[{id:'partition',kind:'platform-adapter',implementation:'planned',label:'校验授权并生成分片清单',dependsOn:[],parameters:{mode,partitionKey:service.collaboration.partitionKey,nodes},outputs:{manifest:'partition-manifest.json'}},...nodes.map(n=>({id:'node_'+n,kind:'subworkflow',implementation:'planned',label:'节点 '+n.toUpperCase()+' 本地处理',placement:n,dependsOn:['partition'],inputs:{manifest:'partition.manifest'},workflow:structuredClone(baseFlow),outputs:{summary:'node-'+n+'-summary.json',artifacts:'node-'+n+'-artifacts.zip'}})),{id:'merge',kind:'platform-adapter',implementation:'planned',label:'跨节点结果校验与汇聚',dependsOn:nodes.map(n=>'node_'+n),parameters:{rules:service.collaboration.mergeRules,failurePolicy:service.collaboration.failurePolicy},outputs:{product:'artifacts/product.zip',manifest:'artifacts/provenance.json'}}];}
 if(service.id==='svc-048'){if(mode!=='partitioned')invalid('千粒重当前仅支持分片协同');workflow.steps=[...nodes.flatMap(n=>[{id:'read_'+n,operator:'read_item@1.0',inputs:{},parameters:{uri:'待运行时绑定Union合成种子数据集/seeds.csv',view:'bytes'}},{id:'seed_'+n,operator:'conet_seed_local@1.0',inputs:{source:'read_'+n},parameters:{node:n,fieldMapping:parameters.fieldMapping,analysisScope:parameters.analysisScope,sampleLimit:parameters.sampleLimit}}]),{id:'merge',operator:'conet_seed_merge_'+nodes.length+'@1.0',inputs:Object.fromEntries(nodes.map((n,i)=>['p'+i,'seed_'+n])),parameters:{nodes}}];}
 if(plugin?.workflow)workflow.steps=plugin.workflow({nodes,parameters});
 return {collaboration:{...service.collaboration,mode,computeNodes:nodes},id:randomUUID(),createdAt:new Date().toISOString(),status:'draft',kind:'job-design',executionEnabled:false,service:{id:service.id,version:service.version,title:service.title},name,node:node==='source'?{mode:'source-local',sources:service.sourceNodes}:{mode:'simulation',id:node},datasets:service.datasets.filter(d=>input.datasetIds.includes(d.id)),parameters,workflow,operators:service.operators,executionPolicy:service.executionPolicy,outputs:service.outputs,checks:{metadataBound:true,filesAccessible:'assumed',nodeComputable:'assumed',fieldSchemaVerified:false,operatorParametersVerified:false,engineCompiled:false},notice:'Job草稿已保存，尚未编译为可执行XStream Job，也未创建Job Run。'};
}
export async function saveJob(input){const job=makeJob(input);await fs.mkdir(jobRoot,{recursive:true,mode:0o700});await fs.writeFile(path.join(jobRoot,job.id+'.json'),JSON.stringify(job,null,2),{flag:'wx',mode:0o600});return job;}
export async function readJob(id){if(!/^[0-9a-f-]{36}$/.test(id))return null;try{return JSON.parse(await fs.readFile(path.join(jobRoot,id+'.json'),'utf8'))}catch(e){if(e.code==='ENOENT')return null;throw e}}
export async function readBody(req){let bytes=0,chunks=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>262144)invalid('任务配置过大');chunks.push(chunk)}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{invalid('请求必须是有效JSON')}}

export async function listJobs(){let files;try{files=await fs.readdir(jobRoot)}catch(e){if(e.code==='ENOENT')return {rows:[]};throw e}const jobs=[];for(const name of files.filter(n=>/^[0-9a-f-]{36}\.json$/.test(n))){const j=await readJob(name.slice(0,-5));if(j)jobs.push({id:j.id,name:j.name,service:j.service,status:j.status,createdAt:j.createdAt,node:j.node,datasetCount:j.datasets.length})}jobs.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));return {rows:jobs.slice(0,50),total:jobs.length};}

