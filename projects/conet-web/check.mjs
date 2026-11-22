import assert from 'node:assert/strict';
import http from 'node:http';
import {resolveAsset,createServer} from './server.mjs';
for(const p of ['/','/services/','/nodes/','/catalog/','/catalog/connected/','/headlines/','/appbuilder/','/workspace/','/screen','/apps/check-dams/','/products/example/','/appbuilder/assets/runtime.js'])assert.ok(resolveAsset(p),p);
for(const p of ['/api/config','/apps/example/api/jobs','/products/example/metadata','/../package.json','/%2e%2e/package.json'])assert.equal(resolveAsset(p),null,p);
const mock=http.createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({path:req.url,method:req.method,host:req.headers.host,origin:req.headers.origin,body}));});
await new Promise(r=>mock.listen(0,'127.0.0.1',r));
const server=createServer(new URL(`http://127.0.0.1:${mock.address().port}`),new URL(`http://127.0.0.1:${mock.address().port}`));await new Promise(r=>server.listen(0,'127.0.0.1',r));
try{const base=`http://127.0.0.1:${server.address().port}`;for(const p of ['/','/appbuilder/','/apps/example/']){const r=await fetch(base+p);assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/text\/html/);}
for(const p of ['/api/config?test=1','/api/metadata/datasets?page=2','/apps/example/api/jobs','/apps/example/results/run/file.csv','/products/example/metadata','/appbuilder/media/example.svg','/union-assets/dag.js']){const r=await fetch(base+p);assert.equal((await r.json()).path,p==='/apps/example/api/jobs'?'/api/metadata/platform/applications/example/tasks':p==='/apps/example/results/run/file.csv'?'/api/metadata/platform/applications/example/tasks/run/file.csv':p);}
const response=await fetch(base+'/apps/example/api/jobs',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:'{"test":true}'});const received=await response.json();assert.equal(received.body,'{"test":true}');assert.equal(received.method,'POST');assert.equal(received.origin,base);assert.equal(received.host,new URL(base).host);
console.log('Frontend routes, traversal boundary, HTTP serving and API/upload/result proxy semantics passed');}finally{server.close();mock.close();}
