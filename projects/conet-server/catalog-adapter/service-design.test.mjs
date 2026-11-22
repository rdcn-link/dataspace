import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {serviceList,serviceDetail,makeJob} from './service-design.mjs';
test('every service has evidence, registered tools and a closed acyclic flow',()=>{
 const list=serviceList();assert.equal(list.total,60);assert.equal(new Set(list.rows.map(s=>s.id)).size,60);
 const tools=JSON.parse(fs.readFileSync(new URL('./fixtures/curated-operators.json',import.meta.url)));
 const available=new Set(tools.map(t=>t.name+'@'+t.version));
 for(const summary of list.rows){const s=serviceDetail(summary.id);assert(s.datasets.length);assert(s.parameters.length);const seen=new Set();for(const step of s.workflow.steps){assert(!seen.has(step.id));for(const dep of step.dependsOn)assert(seen.has(dep),dep);if(step.kind==='operator')assert(available.has(step.operator));seen.add(step.id)}assert(seen.has('collect'));assert.equal(s.executionEnabled,false);assert(s.outputs.length>=3);}
});
const s=serviceDetail('svc-001');
const base={serviceId:s.id,datasetIds:[s.datasets[0].id],node:'a',parameters:{input_path:'inputs/sample.nc',fieldMapping:{},analysisScope:{},sampleLimit:1000}};
test('job creation freezes service version, source bindings and nonexecution state',()=>{const job=makeJob(base);assert.equal(job.status,'draft');assert.equal(job.executionEnabled,false);assert.equal(job.checks.engineCompiled,false);assert.equal(job.datasets[0].id,s.datasets[0].id);assert.notEqual(job.id,makeJob(base).id);job.workflow.steps.pop();assert.notEqual(job.workflow.steps.length,s.workflow.steps.length)});
test('reject alien datasets, traversal and invalid controls',()=>{for(const value of [{...base,datasetIds:['not-a-bound-dataset']},{...base,node:'evil'},{...base,parameters:{...base.parameters,input_path:'../secrets'}},{...base,parameters:{...base.parameters,sampleLimit:0}},{...base,operatorParameters:{unknown:{}}}])assert.throws(()=>makeJob(value));});
test('seed jobs freeze selected-node pipeline and reject unsupported execution overrides',()=>{
 const seed=serviceDetail('svc-048'),input={serviceId:seed.id,datasetIds:[seed.datasets[0].id],parameters:Object.fromEntries(seed.parameters.map(p=>[p.key,p.default])),computeNodes:['b','d','e']};
 const job=makeJob(input),merge=job.workflow.steps.at(-1);
 assert.equal(merge.operator,'conet_seed_merge_3@1.0');assert.deepEqual(merge.inputs,{p0:'seed_b',p1:'seed_d',p2:'seed_e'});
 assert.deepEqual(job.collaboration.computeNodes,['b','d','e']);assert.equal(job.workflow.steps[1].parameters.node,'b');
 assert.throws(()=>makeJob({...input,collaborationMode:'replicated'}));assert.throws(()=>makeJob({...input,operatorParameters:{tool_1:{max_rows:2}}}));
});
test('discovered fire application freezes selected nodes and blocks unsupported controls',()=>{
 const fire=serviceDetail('svc-023'),input={serviceId:fire.id,datasetIds:[fire.datasets[0].id],parameters:Object.fromEntries(fire.parameters.map(p=>[p.key,p.default])),computeNodes:['b','d']};
 const job=makeJob(input);assert.equal(job.workflow.steps.at(-1).operator,'conet_fire_merge_2@1.1');assert.deepEqual(job.workflow.steps.at(-1).inputs,{p0:'fire_b',p1:'fire_d'});
 assert.throws(()=>makeJob({...input,collaborationMode:'replicated'}),e=>e.statusCode===400);
 assert.throws(()=>makeJob({...input,parameters:{...input.parameters,sampleLimit:20001}}),e=>e.statusCode===400);
 assert.throws(()=>makeJob({...input,operatorParameters:{tool_1:{}}}),e=>e.statusCode===400);
});
