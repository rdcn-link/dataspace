import {proxyRobot} from './backend/robot-proxy.mjs';
import {createAccessGateway} from './backend/access-gateway.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pipeline} from 'node:stream';
const home=path.dirname(fileURLToPath(import.meta.url));
const assets=path.join(home,process.env.CONET_WEB_ROOT||'public');
const upstream=new URL(process.env.CONET_SERVER_URL||'http://127.0.0.1:8870');
const metadataUpstream=new URL(process.env.CONET_CATALOG_URL||'http://127.0.0.1:8871');
if(upstream.protocol!=='http:')throw Error('Use a local HTTP backend or production TLS reverse proxy');
const routes={'/products':'products.html','/user-center':'user-center.html','/':'index.html','/services':'services.html','/nodes':'nodes.html','/catalog':'metadata-catalog.html','/catalog/connected':'catalog.html','/headlines':'headlines.html','/screen':'screen.html','/job-plan':'job-plan.html','/appbuilder':'appbuilder/assets/builder.html','/workspace':'appbuilder/assets/workspace.html'};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'};
export function resolveAsset(raw){
 let p;try{p=decodeURIComponent(raw)}catch{return null}
 if(p.includes('\\')||p.split('/').includes('..')||p.includes('\0'))return null;
 const normalized=p==='/'?p:p.replace(/\/$/,'');
 const name=routes[normalized]||(/^\/apps\/[^/]+$/.test(normalized)?'appbuilder/assets/application.html':/^\/products\/[^/]+$/.test(normalized)?'appbuilder/assets/product.html':p.slice(1));
 const file=path.resolve(assets,name);
 return file.startsWith(assets+path.sep)&&fs.existsSync(file)&&fs.statSync(file).isFile()?file:null;
}
export function createServer(backend=upstream,catalogBackend=metadataUpstream,access=null){return http.createServer(async(req,res)=>{
 try{
 const raw=req.url.split('?')[0];if(/[%\\]/.test(raw)||raw.includes('//')||raw.split('/').some(v=>v==='.'||v==='..')){res.writeHead(400);res.end();return;}
 const parsed=new URL(req.url,'http://localhost'),pathname=parsed.pathname,p=pathname==='/'?'/':pathname.replace(/\/$/,'');
 if(access&&await access.auth(req,res,p))return;
 const file=['GET','HEAD'].includes(req.method)?resolveAsset(pathname):null;
 if(file){res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('X-Content-Type-Options','nosniff');if(req.method==='HEAD')return res.end();if(access&&path.extname(file)==='.html'){const html=await fs.promises.readFile(file,'utf8');res.setHeader('Cache-Control','no-store');res.end(html.replace('</head>','<script src="/auth-ui.js" defer></script></head>'));return;}pipeline(fs.createReadStream(file),res,()=>{});return}
 // Preserve Host and Origin together so the backend's same-origin validation
 // remains effective; forwarding does not grant authorization.
 const ctx=access?await access.before(req,p):{};
 if(ctx.robotProxy){await proxyRobot(req,res,ctx);return}
 const runtimeTask=p.match(/^\/apps\/([A-Za-z0-9_-]+)\/api\/jobs(?:\/([A-Za-z0-9_-]+)(?:\/(cancel|plan))?)?$/),runtimeArtifact=p.match(/^\/apps\/([A-Za-z0-9_-]+)\/results\/([A-Za-z0-9_-]+)\/([a-zA-Z0-9_.-]+)$/);
 const registryPath=ctx.registryPath||(p==='/api/ratings/app'?'/api/metadata/platform/application-ratings':null)|| (runtimeTask?'/api/metadata/platform/applications/'+runtimeTask[1]+'/tasks'+(runtimeTask[2]?'/'+runtimeTask[2]:'')+(runtimeTask[3]?'/'+runtimeTask[3]:''):runtimeArtifact?'/api/metadata/platform/applications/'+runtimeArtifact[1]+'/tasks/'+runtimeArtifact[2]+'/'+runtimeArtifact[3]:null);
 const target=registryPath||pathname==='/api/metadata'||pathname.startsWith('/api/metadata/')?catalogBackend:backend;
 const headers={...req.headers};delete headers['x-conet-display-name'];delete headers['x-conet-user'];delete headers['x-conet-role'];delete headers['x-conet-principal'];delete headers['x-conet-platform-admin'];delete headers['x-conet-actor'];delete headers['x-conet-data-approval'];if(ctx.user){headers['x-conet-actor']=ctx.user.uid;headers['x-conet-display-name']=encodeURIComponent(String(ctx.user.name||'科诺用户').slice(0,60))}if(ctx.isPlatformAdmin)headers['x-conet-platform-admin']='true';if(ctx.approval)headers['x-conet-data-approval']=Buffer.from(JSON.stringify(ctx.approval)).toString('base64url');if(access)headers['accept-encoding']='identity';if(ctx.body)headers['content-length']=ctx.body.length;
 const proxy=http.request({hostname:target.hostname,port:target.port||80,path:registryPath?registryPath+parsed.search:access?p+parsed.search:req.url,method:req.method,headers},reply=>{
  if(access&&String(reply.headers['content-type']).includes('json')){
   const chunks=[];let size=0;reply.on('data',c=>{size+=c.length;if(size>8*1024*1024){reply.destroy();access.json(res,502,{error:'接口响应过大'});}else chunks.push(c)});
   reply.on('end',async()=>{if(res.writableEnded)return;try{const transformed=await access.after(ctx,p,reply.statusCode,JSON.parse(Buffer.concat(chunks)));const value=runtimeTask&&!runtimeTask[2]&&req.method==='GET'?transformed.rows:transformed;const h={...reply.headers,'cache-control':'no-store'};delete h['content-length'];delete h['transfer-encoding'];res.writeHead(reply.statusCode,h);res.end(JSON.stringify(value))}catch{if(!res.headersSent)access.json(res,502,{error:'接口处理失败'});else res.end()}});
  }else{res.writeHead(reply.statusCode,{...reply.headers,...(access?{'cache-control':'no-store'}:{})});pipeline(reply,res,()=>{});}
 });
 proxy.on('error',()=>{if(!res.headersSent)res.writeHead(502,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'服务暂不可用'}));});
 req.on('aborted',()=>proxy.destroy());if(ctx.body)proxy.end(ctx.body);else pipeline(req,proxy,()=>{});
 }catch(e){if(res.headersSent){res.end();return}if(access)access.json(res,e.status||503,{error:e.status?e.message:'服务暂不可用，请稍后重试'});else{res.statusCode=500;res.end();}}

});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))createServer(upstream,metadataUpstream,await createAccessGateway(process.env.CONET_ACCESS_CONFIG||path.join(home,'../identity/access.json'))).listen(Number(process.env.PORT||9588),process.env.HOST||'127.0.0.1',()=>console.log('conet-web ready'));
