import {seekConfiguration,openDatasetSeek} from './dataset-seek.mjs';
import {publicProfile,profileUpdate} from './user-profile.mjs';
import fs from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {seal,unseal,cookie,mayManage,mayRun,mayDownloadRun,mayViewRun,publicUser,accountMaySignIn,verifiedAccountRole} from './access-contract.mjs';
const safeId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,160}$/.test(id);
export async function createAccessGateway(configPath,{fetcher=fetch,clock=Date.now}={}){
 const config=JSON.parse(await fs.readFile(configPath,'utf8')),key=Buffer.from(await fs.readFile(config.keyFile,'utf8').then(s=>s.trim()),'hex');if(key.length!==32)throw Error('Invalid access cookie key');
 if(config.enabled!==true)throw Error('Access gateway must be explicitly enabled');
 const origin=new URL(config.publicOrigin).origin,oidc=config.oidcURL.replace(/\/$/,''),admins=config.platformAdminUids||[],temporaryUids=config.temporaryLoginUids||[];let registry=JSON.parse(await fs.readFile(config.registryFile,'utf8')),mutations=Promise.resolve();
 const userFrom=(profile,d)=>({uid:d.uid,name:profile.name||profile.nickName||d.name||d.username||'微信用户',username:profile.username||'',...verifiedAccountRole(profile,config.accountRoles||{})});
 const isPlatformAdmin=user=>!!user&&admins.includes(user.uid)&&['administrator','super-administrator'].includes(user.role);
 const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value))};
 const fail=(status,message)=>Object.assign(Error(message),{status});
 function setCookie(res,name,value,seconds){res.setHeader('Set-Cookie',[...(res.getHeader('Set-Cookie')||[]),`${name}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}${origin.startsWith('https:')?'; Secure':''}`])}
 function sameOrigin(req){if(req.headers.origin&&req.headers.origin!==origin)throw fail(403,'请求来源不匹配');if(req.headers['sec-fetch-site']==='cross-site')throw fail(403,'不允许跨站提交');if(req.headers.host!==new URL(origin).host)throw fail(403,'请求地址不匹配')}
 async function body(req,limit=524288){let size=0;const chunks=[];for await(const c of req){size+=c.length;if(size>limit)throw fail(413,'请求过大');chunks.push(c)}const bytes=Buffer.concat(chunks);try{return {bytes,value:JSON.parse(bytes)}}catch{throw fail(400,'请求必须为JSON')}}
 async function read(url,options={}){const r=await fetcher(url,{...options,signal:AbortSignal.timeout(45000)});if(!r.ok)throw fail(503,'身份服务暂不可用，请稍后重试');return r.json()}
 function data(d){if(d&&d.code!==undefined&&![0,200,'200'].includes(d.code))throw fail(401,'身份校验未通过，请重新扫码');return d?.data??d}
 async function enrollComputeAdmin(profile,user){const enrollment=config.computeAdminEnrollment;if(!enrollment||profile.username!==enrollment.username||!isPlatformAdmin(user)||!profile.serviceOpenId)return;const file=enrollment.configFile;const current=JSON.parse(await fs.readFile(file,'utf8'));if(!current.centerOverrides?.[enrollment.source]?.pendingEnrollment)return;current.centerOverrides[enrollment.source]={adminUid:user.uid,adminOpenId:profile.serviceOpenId,basis:'Explicit CONET-only administrator designation verified against current OIDC session',configuredAt:new Date(clock()).toISOString()};const temp=file+'.'+randomUUID()+'.tmp';await fs.writeFile(temp,JSON.stringify(current,null,2),{mode:0o600});await fs.rename(temp,file)}
 async function principal(req){const c=unseal(cookie(req,'conet_identity'),key,'identity',clock());if(!c||c.issuer!==oidc)return null;try{const d=data(await read(oidc+'/sso/uid',{method:'POST',headers:{Authorization:'Bearer '+c.token}}));if(!d.uid||d.uid!==c.uid)return null;const profile=data(await read(oidc+'/user/user.findbyuid?uid='+encodeURIComponent(d.uid)));if(!profile||profile.uid!==d.uid||!accountMaySignIn(profile,temporaryUids))return null;const user=userFrom(profile,d);await enrollComputeAdmin(profile,user);return user}catch(e){if(e.status===503)throw e;return null}}
 async function persist(change){const next=mutations.then(async()=>{const copy=structuredClone(registry);await change(copy);const temp=config.registryFile+'.'+randomUUID()+'.tmp';await fs.writeFile(temp,JSON.stringify(copy,null,2),{mode:0o600});await fs.rename(temp,config.registryFile);registry=copy});mutations=next.catch(()=>{});await next}
 function manage(app,user){if(!user)throw fail(401,'请先微信扫码登录');if(!mayManage(registry,app,user,admins))throw fail(403,'仅应用创建者可运行或管理该应用')}
 function runnable(app,user){requireUser(user);if(!mayRun(registry,app,user,admins))throw fail(403,'该应用尚未向当前用户开放使用')}
 function download(app,run,user){requireUser(user);if(!mayDownloadRun(registry,app,run,user,admins))throw fail(403,'只能下载自己的任务成果或有管理权限的成果')}
 function view(app,run,user){if(!mayViewRun(registry,app,run,user,admins))throw fail(user?403:401,'该案例尚未由应用创建者发布')}
 function requireUser(user){if(!user)throw fail(401,'请先微信扫码登录')}
 async function auth(req,res,p){
  if(!p.startsWith('/api/auth/'))return false;
  try{
   if(req.method!=='GET'&&req.method!=='HEAD')sameOrigin(req);
   if(p==='/api/auth/dataset-seek'&&req.method==='POST'){const user=await principal(req);requireUser(user);const input=(await body(req,2048)).value;if(Object.keys(input).some(k=>k!=='metadataId')||!/^[a-f0-9]{24}$/i.test(input.metadataId||''))throw fail(400,'数据集标识无效');const r=await fetcher(config.catalogURL+'/api/metadata/datasets/'+input.metadataId,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw fail(404,'数据集不存在或暂不可访问');const d=await r.json();if(['tpdc','chem'].includes(seekConfiguration({...d.dataset,datasetId:'pending',dataSetId:undefined}).center)){const mapped=await read(config.catalogURL+'/api/metadata/internal/dataset-seek-config?metadataId='+input.metadataId);if(!mapped.dataset)throw fail(409,mapped.error||'该数据集尚未配置可用的智能探查资源');d.dataset=mapped.dataset;}const result=await openDatasetSeek({dataset:d.dataset,uid:user.uid,oidc,fetcher});json(res,200,result);return true}
   if(p==='/api/auth/profile'&&['GET','POST'].includes(req.method)){const u=await principal(req);requireUser(u);let profile=data(await read(oidc+'/user/user.findbyuid?uid='+encodeURIComponent(u.uid)));if(profile.uid!==u.uid)throw fail(401,'账号身份不匹配');if(req.method==='POST'){const b=(await body(req,8192)).value,payload=profileUpdate(profile,b);const target=data(await read(oidc+'/user/user.findbyopenid?type=0&openId='+encodeURIComponent(payload.serviceOpenId)));if(target?.uid!==u.uid)throw fail(409,'账号绑定与当前身份不一致，请联系统一账号管理员');const session=unseal(cookie(req,'conet_identity'),key,'identity',clock());data(await read(oidc+'/user/user.updateUser',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.token},body:JSON.stringify(payload)}));profile=data(await read(oidc+'/user/user.findbyuid?uid='+encodeURIComponent(u.uid)));try{await read(config.catalogURL+'/api/metadata/platform/user-center/profile-audit',{method:'POST',headers:{'Content-Type':'application/json','x-conet-actor':u.uid},body:JSON.stringify({fields:Object.keys(b)})})}catch{}}json(res,200,{profile:publicProfile(profile,u)});return true}
   if(p==='/api/auth/designer-access'&&req.method==='GET'){const user=await principal(req);requireUser(user);json(res,200,{allowed:true});return true}
   if(p==='/api/auth/me'&&req.method==='GET'){const user=await principal(req);json(res,200,{authenticated:!!user,user:publicUser(user),canCreateApplication:!!user});return true}
   if(p==='/api/auth/logout'&&req.method==='POST'){setCookie(res,'conet_identity','',0);setCookie(res,'conet_wechat','',0);json(res,200,{loggedOut:true});return true}
   if(p==='/api/auth/wechat/start'&&req.method==='POST'){
    const d=await read(oidc+'/wechat/wxLogin');if(typeof d.loginToken!=='string'||!/^[a-zA-Z0-9_-]{20,128}$/.test(d.loginToken))throw fail(503,'身份服务未生成有效二维码');const qr=new URL(d.qrCodeUrl);if(qr.protocol!=='https:'||!['mp.weixin.qq.com','weixin.qq.com'].includes(qr.hostname))throw fail(503,'身份服务返回了不支持的二维码地址');
    setCookie(res,'conet_wechat',seal({purpose:'wechat',issuer:oidc,ticket:d.loginToken,expires:clock()+300000},key),300);json(res,200,{qrCodeUrl:d.qrCodeUrl,expiresIn:300});return true
   }
   if(p==='/api/auth/wechat/status'&&req.method==='POST'){
    const c=unseal(cookie(req,'conet_wechat'),key,'wechat',clock());if(!c||c.issuer!==oidc){json(res,200,{status:'expired'});return true}
    const d=await read(oidc+'/wechat/status/'+encodeURIComponent(c.ticket));if(Number(d.status)===3){setCookie(res,'conet_wechat','',0);json(res,200,{status:'expired'});return true}
    if(Number(d.status)!==2||typeof d.openId!=='string'||!d.openId){json(res,200,{status:'waiting'});return true}
    const profile=data(await read(oidc+'/user/user.findbyopenid?type=0&openId='+encodeURIComponent(d.openId)));if(!profile||typeof profile.uid!=='string'||!profile.uid.trim())throw fail(403,'微信已确认，请先在费尔空间完善账号资料后重新扫码');
    if(!accountMaySignIn(profile,temporaryUids))throw fail(403,'微信身份已确认，但该账号不在当前允许登录范围或已停用，请联系账号管理员');
    const token=data(await read(oidc+'/sso/token?uid='+encodeURIComponent(profile.uid),{method:'POST'}));if(typeof token.accessToken!=='string'||!token.accessToken)throw fail(503,'身份服务未返回登录票据');
    const verified=data(await read(oidc+'/sso/uid',{method:'POST',headers:{Authorization:'Bearer '+token.accessToken}}));if(verified.uid!==profile.uid)throw fail(401,'身份校验不一致，请重新扫码');
    const seconds=Math.min(8*3600,Number(token.expiresIn)||3600);if(seconds<1)throw fail(401,'登录票据已过期');setCookie(res,'conet_identity',seal({purpose:'identity',issuer:oidc,token:token.accessToken,uid:verified.uid,expires:clock()+seconds*1000},key),seconds);setCookie(res,'conet_wechat','',0);json(res,200,{status:'confirmed',user:publicUser(userFrom(profile,verified))});return true
   }
   const permission=p.match(/^\/api\/auth\/applications\/([A-Za-z0-9_-]+)$/);
   if(permission&&req.method==='GET'&&config.computationApprovalsEnabled===true){const u=await principal(req);json(res,200,{authenticated:!!u,currentUserId:u?.uid||null,canRun:!!u,canManage:mayManage(registry,permission[1],u,admins),canDownload:!!u,approvalRequired:true,validationMode:false,cases:{}});return true}
   if(permission&&req.method==='GET'&&config.applicationValidationMode===true){json(res,200,{authenticated:false,validationMode:true,currentUserId:'platform-engineering-validation',canRun:true,canManage:true,ownerKind:'platform',cases:{},notice:'应用验证模式：暂不执行用户权限业务；不代表正式数据中心批准'});return true}
   if(permission&&req.method==='GET'){const u=await principal(req),id=permission[1];json(res,200,{authenticated:!!u,currentUserId:u?.uid||null,canRun:mayRun(registry,id,u,admins),canManage:mayManage(registry,id,u,admins),ownerKind:registry.apps[id]?.owner==='platform'?'platform':'user',cases:Object.fromEntries(Object.entries(registry.apps[id]?.cases||{}).filter(([,c])=>mayManage(registry,id,u,admins)||c.published).map(([id,c])=>[id,{published:c.published,kind:c.kind}]))});return true}
   const publication=p.match(/^\/api\/auth\/applications\/([A-Za-z0-9_-]+)\/cases\/([A-Za-z0-9_-]+)$/);
   if(publication&&req.method==='POST'){
    const [,app,id]=publication,u=await principal(req);if(config.computationApprovalsEnabled===true){requireUser(u);const b=(await body(req,8192)).value;const result=await read(config.catalogURL+'/api/metadata/platform/applications/'+app+'/tasks/'+id+'/publication',{method:'POST',headers:{'Content-Type':'application/json','x-conet-actor':u.uid,'x-conet-platform-admin':String(isPlatformAdmin(u)),'x-conet-display-name':encodeURIComponent(u.name)},body:JSON.stringify(b)});json(res,200,result);return true}manage(app,u);const b=(await body(req,4096)).value;if(Object.keys(b).some(k=>k!=='published')||typeof b.published!=='boolean')throw fail(400,'发布参数无效');
    let run;if(/^svc-\d{3}$/.test(app))run=await read(config.catalogURL+'/api/metadata/applications/'+app+'/runs/'+id);else run=await read(config.backendURL+'/apps/'+app+'/api/jobs/'+id);
    if(run.state!=='succeeded')throw fail(400,'仅成功完成的记录可以发布为案例');
    await persist(r=>{r.apps[app].cases[id]={published:b.published,kind:r.apps[app].cases[id]?.kind||(run.synthetic?'synthetic-demo':'user-case'),consentedBy:u.uid,updatedAt:new Date(clock()).toISOString()}});json(res,200,{published:b.published});return true
   }
   json(res,404,{error:'未找到身份接口'});return true
  }catch(e){json(res,e.status||503,{error:e.status?e.message:'身份服务暂不可用，请稍后重试'});return true}
 }
 async function before(req,p){
  const write=!['GET','HEAD'].includes(req.method);if(write)sameOrigin(req);
  if(/^\/api\/metadata\/platform\/datasets\/[a-f0-9]{24}\/views$/i.test(p)&&req.method==='POST')return {};
  if(p.startsWith('/api/metadata/internal/'))throw fail(404,'接口不存在');
  if(p==='/api/products'||/^\/products\/[A-Za-z0-9_-]+\/(?:api|permissions|revoke|files\/[A-Za-z0-9_.-]+|preview\/[A-Za-z0-9_.-]+)$/.test(p)){const user=await principal(req);if(write||p.includes('/files/'))requireUser(user);return {user,isPlatformAdmin:isPlatformAdmin(user),registryPath:p==='/api/products'?'/api/metadata/platform/products':'/api/metadata/platform'+p}}
  if(p==='/api/metadata/platform/website-style'){if(req.method==='GET')return {};const user=await principal(req);requireUser(user);if(!isPlatformAdmin(user))throw fail(403,'仅管理员可修改网站风格');return {user,isPlatformAdmin:true}}
  if(p==='/api/metadata/platform/public-nodes'&&req.method==='GET')return {};
  if(p==='/api/metadata/platform/node-management'||p.startsWith('/api/metadata/platform/node-management/')){const user=await principal(req);requireUser(user);if(!isPlatformAdmin(user))throw fail(403,'仅管理员可维护节点');return {user,isPlatformAdmin:true}}
  if(p==='/api/metadata/platform/user-center/profile-audit')throw fail(404,'接口不存在');
  if(p.startsWith('/user-center/robots')){const user=await principal(req);requireUser(user);if(!isPlatformAdmin(user))throw fail(403,'仅管理员可管理数据智能机器人');return {user,isPlatformAdmin:true,robotProxy:true}}
  if(p.startsWith('/api/metadata/platform/user-center/')||/^\/api\/metadata\/platform\/applications\/[A-Za-z0-9_-]+\/favorite$/.test(p)){const user=await principal(req);requireUser(user);return {user,isPlatformAdmin:isPlatformAdmin(user)}}
  if(/^\/api\/metadata\/platform\/applications\/[A-Za-z0-9_-]+\/rating$/.test(p)){const user=await principal(req);if(write)requireUser(user);return {user,isPlatformAdmin:isPlatformAdmin(user)}}
  if(p==='/api/appbuilder/designer'||p.startsWith('/api/appbuilder/designer/')){const user=await principal(req);requireUser(user);return {user,authoringDesigner:true,designerBackendURL:config.designerBackendURL}}
  // All authoring entry points share the Mongo-backed publication/ownership policy.
  if(p==='/api/appbuilder/apps'&&write){const user=await principal(req);requireUser(user);return {user,isPlatformAdmin:isPlatformAdmin(user),registryPath:'/api/metadata/platform/applications'}}
  if(p==='/api/appbuilder/apps'&&!write){const user=await principal(req);return {user,isPlatformAdmin:isPlatformAdmin(user),registryPath:'/api/metadata/platform/applications',registryArray:true}}
  if(/^\/api\/appbuilder\/(?:apps|packages)\/[^/]+\//.test(p))throw fail(404,'应用管理接口不存在');
  if(p==='/api/appbuilder/packages/import'&&write){const user=await principal(req);requireUser(user);return {user,isPlatformAdmin:isPlatformAdmin(user),registryPath:'/api/metadata/platform/application-packages/import'}}
  const authoring=p.match(/^\/api\/appbuilder\/(apps|packages)\/([A-Za-z0-9_-]+)$/);if(authoring){const user=await principal(req);requireUser(user);if(write)throw fail(405,'请通过草稿接口保存应用');return {user,isPlatformAdmin:isPlatformAdmin(user),registryPath:'/api/metadata/platform/applications/'+authoring[2]+'/'+(authoring[1]==='packages'?'package':'authoring')}}
  if(p.startsWith('/api/metadata/platform/')){const user=await principal(req);if(write)requireUser(user);if(write&&/\/(bindings|refresh)$/.test(p)&&!isPlatformAdmin(user))throw fail(403,'仅管理员可以维护应用与资源登记');return {user,isPlatformAdmin:isPlatformAdmin(user)}}
  if(config.applicationValidationMode===true&&config.computationApprovalsEnabled!==true&&/^\/api\/metadata\/(?:platform(?:\/|$)|applications\/svc-\d{3}(?:\/|$)|application-validation\/svc-\d{3}(?:\/|$)|service-jobs(?:\/|$)|simulation-runs(?:\/|$))/.test(p))return {user:{uid:'platform-engineering-validation'},validationMode:true};
  if(config.applicationValidationMode===true&&config.computationApprovalsEnabled!==true&&/^\/api\/appbuilder\/(?:validate|convert|pages\/generate|media|settings|packages)(?:\/|$)/.test(p))return {validationMode:true};
  if(config.applicationValidationMode===true&&config.computationApprovalsEnabled!==true&&/^\/apps\/[A-Za-z0-9_-]+\/(?:api\/(?:config|preview|jobs(?:\/[A-Za-z0-9_-]+(?:\/(?:cancel|plan))?)?)|results\/[A-Za-z0-9_-]+\/[a-zA-Z0-9_.-]+)$/.test(p))return {user:{uid:'platform-engineering-validation'},validationMode:true,appConfig:p.endsWith('/api/config')};
  const user=await principal(req),ctx={user};
  if(p==='/api/ratings'&&write){requireUser(user);const b=await body(req,8192);ctx.body=b.bytes;if(b.value.kind==='app'){if(!safeId(b.value.id))throw fail(400,'应用标识无效');ctx.registryPath='/api/metadata/platform/applications/'+encodeURIComponent(b.value.id)+'/rating';ctx.body=Buffer.from(JSON.stringify({score:b.value.score,...(b.value.comment!==undefined?{comment:b.value.comment}:{})}))}return ctx}
  // Private storage and legacy editing tools have no personal namespace yet.
  if(p.startsWith('/api/storage/')){requireUser(user);if(!isPlatformAdmin(user))throw fail(403,'共享文件管理目前仅对平台管理员开放');return ctx}
  if(p.startsWith('/oidc-server/')||p.startsWith('/sso/')||p.startsWith('/wechat/'))throw fail(404,'未找到接口');
  const nppCase=p.match(/^\/api\/metadata\/applications\/(svc-\d{3})\/cases(?:\/([A-Za-z0-9_-]+)\/prefill)?$/);if(nppCase){if(write)throw fail(405,'不支持此操作');if(nppCase[2])view(nppCase[1],nppCase[2],user);else ctx.filterCases=nppCase[1];return ctx}
  const nppInspect=p.match(/^\/api\/metadata\/applications\/(svc-\d{3})\/inspections(?:\/([A-Za-z0-9_-]+))?$/);if(nppInspect){const [,app,id]=nppInspect;runnable(app,user);if(write){if(id)throw fail(405,'不支持此操作');const b=await body(req);ctx.body=b.bytes;ctx.input=b.value;ctx.app=app;ctx.newInspection=true;const a=(registry.dataApprovals||[]).find(a=>a.applicationId===app&&a.sourceKey===b.value.sourceKey&&a.sourceContractHash===b.value.sourceContractHash&&a.status==='approved'&&a.formal===true&&a.approverUid&&a.evidence&&(!a.expiresAt||Date.parse(a.expiresAt)>clock()));if(!a)throw fail(403,'输入文件检查也需要数据中心授权；当前仅可查看适配说明及已发布案例')}else if(!id||registry.inspections?.[id]?.owner!==user.uid)throw fail(403,'不能访问其他用户的输入检查');return ctx}
  const npp=p.match(/^\/api\/metadata\/applications\/(svc-\d{3})\/runs(?:\/([A-Za-z0-9_-]+)(?:\/([^/]+))?)?$/);
  if(npp){const [,app,id,file]=npp;if(write){runnable(app,user);if(id)throw fail(405,'不支持该操作');const b=await body(req);ctx.body=b.bytes;ctx.input=b.value;ctx.app=app;ctx.newRun=true;
    const approval=(registry.dataApprovals||[]).find(a=>a.applicationId===app&&a.sourceKey===b.value.sourceKey&&a.sourceContractHash===b.value.sourceContractHash&&a.status==='approved'&&a.formal===true&&a.approverUid&&a.evidence&&(!a.expiresAt||Date.parse(a.expiresAt)>clock()));if(!approval)throw fail(403,'该数据集尚未取得数据中心管理员授权，当前不能发起新的分析');if(!b.value.inspectionId||registry.inspections?.[b.value.inspectionId]?.owner!==user.uid)throw fail(403,'须先由当前账号完成输入检查');ctx.approval={kind:'data-center-approval',formalApproval:true,approverUid:approval.approverUid,evidence:approval.evidence,sourceKey:approval.sourceKey,sourceContractHash:approval.sourceContractHash};
   }else if(id){view(app,id,user);if(file&&!['annual.png','map.png'].includes(file))download(app,id,user)}else ctx.filterRuns=app;return ctx}
  const sources=p.match(/^\/api\/metadata\/applications\/svc-\d{3}\/sources$/);if(sources){requireUser(user);return ctx}
  if(/^\/api\/metadata\/applications\/svc-\d{3}\/resources$/.test(p)){requireUser(user);return ctx}
  const validated=p.match(/^\/api\/metadata\/application-validation\/(svc-\d{3})(?:\/(.+))?$/);if(validated){if(validated[2]&&validated[2]!=='annual.png'){requireUser(user);manage(validated[1],user)}return ctx}
  const app=p.match(/^\/apps\/([A-Za-z0-9_-]+)\/(.*)$/);
  if(app){const [,id,suffix]=app;ctx.app=id;
   const run=suffix.match(/^api\/jobs(?:\/([A-Za-z0-9_-]+)(?:\/(.*))?)?$/),artifact=suffix.match(/^results\/([^/]+)\/(.+)$/);
   if(write){manage(id,user);if(run&&!run[1]){ctx.newRun=true;throw fail(403,'该应用的数据中心授权尚未接入，当前不能执行新的分析')}if(run?.[1]&&run[2]==='publication')ctx.publishRun=run[1]}
   else if(run){if(run[1])view(id,run[1],user);else ctx.filterRunArray=id}else if(artifact){requireUser(user);manage(id,user)}
   if(suffix==='api/config')ctx.appConfig=true;return ctx
  }
  if(p==='/api/analyses'){ctx.filterAnalyses=true;return ctx}
  if(p==='/api/products'){ctx.products=true;return ctx}
  const product=p.match(/^\/products\/([A-Za-z0-9_-]+)(?:\/(.*))?$/);if(product){const d=await read(config.backendURL+'/products/'+product[1]+'/api');const id=d.application?.id;ctx.app=id;if(write){manage(id,user);return ctx}if(product[2]==='permissions'){ctx.productPermissions=true;return ctx}ctx.productDocument=product[2]==='api';if(product[2]?.startsWith('files/')){requireUser(user);manage(id,user)}return ctx}
  if(p==='/api/snapshot')ctx.snapshot=true;
  if(p==='/api/metadata/service-jobs'){if(write){requireUser(user);throw fail(403,'请使用应用创建者的任务入口')}ctx.hideDrafts=true;return ctx}
  if(p.startsWith('/api/metadata/service-jobs/')){requireUser(user);if(!isPlatformAdmin(user))throw fail(403,'该历史草稿尚未分配用户归属');return ctx}
  if(p.startsWith('/api/metadata/simulation-runs/')){requireUser(user);if(!isPlatformAdmin(user))throw fail(403,'历史模拟任务由平台管理员管理');return ctx}
  if(p.startsWith('/api/catalog/')&&write){requireUser(user);if(p.endsWith('/presign')&&!isPlatformAdmin(user))throw fail(403,'数据文件访问尚未完成数据中心授权');return ctx}
  if(write){requireUser(user);if(!p.startsWith('/api/appbuilder/')&&p!=='/api/ratings')throw fail(403,'当前接口尚未配置用户授权')}
  return ctx
 }
 async function after(ctx,p,status,b){
  if(status>=400)return b;
  if(ctx.registryArray)return b.rows||[];
  if(ctx.newInspection&&b.id)await persist(r=>{r.inspections??={};r.inspections[b.id]={owner:ctx.user.uid,app:ctx.app,sourceKey:ctx.input.sourceKey,createdAt:new Date(clock()).toISOString()}});
  if(ctx.filterCases&&Array.isArray(b.rows))b.rows=b.rows.filter(c=>mayViewRun(registry,ctx.filterCases,c.id,ctx.user,admins));
  if(ctx.newRun&&b.id)await persist(r=>{r.apps[ctx.app].cases[b.id]={published:false,kind:b.synthetic?'synthetic-demo':b.caseKind||'user-case',createdBy:ctx.user.uid,createdAt:new Date(clock()).toISOString()}});
  if(ctx.publishRun)await persist(r=>{r.apps[ctx.app].cases[ctx.publishRun]={published:true,kind:r.apps[ctx.app].cases[ctx.publishRun]?.kind||'user-case',consentedBy:ctx.user.uid,updatedAt:new Date(clock()).toISOString()}});
  const allowed=(app,id)=>mayViewRun(registry,app,id,ctx.user,admins);
  if(ctx.filterRuns&&Array.isArray(b.rows))b.rows=b.rows.filter(r=>allowed(ctx.filterRuns,r.id));
  if(ctx.filterRunArray&&Array.isArray(b))b=b.filter(r=>allowed(ctx.filterRunArray,r.id));
  if(ctx.filterAnalyses&&Array.isArray(b))b=b.filter(r=>allowed(r.app_id,r.id));
  if(ctx.appConfig&&ctx.validationMode)b.access={canRun:true,canManage:false,canDownload:true};
  else if(ctx.appConfig)b.access={canRun:mayManage(registry,ctx.app,ctx.user,admins),canManage:mayManage(registry,ctx.app,ctx.user,admins),canDownload:mayManage(registry,ctx.app,ctx.user,admins)};
  if(ctx.productDocument)b.can_download=mayManage(registry,ctx.app,ctx.user,admins);
  if(ctx.productPermissions)b={manage:mayManage(registry,ctx.app,ctx.user,admins)};
  if(ctx.hideDrafts)b={rows:[],total:0};
  if(ctx.snapshot&&Array.isArray(b.cases))for(const c of b.cases)c.jobs=(c.jobs||[]).filter(r=>allowed(c.id,r.id));
  return b
 }
 return {auth,before,after,json,permissions:(app,u)=>mayManage(registry,app,u,admins)}
}
