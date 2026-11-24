import {createNewsRelations} from './news-relations.mjs';
import {createReportedSeekRanking} from './dataset-seek-ranking.mjs';
import {resolveSeekMapping} from './dataset-seek-mapping.mjs';
import {catalogList,catalogCounts} from './catalog-list.mjs';
import {hubShowcase,HUB_SHOWCASE_PROJECTION} from './hub-showcase.mjs';
import {createPlatformRegistry} from './platform-registry.mjs';
import {applicationArtifact,applicationPlugin,applicationPlugins} from './application-plugins.mjs';
import {startRun,readRun} from './simulation-runs.mjs';
import http from 'node:http';
import {serviceList,serviceDetail,saveJob,readJob,readBody,listJobs} from './service-design.mjs';
import fs from 'node:fs/promises';
import {MongoClient,ObjectId} from 'mongodb';
import {DATASET_FIELDS,publicDataset,publicNews,pageQuery,regexLiteral} from './contracts.mjs';

const uri=process.env.MONGO_URI;if(!uri)throw Error('MONGO_URI must be configured');
const client=new MongoClient(uri,{maxPoolSize:6,serverSelectionTimeoutMS:10000});await client.connect();
const db=client.db('tds'),trading=process.env.TDS_TRADING_URL||'http://127.0.0.1:10013';
const definitions=JSON.parse(await fs.readFile(new URL('./services.json',import.meta.url),'utf8')).services;const platform=await createPlatformRegistry({metadataDB:db,plugins:applicationPlugins(),definitions});
const seekRanking=createReportedSeekRanking({db});const newsRelations=createNewsRelations(db);
const published={status:9};let facetCache=null,facetUntil=0,facetPending=null;
const projection=Object.fromEntries(DATASET_FIELDS.map(k=>[k,1]));
async function tds(path,query={}){
 const u=new URL(trading+'/order/'+path);for(const [key,value]of Object.entries(query))if(value!==''&&value!==undefined)u.searchParams.set(key,String(value));
 const response=await fetch(u,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('业务查询服务暂不可用');
 const body=await response.json();if(body.code!==200)throw Error('业务查询服务未能完成请求');return body.data;
}
async function facets(){
 if(facetCache&&Date.now()<facetUntil)return facetCache;
 if(facetPending)return facetPending;
 facetPending=(async()=>{
  const group=field=>[{$group:{_id:'$'+field,count:{$sum:1}}},{$sort:{count:-1}},{$limit:100}];
  const [value]=await db.collection('tds-dataset').aggregate([{$match:published},{$project:{source:1,dataCenterName:1,shareMode:1}},{$facet:{sources:group('source'),centers:group('dataCenterName'),shareModes:group('shareMode')}}],{allowDiskUse:true,maxTimeMS:20000}).toArray();
  const clean=rows=>rows.filter(r=>typeof r._id==='string'&&r._id.trim()).map(r=>({name:r._id,count:r.count}));
  facetCache={sources:clean(value.sources),centers:clean(value.centers),shareModes:clean(value.shareModes)};facetUntil=Date.now()+300000;return facetCache;
 })();try{return await facetPending}finally{facetPending=null}
}
function idQuery(id){if(!/^[a-fA-F0-9]{24}$/.test(id))return null;return {_id:{$in:[id,new ObjectId(id)]}};}
async function stats(){
 const results=await Promise.allSettled([
  db.collection('tds-dataset').estimatedDocumentCount(),db.collection('tds-dataset').countDocuments(published),db.collection('tds-information').estimatedDocumentCount(),facets(),
  fetch('http://127.0.0.1:8870/api/catalog',{signal:AbortSignal.timeout(12000)}).then(r=>{if(!r.ok)throw Error('Node catalog unavailable');return r.json()}),
  fs.readFile(process.env.SYNC_REPORT||'/mnt/data/conet/catalog-integration/sync-report.json','utf8').then(JSON.parse),
  db.collection('tds-information').aggregate([{$group:{_id:'$source',count:{$sum:1}}},{$sort:{count:-1}}]).toArray(),
  db.collection('tds-datacenter').estimatedDocumentCount()
 ]);
 for(let i=0;i<4;i++)if(results[i].status!=='fulfilled')throw results[i].reason;
 const [allDatasets,publishedDatasets,information,filters]=results.slice(0,4).map(r=>r.value),network=results[4].status==='fulfilled'?results[4].value:null,sync=results[5].status==='fulfilled'?results[5].value:null;
 const newsSources=results[6].status==='fulfilled'?results[6].value.filter(r=>typeof r._id==='string'&&r._id.trim()).map(r=>({name:r._id,count:r.count})):[];
 const dataCenters=results[7].status==='fulfilled'?results[7].value:null;
 return {allDatasets,publishedDatasets,unpublishedDatasets:allDatasets-publishedDatasets,information,dataSources:filters.sources.length,dataCenters,indexedDataCenterNames:filters.centers.length,connectedDatasets:await platform.connectedResourceCount(),products:network?network.datasets.filter(d=>d.product&&d.metadata?.synthetic!==true).length:null,lastSync:sync?.completed_at||null,filters,newsSources};
}
async function route(url){
 const path=url.pathname.replace(/\/$/,'');
 if(path==='/api/metadata/internal/dataset-seek-config'){const id=url.searchParams.get('metadataId');if(!/^[a-f0-9]{24}$/i.test(id||''))throw Error('Invalid metadata ID');const d=await db.collection('tds-dataset').findOne({...idQuery(id),status:9},{projection:{...projection,path:1,external_id:1}});if(!d)return null;try{return {dataset:await resolveSeekMapping({...publicDataset(d),path:d.path,external_id:d.external_id},name=>tds('dataCenter.json',{dataCenterName:name}))}}catch(e){return {dataset:null,error:e.message==='该数据集尚未配置可用的智能探查资源'?e.message:'数据中心探查配置暂不可用，请稍后重试'}};}
 const run=path.match(/^\/api\/metadata\/simulation-runs\/([0-9a-f-]{36})$/);if(run)return readRun(run[1]);
 const validated=path.match(/^\/api\/metadata\/application-validation\/(svc-\d{3})$/);if(validated){const plugin=applicationPlugin(validated[1]);if(plugin?.validation)return plugin.validation();}
 if(path==='/api/metadata/service-jobs')return listJobs();
 if(path==='/api/metadata/application-validation/svc-003')return JSON.parse(await fs.readFile('/mnt/data/conet/domain-validation/applications/svc-003/report.json','utf8'));
 if(path==='/api/metadata/operator-validation'){const rows=JSON.parse(await fs.readFile('/mnt/data/conet/domain-validation/operator-validation.json','utf8'));return {scope:'真实文件包适配器上的专业合成样例验证，不是完整应用验收',rows};}
 if(path==='/api/metadata/services')return serviceList();
 const service=path.match(/^\/api\/metadata\/services\/(svc-\d{3})$/);if(service)return serviceDetail(service[1]);
 const job=path.match(/^\/api\/metadata\/service-jobs\/([0-9a-f-]{36})$/);if(job)return readJob(job[1]);
 if(path==='/api/metadata/health'){await db.command({ping:1});return {status:'ok',database:'local',readOnlyAPI:false,databaseReadOnly:true,jobDraftStorage:'local-files',executionEnabled:false};}
 if(path==='/api/metadata/hub-showcase')return hubShowcase(await db.collection('tds-datacenter').find({},{projection:HUB_SHOWCASE_PROJECTION}).toArray());
 if(path==='/api/metadata/hubs'){
 const [registered,counts]=await Promise.all([tds('dataCenter.all'),facets()]);
 const rows=registered.filter(d=>d.isAccess===1).map(d=>({id:String(d.id??d._id),name:d.data_center_name,organization:d.org_name,source:d.source,introduction:d.introduction,subjects:Array.isArray(d.subject)?d.subject:[],datasetTypes:Array.isArray(d.datasetType)?d.datasetType:[],datasetCount:counts.sources.find(s=>s.name===d.source)?.count??0,accessStatus:'registered',computeStatus:'unverified'}));
 return {total:rows.length,registeredTotal:registered.length,rows};
 }
 if(path==='/api/metadata/stats')return stats();
 if(path==='/api/metadata/facets')return facets();
 if(path==='/api/metadata/catalog-counts')return catalogCounts({countSources:filter=>db.collection('tds-dataset').countDocuments(filter,{maxTimeMS:20000}),readProducts:()=>platform.listProducts()});
 if(path==='/api/metadata/catalog')return catalogList(url.searchParams,{readProducts:()=>platform.listProducts(),countSources:filter=>db.collection('tds-dataset').countDocuments(filter,{maxTimeMS:20000}),readSources:async(filter,offset,limit,sort)=>Promise.all((await seekRanking.list(filter,offset,limit,sort,projection)).map(d=>platform.enrichDataset(publicDataset(d,{summary:true}))))});
 if(path==='/api/metadata/datasets'){
  const q=pageQuery(url.searchParams),filter={status:9};if(q.q)filter.$or=['titleZh','titleEn','cstr','doi'].map(k=>({[k]:{$regex:regexLiteral(q.q),$options:'i'}}));for(const [key,value]of Object.entries({source:q.source,dataCenterName:q.dataCenterName,shareMode:q.shareMode}))if(value)filter[key]=value;if(q.subject)filter.subject={$regex:regexLiteral(q.subject),$options:'i'};const [total,rows]=await Promise.all([db.collection('tds-dataset').countDocuments(filter,{maxTimeMS:20000}),seekRanking.list(filter,(q.page-1)*q.pageSize,q.pageSize,q.sort,projection)]);return {total,page:q.page,pageSize:q.pageSize,totalPages:Math.ceil(total/q.pageSize),rows:await Promise.all(rows.map(d=>platform.enrichDataset(publicDataset(d,{summary:true}))))};
 }
 const datasetMatch=path.match(/^\/api\/metadata\/datasets\/([a-fA-F0-9]{24})$/);
 if(datasetMatch){
  const value=await db.collection('tds-dataset').findOne({...idQuery(datasetMatch[1]),...published},{projection,maxTimeMS:10000});
  if(!value)return null;
  const datasetKey=value.datasetId??value.dataSetId,cstr=typeof value.cstr==='string'&&value.cstr?value.cstr:null;
  const [comments,total,fileRecords,treeRecords]=await Promise.all([
   cstr?db.collection('tds-evaluation').find({cstr},{projection:{_id:0,username:1,description:1,score:1,createAt:1}}).sort({createAt:-1}).limit(20).toArray():Promise.resolve([]),
   cstr?db.collection('tds-evaluation').countDocuments({cstr}):Promise.resolve(0),cstr?db.collection('tds-dataset-file').countDocuments({cstr}):Promise.resolve(0),
   datasetKey?db.collection('scidb_dataseek_filePath').countDocuments({datasetId:datasetKey}):Promise.resolve(0)
  ]);
  const dataset=await platform.enrichDataset(publicDataset({...value,seekCount:await seekRanking.count(value)}));return {dataset,comments,commentTotal:total,fileMappings:{records:fileRecords+treeRecords,connected:dataset.capabilities.filesConnected},notice:dataset.resourceBindings.length?'已关联实体资源；目录登记、DACP连接、抽样读取和方法验证分别显示，本机验证不代表正式跨中心接入。':'只有目录元数据，尚无可执行实体资源绑定。'};
 }
 if(path==='/api/metadata/news'){
  const q=pageQuery(url.searchParams),filter={};if(q.q)filter.name={$regex:regexLiteral(q.q),$options:'i'};if(q.source)filter.source=q.source;
  const [total,rows]=await Promise.all([db.collection('tds-information').countDocuments(filter),db.collection('tds-information').find(filter).sort({updateAt:-1,_id:-1}).skip((q.page-1)*q.pageSize).limit(q.pageSize).toArray()]);
  return {total,page:q.page,pageSize:q.pageSize,totalPages:Math.ceil(total/q.pageSize),rows:await newsRelations.enrichMany(rows.map(d=>publicNews(d,{summary:true})))};
 }
 const news=path.match(/^\/api\/metadata\/news\/([a-fA-F0-9]{24})$/);
 if(news){const value=await db.collection('tds-information').findOne(idQuery(news[1]));return value?{article:(await newsRelations.enrichMany([publicNews(value)]))[0]}:null;}
 return null;
}
const server=http.createServer(async(req,res)=>{
 res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');
 if(await platform.handle(req,res))return;
 if(/^\/api\/metadata\/(?:simulation-runs|service-jobs|applications|application-validation)(?:\/|$)/.test(req.url)){res.statusCode=410;res.end(JSON.stringify({error:'旧业务执行接口已停用，请使用/api/metadata/platform统一应用、任务和成果接口'}));return;}
 const verifiedFile=req.url.match(/^\/api\/metadata\/application-validation\/(svc-\d{3})\/(annual\.csv|annual\.png|result\.zip|report\.json|verification\.json|native-job\.json|common-job\.json)$/);if(verifiedFile&&['GET','HEAD'].includes(req.method)){try{const provider=applicationPlugin(verifiedFile[1]);const bytes=await provider?.validationArtifact?.(verifiedFile[2]);if(!bytes){res.statusCode=404;res.end('{}');return;}const name=verifiedFile[2];res.setHeader('Content-Type',name.endsWith('.png')?'image/png':name.endsWith('.csv')?'text/csv; charset=utf-8':name.endsWith('.zip')?'application/zip':'application/json; charset=utf-8');if(name.endsWith('.csv')||name.endsWith('.zip'))res.setHeader('Content-Disposition','attachment; filename='+name);res.end(req.method==='HEAD'?'':bytes);}catch{res.statusCode=503;res.end('{}');}return;}
 const artifact=req.url.match(/^\/api\/metadata\/simulation-runs\/([0-9a-f-]{36})\/(result\.zip|comparison\.csv|comparison\.png)$/);if(artifact&&['GET','HEAD'].includes(req.method)){try{const data=await applicationArtifact(await readRun(artifact[1]),artifact[2]);if(!data){res.statusCode=404;res.end('{}');return;}res.setHeader('Content-Type',artifact[2].endsWith('.png')?'image/png':artifact[2].endsWith('.csv')?'text/csv; charset=utf-8':'application/zip');res.setHeader('Content-Disposition',(artifact[2].endsWith('.png')?'inline':'attachment')+'; filename='+artifact[2]);res.end(req.method==='HEAD'?'':data);}catch{res.statusCode=503;res.end('{}');}return;}
 if(req.method==='POST'&&req.url==='/api/metadata/simulation-runs'){try{const body=await readBody(req);res.statusCode=202;res.end(JSON.stringify(await startRun(body.jobId)))}catch(e){res.statusCode=400;res.end(JSON.stringify({error:e.message}))}return;}
 if(req.method==='POST'&&req.url==='/api/metadata/service-jobs'){
  try{
   if(req.headers.origin&&req.headers.origin!==('http://'+req.headers.host)&&req.headers.origin!==('https://'+req.headers.host)){res.statusCode=403;res.end(JSON.stringify({error:'请求来源不匹配'}));return;}
   if(!String(req.headers['content-type']||'').startsWith('application/json')){res.statusCode=415;res.end(JSON.stringify({error:'请使用JSON提交配置'}));return;}
   const job=await saveJob(await readBody(req));res.statusCode=201;res.end(JSON.stringify(job));
  }catch(e){res.statusCode=e.statusCode||503;res.end(JSON.stringify({error:e.statusCode?e.message:'任务草稿暂时无法保存'}));}return;
 }
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end(JSON.stringify({error:'当前仅提供查询接口'}));return}
 try{const value=await route(new URL(req.url,'http://localhost'));res.statusCode=value===null?404:200;res.end(req.method==='HEAD'?'':JSON.stringify(value===null?{error:'未找到已发布的数据记录'}:value));}
 catch(e){const invalid=/分页|查询条件|排序字段/.test(e.message);console.error('Catalog query failed:',e.name);res.statusCode=invalid?400:503;res.end(JSON.stringify({error:invalid?e.message:'数据查询暂不可用，请稍后重试'}));}
});
server.listen(Number(process.env.PORT||8871),'127.0.0.1',()=>console.log('Local metadata catalog ready'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(async()=>{await platform.close();await client.close();process.exit(0)}));



