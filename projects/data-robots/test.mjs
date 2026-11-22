import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from './server.mjs';
import {parseCSV,validateInput,execute} from './engine.mjs';
import {robots} from './catalog.mjs';
test('CSV counts quoted multiline values, missing values, duplicates and malformed rows',()=>{
 const s=parseCSV('name,value\n"A\nB",1\nC,\nC,\nD,2,3\n');assert.equal(s.rows,4);assert.equal(s.empty,2);assert.equal(s.duplicateRows,1);assert.equal(s.inconsistentRows,1);assert.throws(()=>parseCSV('a,b\n"bad,1'),/未闭合/);
});
test('Planning does not invent sample metrics; FAIR remains evidence-based',async()=>{
 const input={title:'No data',description:'Planned dataset',identifier:'10.example/test'};
 const q=await execute({id:'test',robotId:'quality',input,mode:'planning',sample:'a,b\n1,2',centerName:'test'});assert.equal(q.report.sample,null);assert.match(q.report.observations[0],/未计算/);
 const f=await execute({id:'test',robotId:'fair',input,mode:'planning',sample:'',centerName:'test'});assert.equal(f.report.checks.length,15);assert.equal(f.report.counts.verified,0);assert.equal(f.report.checks.find(c=>c.id==='F4').status,'pending');
 assert.throws(()=>validateInput({robotId:'quality',input:{title:'X'},mode:'sample',sample:''}),/需要 CSV/);
});
test('Task lifecycle, downloads, planned-center restriction and durable review records',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'data-robots-test-'));let server=createApp(directory);
 const start=()=>new Promise(r=>server.listen(0,'127.0.0.1',r));const stop=()=>new Promise(r=>server.close(r));await start();
 let url='http://127.0.0.1:'+server.address().port;
 const get=p=>fetch(url+p).then(r=>r.json());const post=(p,b,origin)=>fetch(url+p,{method:'POST',headers:{'content-type':'application/json',...(origin?{origin}:{})},body:JSON.stringify(b)});
 try{
  const center=await (await post('/api/centers',{name:'Planned center'})).json();const body={robotId:'quality',centerId:center.id,input:{title:'Synthetic check'},mode:'sample',sample:'station,value\nA,10\nB,\nA,10\n'};
  assert.equal((await post('/api/runs',body)).status,400);body.centerId='local-9048';assert.equal((await post('/api/runs',body,'https://untrusted.example')).status,403);
  const created=await (await post('/api/runs',body)).json();let run;for(let i=0;i<30;i++){run=await get('/api/runs/'+created.id);if(run.status==='awaiting_review')break;await new Promise(r=>setTimeout(r,20));}
  assert.equal(run.status,'awaiting_review');assert.equal(run.report.sample.duplicateRows,1);assert.equal(run.report.sample.empty,1);assert.equal(run.sample,undefined);
  const download=await fetch(url+`/api/runs/${run.id}/artifacts/0`);assert.equal(download.status,200);assert.equal((await download.json()).rows,3);
  assert.equal((await post(`/api/runs/${run.id}/review`,{decision:'approve',reviewer:'Test',comment:''})).status,400);
  assert.equal((await post(`/api/runs/${run.id}/review`,{decision:'approve',reviewer:'Test',comment:'Sample metrics checked; no production approval.'})).status,200);
  assert.equal((await post(`/api/runs/${run.id}/review`,{decision:'approve',reviewer:'Test',comment:'Again'})).status,409);
  await stop();server=createApp(directory);await start();url='http://127.0.0.1:'+server.address().port;const saved=await get('/api/runs/'+run.id);assert.equal(saved.status,'reviewed');assert.equal(saved.reviews.length,1);
 }finally{await stop();fs.rmSync(directory,{recursive:true,force:true});}
});
test('Every business robot produces a scoped report and deliverable without data',async()=>{
 for(const r of robots.filter(r=>r.id!=='operations')){const result=await execute({id:'test',robotId:r.id,input:{title:'Planned data',objective:'Develop an analysis service'},mode:'planning',sample:'',centerName:'test'});assert.ok(result.artifacts.length>=2,r.id);assert.ok(result.artifacts.some(a=>a.name==='report.md'));assert.equal(result.report.counts.verified,0);}
});
