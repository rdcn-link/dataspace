import http from 'node:http';
import {createMongoRobotStore} from './mongo-store.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {robots,categories} from './catalog.mjs';
import {validateInput,execute} from './engine.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
export function createApp(stateRoot=process.env.ROBOT_STATE||path.join(root,'state'),options={}){
 fs.mkdirSync(stateRoot,{recursive:true,mode:0o700});const dbFile=path.join(stateRoot,'workbench.json');
 const db=options.initialState||(fs.existsSync(dbFile)?JSON.parse(fs.readFileSync(dbFile,'utf8')):{centers:[{id:'local-9048',name:'90.48 本地中心',kind:'local',status:'deployed',note:'当前仅此中心实际运行工作台；其他中心可以登记部署计划。'}],runs:[]});
 const save=()=>{if(options.persist)return options.persist(db);const tmp=dbFile+'.tmp';fs.writeFileSync(tmp,JSON.stringify(db,null,2),{mode:0o600});fs.renameSync(tmp,dbFile);};
 for(const r of db.runs)if(['queued','running'].includes(r.status)){r.status='interrupted';r.error='服务重启时任务中断，请重新创建任务。';}const ready=Promise.resolve(save());
 const publicRun=r=>{const {sample,...safe}=r;return {...safe,hasSample:!!sample};};
 const send=(res,status,data,extra={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra});res.end(JSON.stringify(data));};
 async function perform(run){try{run.status='running';run.events.push({at:new Date().toISOString(),text:'已接收任务，开始生成证据与业务交付物。'});await save();const result=await execute(run);Object.assign(run,result,{status:'awaiting_review',finishedAt:new Date().toISOString()});const robot=robots.find(x=>x.id===run.robotId);for(const text of robot.steps)run.events.push({at:new Date().toISOString(),text:`${text}：已生成相应检查或草案，见成果与证据。`});run.events.push({at:new Date().toISOString(),text:'处理完成，等待人工复核；未执行外部发布。'});await save();}catch(e){run.status='failed';run.error=e.message;run.events.push({at:new Date().toISOString(),text:'处理失败：'+e.message});await save();}}
 const server=http.createServer(async(req,res)=>{try{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'");
  await ready;
  const u=new URL(req.url,'http://localhost');
  if(!['GET','HEAD'].includes(req.method)){
   const origin=req.headers.origin;if(origin&&new URL(origin).host!==req.headers.host)return send(res,403,{error:'仅允许工作台同源操作'});
   if(!req.headers['content-type']?.startsWith('application/json'))return send(res,415,{error:'请使用 JSON 请求'});
  }
  if(u.pathname==='/api/health')return send(res,200,{status:'ok',service:'data-robot-workbench',engine:'rules-and-templates',llmConnected:false});
  if(u.pathname==='/api/catalog')return send(res,200,{robots,categories,centers:db.centers,mode:'business-prototype',llmConnected:false});
  if(u.pathname==='/api/runs'&&req.method==='GET')return send(res,200,db.runs.slice().reverse().map(publicRun));
  let body={};if(req.method==='POST'){let data='';for await(const chunk of req){data+=chunk;if(Buffer.byteLength(data)>350000)return send(res,413,{error:'请求过大，请缩小样本'});}try{body=JSON.parse(data);}catch{return send(res,400,{error:'JSON 格式不正确'});}}
  if(u.pathname==='/api/centers'&&req.method==='POST'){
   if(typeof body.name!=='string'||!body.name.trim()||body.name.length>80)return send(res,400,{error:'请填写 80 字以内的中心名称'});
   if(db.centers.length>=100)return send(res,400,{error:'部署计划最多 100 个中心'});
   const center={id:randomUUID(),name:body.name.trim(),kind:'planned',status:'planned',note:'仅登记部署计划，尚未安装或连接远端服务。'};db.centers.push(center);await save();return send(res,201,center);
  }
  if(u.pathname==='/api/runs'&&req.method==='POST'){
   let input;try{input=validateInput(body);}catch(e){return send(res,400,{error:e.message});}
   const center=db.centers.find(x=>x.id===body.centerId);if(!center||center.kind!=='local')return send(res,400,{error:'该中心尚未部署，当前仅本地中心可运行任务。'});
   if(db.runs.length>=1000)return send(res,400,{error:'工作台已达到 1000 个任务上限，请由管理员归档后继续。'});
   const run={...input,...(req.headers['x-conet-actor']?{createdBy:String(req.headers['x-conet-actor'])}:{}),id:randomUUID(),centerId:center.id,centerName:center.name,status:'queued',createdAt:new Date().toISOString(),events:[{at:new Date().toISOString(),text:'任务已创建。'}],reviews:[],artifacts:[]};db.runs.push(run);await save();send(res,201,publicRun(run));setImmediate(()=>perform(run));return;
  }
  const match=u.pathname.match(/^\/api\/runs\/([a-f0-9-]+)(?:\/(review|artifacts)(?:\/(\d+))?)?$/);
  if(match){const run=db.runs.find(x=>x.id===match[1]);if(!run)return send(res,404,{error:'任务不存在'});
   if(!match[2]&&req.method==='GET')return send(res,200,publicRun(run));
   if(match[2]==='artifacts'&&req.method==='GET'){const artifact=run.artifacts[Number(match[3])];if(!artifact)return send(res,404,{error:'文件不存在'});res.writeHead(200,{'Content-Type':artifact.type+'; charset=utf-8','Content-Disposition':`attachment; filename="${artifact.name}"`,'Cache-Control':'no-store'});return res.end(artifact.content);}
   if(match[2]==='review'&&req.method==='POST'){
    if(run.status!=='awaiting_review')return send(res,409,{error:'只有待复核任务可以提交复核意见'});
    if(!['approve','return'].includes(body.decision)||typeof body.reviewer!=='string'||!body.reviewer.trim()||body.reviewer.length>80||typeof body.comment!=='string'||!body.comment.trim()||body.comment.length>2000)return send(res,400,{error:'请填写复核人、意见并选择有效结论'});
    const actor=req.headers['x-conet-actor'];let reviewer=body.reviewer.trim();if(actor){try{reviewer=decodeURIComponent(req.headers['x-conet-display-name']||'管理员')}catch{reviewer='管理员'}}const review={decision:body.decision,reviewer,comment:body.comment.trim(),at:new Date().toISOString(),identity:actor?'verified_conet_administrator':'self_declared_prototype',...(actor?{reviewerUid:String(actor)}:{})};run.reviews.push(review);run.status=body.decision==='approve'?'reviewed':'needs_revision';run.events.push({at:review.at,text:`${review.reviewer}提交复核：${body.decision==='approve'?'草案复核通过':'退回完善'}。该记录不代表中心执行授权。`});await save();return send(res,200,publicRun(run));
   }
  }
  if(req.method==='GET'||req.method==='HEAD'){const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css'};const name=files[u.pathname];if(name){res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8'});return res.end(req.method==='HEAD'?'':fs.readFileSync(path.join(root,'public',name)));}}
  send(res,404,{error:'页面或操作不存在'});
 }catch(e){console.error(e);if(!res.headersSent)send(res,500,{error:'处理失败，请检查输入或服务日志'});else res.end();}});
 server.ready=ready;return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const store=process.env.CONET_REGISTRY_MONGO_URI?await createMongoRobotStore({uri:process.env.CONET_REGISTRY_MONGO_URI,driver:process.env.CONET_MONGO_DRIVER||'mongodb',legacyFile:path.join(process.env.ROBOT_STATE||path.join(root,'state'),'workbench.json')}):null;
 const app=createApp(undefined,store?{initialState:store.initial,persist:store.save}:{});await app.ready;app.listen(Number(process.env.PORT||9590),process.env.HOST||'127.0.0.1',()=>console.log('Data robot workbench ready'));if(store)for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>app.close(async()=>{await store.close();process.exit(0)}));
}
