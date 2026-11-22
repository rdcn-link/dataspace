import {robots,FAIR_REFERENCE} from './catalog.mjs';
export const fieldNames={title:'数据名称',description:'数据描述',identifier:'持久标识符',source:'登记来源',owner:'权利主体',license:'使用许可',access:'访问与授权说明',format:'数据格式',provenance:'来源与处理过程',standard:'领域标准',vocabulary:'共享词表',objective:'业务目标',audience:'目标用户'};
const check=(id,label,present,detail)=>({id,label,status:present?'declared':'pending',evidence:present?String(detail):'未提供材料',recommendation:present?'材料已声明，真实性与适用性仍需复核。':'请补充材料并完成验证。'});
export function parseCSV(text){
 if(!text.trim())return null;
 const rows=[];let row=[],value='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else if(!quoted&&value==='')quoted=true;else if(quoted)quoted=false;else throw Error('CSV 引号位置不正确');}else if(c===','&&!quoted){row.push(value);value='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);if(row.some(x=>x!==''))rows.push(row);row=[];value='';}else value+=c;}
 if(quoted)throw Error('CSV 引号未闭合');if(value!==''||row.length){row.push(value);rows.push(row);}if(rows.length<2)throw Error('CSV 至少需要表头和一行记录');
 const header=rows.shift().map(x=>x.trim()),cells=rows.reduce((n,r)=>n+r.length,0),empty=rows.reduce((n,r)=>n+r.filter(x=>!x.trim()).length,0);
 return {header,rows:rows.length,cells,empty,missingRatio:cells?empty/cells:0,duplicateRows:rows.length-new Set(rows.map(r=>JSON.stringify(r))).size,inconsistentRows:rows.filter(r=>r.length!==header.length).length,duplicateHeaders:header.length-new Set(header).size};
}
export function validateInput(body){
 if(!body||typeof body!=='object'||Array.isArray(body))throw Error('任务输入格式不正确');
 if(!robots.some(x=>x.id===body.robotId))throw Error('请选择有效机器人');
 const input={};for(const key of Object.keys(fieldNames)){const value=body.input?.[key]??'';if(typeof value!=='string'||value.length>6000)throw Error('输入字段过长或格式不正确');input[key]=value.trim();}
 if(!input.title)throw Error('请填写任务对象名称');
 const sample=body.sample??'';if(typeof sample!=='string'||sample.length>150000)throw Error('CSV 样本最多 150 KB');parseCSV(sample);
 if(!['planning','sample'].includes(body.mode))throw Error('请选择业务设计或样本验证模式');if(body.mode==='sample'&&!sample.trim())throw Error('样本验证模式需要 CSV 样本');
 return {robotId:body.robotId,input,sample,mode:body.mode};
}
export async function execute(run){
 const robot=robots.find(x=>x.id===run.robotId),m=run.input,sample=run.mode==='sample'?parseCSV(run.sample):null;
 const needed={metadata:['title','description','identifier','owner','license','format'],classification:['title','description','access'],rights:['source','owner','license','access','provenance'],onboarding:['title','description','format','access','owner'],service:['title','objective','format','access','owner'],product:['title','objective','audience','owner','license','provenance'],matching:['objective','description','format','access'],processing:['objective','format','description','standard'],provenance:['identifier','source','owner','provenance','license'],operations:['title','objective']};
 let checks=(needed[robot.id]||['title','description','format']).map(k=>check(k,fieldNames[k],!!m[k],m[k]));
 const artifacts=[];let observations=[],summary='已生成业务草案与待验证事项。';
 const add=(name,content,type='application/json')=>artifacts.push({name,type,content:type==='application/json'?JSON.stringify(content,null,2):content});
 const task={object:m.title,center:run.centerName,objective:m.objective||'待确认',status:'draft',evidence:sample?'user_supplied_sample':'declarations_only',generatedAt:new Date().toISOString()};
 if(robot.id==='quality'){
  checks=['title','description','format','source','owner'].map(k=>check(k,fieldNames[k],!!m[k],m[k]));
  if(sample){observations=[`样本记录 ${sample.rows} 行，字段 ${sample.header.length} 个。`,`空单元格 ${sample.empty} 个，占 ${Math.round(sample.missingRatio*10000)/100}%；完全重复记录 ${sample.duplicateRows} 行。`,`列数不一致 ${sample.inconsistentRows} 行；重复表头 ${sample.duplicateHeaders} 个。`];summary='已完成所提供 CSV 样本的结构、缺失与重复检查。';add('sample-quality.json',{...task,...sample,scope:'sample_only',accuracy:'not_verified'});}else observations=['未提供样本，未计算缺失率、重复率或质量得分。'];
  add('remediation-plan.json',{...task,actions:['核实字段类型、单位与有效范围','补充全量读取与异常规则','由领域专家核验科学准确性'],sampleIssues:sample});
 }else if(robot.id==='fair'){
  checks=[check('F1','F1 持久标识符声明',!!m.identifier,m.identifier),check('F2','F2 丰富元数据声明',!!m.title&&!!m.description,m.description),check('F3','F3 标识符关联',!!m.identifier,m.identifier),check('F4','F4 可搜索索引证据',false),check('A1','A1 标识符检索协议说明',!!m.access,m.access),check('A1.1','A1.1 开放协议证据',false),check('A1.2','A1.2 认证授权说明',!!m.access,m.access),check('A2','A2 元数据长期保存证据',false),check('I1','I1 形式化知识表示证据',false),check('I2','I2 共享词表声明',!!m.vocabulary,m.vocabulary),check('I3','I3 关联资源限定关系证据',false),check('R1','R1 复用描述',!!m.description,m.description),check('R1.1','R1.1 使用许可声明',!!m.license,m.license),check('R1.2','R1.2 溯源声明',!!m.provenance,m.provenance),check('R1.3','R1.3 领域标准声明',!!m.standard,m.standard)];
  observations=['本地证据自查，未进行标识符解析、联网检索、授权访问或标准符合性验证；不出具 FAIR 认证分数。'];add('fair-evidence.json',{...task,reference:FAIR_REFERENCE,checks});
 }else if(robot.id==='metadata')add('metadata-draft.json',{'@context':'https://schema.org','@type':'Dataset',name:m.title,description:m.description||null,identifier:m.identifier||null,creator:m.owner||null,license:m.license||null,encodingFormat:m.format||null,provenance:m.provenance||null,_status:'draft_unverified'});
 else if(robot.id==='classification'){
  const text=[m.description,...(sample?.header||[])].join(' ');const hits=['身份证','手机','电话','姓名','住址','经纬度','病历','基因','email','phone','latitude','longitude','patient','id_card'].filter(w=>text.toLowerCase().includes(w));
  observations=hits.length?[`发现需要人工复核的关键词：${hits.join('、')}。`]:['当前描述和表头未命中内置关键词；不能据此认定不含敏感信息。'];add('access-control-review.json',{...task,keywordSignals:hits,classification:'pending_human_review',controls:['核实数据内容与适用制度','确认最小必要访问范围','定义允许返回的字段和聚合粒度','审批后配置 DACP 发布策略']});
 }else if(robot.id==='rights')add('authorization-draft.json',{...task,registeredSource:m.source||null,rightsHolder:m.owner||null,license:m.license||null,approval:'pending',productRights:'待各参与中心协商',questions:['授权是否覆盖计算与衍生成果？','能否再分发输入或中间结果？','成果署名、归属与收益如何约定？']});
 else if(robot.id==='onboarding')add('dacp-config-draft.json',{status:'draft_do_not_deploy',datasets:{'replace-with-dataset-id':{provider:'directory',source:{root:'/REPLACE/WITH/APPROVED/PATH'},description:JSON.stringify({title:m.title,description:m.description,publication:{policy:'private'}})}},validation:['管理员确认路径与发布范围','安装匹配格式的 provider / parser','验证目录、Item、视图和内容读取','验证本地 Job 后再考虑加入 Union']});
 else if(robot.id==='service'){
  add('service-contract.json',{...task,version:'0.1-draft',parameters:[{name:'input_dataset',required:true,type:'string'},{name:'scope',required:true,type:'object'}],outputs:[{name:'result',format:m.format||'待确认',description:m.objective||'待确认'}],execution:{engine:'DACP / XStream',approval:'all_participating_centers',operators:'pending_repository_verification'},acceptance:['输入边界与异常用例','算子版本和依赖校验','独立节点真实输入执行','跨节点汇聚正确性','结果页面与下载验证']});
  add('job-design.json',{...task,executable:false,steps:[{id:'read',purpose:'读取审批范围内的输入',operator:'待在仓库确认读取算子版本'},{id:'process',purpose:m.objective||'按业务需求处理',operator:'待选择并验证领域算子',inputs:['read']},{id:'validate',purpose:'校验结果与误差',operator:'待选择校验算子',inputs:['process']},{id:'deliver',purpose:'返回经批准的结果',inputs:['validate']}],reason:'这是开发设计契约，不能直接作为可运行 Job 提交。'});
 }else if(robot.id==='product')add('product-specification.json',{...task,audience:m.audience||'待确认',valueProposition:m.objective||'待确认',package:['数据或结果文件','元数据与数据字典','质量及 FAIR 证据','使用许可和引用方式','版本、溯源与变更记录'],releaseGates:['数据授权核实','真实输入与结果验证','质量复核','成果权益约定','产品责任人审核'],commercial:{pricing:'待确定',revenue:null,actualUsage:null},publication:'not_published'});
 else if(robot.id==='matching')add('resource-requirements.json',{...task,criteria:['主题与变量','空间范围和分辨率','时间范围和频率','格式与可用视图','许可及实际访问条件'],catalogQueried:false,candidates:[],nextAction:'接入真实目录后检索并逐项核实适用性'});
 else if(robot.id==='processing')add('processing-plan.json',{...task,stages:['读取与结构校验','单位和缺失值规范化','按目标筛选或聚合','输出结构与业务校验','登记版本与溯源'],rollback:'保留输入版本，输出到独立位置，经复核后替换',executed:false});
 else if(robot.id==='provenance')add('provenance-draft.json',{...task,source:{identifier:m.identifier||null,registeredSource:m.source||null,rightsHolder:m.owner||null},activity:{description:m.provenance||null,executionId:null,operatorVersions:[],verified:false},result:{identifier:null,rights:'待确认',published:false}});
 else if(robot.id==='operations'){
  let observation;try{const start=Date.now();const response=await fetch('http://10.0.90.48:19881/',{signal:AbortSignal.timeout(4000)});observation={endpoint:'http://10.0.90.48:19881/',httpStatus:response.status,responseMs:Date.now()-start,observedAt:new Date().toISOString(),healthy:response.ok};}catch(e){observation={endpoint:'http://10.0.90.48:19881/',healthy:false,error:'端点未响应或连接失败',observedAt:new Date().toISOString()};}
  observations=[`本机 DACP 看板：${observation.healthy?'HTTP 响应正常':'未获得正常响应'}。`];add('node-inspection.json',{...task,observation,dataReadTested:false,operatorExecutionTested:false,scope:'fixed_local_endpoint_only'});summary='已执行本机固定端点巡检，并生成报告。';
 }
 const pending=checks.filter(x=>x.status==='pending');
 const report={robot:robot.name,summary,scope:run.mode==='sample'?'用户提供的样本及声明材料':'业务设计与声明材料',boundary:robot.boundary,observations,checks,counts:{declared:checks.length-pending.length,pending:pending.length,verified:0},sample,reviewItems:[...pending.map(x=>x.label),...robot.deliverables.map(x=>`${x}需责任人复核`)],nextActions:robot.steps.map((s,i)=>({step:i+1,title:s,status:i===robot.steps.length-1?'ready_for_review':'draft_generated'}))};
 add('report.md',`# ${robot.name} · ${m.title}\n\n${summary}\n\n范围：${report.scope}\n\n说明：${robot.boundary}\n\n## 观测\n${observations.map(x=>'- '+x).join('\n')||'- 无实体数据观测。'}\n\n## 证据清单\n${checks.map(x=>`- ${x.label}：${x.status==='declared'?'已声明，待核实':'待补证据'}；${x.evidence}`).join('\n')}\n\n## 复核事项\n${report.reviewItems.map(x=>'- '+x).join('\n')}\n\n生成时间：${task.generatedAt}\n任务：${run.id}\n`, 'text/markdown');
 return {report,artifacts};
}
