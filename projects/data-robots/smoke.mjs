import fs from 'node:fs';
const origin='http://10.0.90.48:9590';
async function api(p,body){const r=await fetch(origin+p,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});if(!r.ok)throw Error(p+' '+r.status+' '+await r.text());return r.json();}
const catalog=await api('/api/catalog'),results=[];
for(const robot of catalog.robots){
 const run=await api('/api/runs',{robotId:robot.id,centerId:'local-9048',mode:robot.id==='quality'?'sample':'planning',input:{title:'合成演示 · '+robot.name,description:'人工构造的业务场景，用于部署验收。没有真实业务数据或落地成效。',objective:'形成可复核的报告、方案或开发草案。',format:'CSV',audience:'数据中心管理员'},sample:robot.id==='quality'?'station,value,quality\nTEST_A,10,0\nTEST_B,,1\nTEST_A,10,0\n':''});
 let detail;for(let attempt=0;attempt<80;attempt++){detail=await api('/api/runs/'+run.id);if(!['queued','running'].includes(detail.status))break;await new Promise(r=>setTimeout(r,100));}
 if(detail.status!=='awaiting_review')throw Error(robot.id+': '+detail.status);
 for(let i=0;i<detail.artifacts.length;i++){const r=await fetch(origin+`/api/runs/${run.id}/artifacts/${i}`);if(!r.ok||!(await r.text()).length)throw Error('Download failed '+robot.id);}
 if(robot.id==='quality'){if(detail.report.sample.empty!==1||detail.report.sample.duplicateRows!==1)throw Error('Quality mismatch');detail=await api(`/api/runs/${run.id}/review`,{decision:'approve',reviewer:'部署验收（演示身份）',comment:'仅核对三行合成样本的缺失与重复计算，不代表真实业务或中心执行批准。'});}
 results.push({robot:robot.id,id:run.id,status:detail.status,artifacts:detail.artifacts.map(a=>a.name),quality:detail.report.sample,operations:robot.id==='operations'?JSON.parse(detail.artifacts[0].content).observation:undefined});
}
const evidence={checkedAt:new Date().toISOString(),synthetic:true,allRobots:results.length,results};
fs.writeFileSync('deployment-verification.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));
