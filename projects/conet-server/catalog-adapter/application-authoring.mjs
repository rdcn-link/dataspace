import fs from 'node:fs/promises';
import {stringify} from 'yaml';
import {permissions,released,draftDefinition,portableDefinition,uniqueCopyId,exportPackage,importPackage} from './application-authoring-contracts.mjs';
const fail=(status,message)=>Object.assign(Error(message),{status});
export function createApplicationAuthoring({apps,tasks,putVersion,call,adapters,publicApplication,serialize,readMedia,writeMedia}){
 const login=actor=>{if(!actor)throw fail(401,'请登录后管理应用')};
 async function read(id,actor,admin){const a=await apps.findOne({_id:id,status:{$ne:'deleted'}});if(!a||!permissions(a,actor,admin).canView)throw fail(404,'应用不存在');return a}
 async function document(id,actor,admin){const a=await read(id,actor,admin);login(actor);let definition=a.definition,workflowEvidence={kind:'saved-definition'};
  if(a.origin==='designed'){
   let nativeJob;workflowEvidence={kind:'design-plan'};
   const adapter=adapters.get(id),names=(adapter?.artifacts||[]).filter(n=>['job.json','bound-job.json'].includes(n));
   if(adapter?.authoringTemplate){const template=await adapter.authoringTemplate();nativeJob=template.job;workflowEvidence=template.evidence||{kind:'adapter-template'}}
   const rows=await tasks.find({applicationId:id,state:'succeeded',approval:{$exists:false}}).sort({finishedAt:-1}).limit(3).toArray();
   if(!nativeJob)for(const t of rows){for(const name of names){try{const j=JSON.parse((await call(adapter,'GET','/runs/'+t.id+'/'+name)).buffer);if(Array.isArray(j.steps)){nativeJob=j;workflowEvidence={kind:'execution-workflow',taskId:t.id};break}}catch{}}if(nativeJob)break}
   if(!nativeJob)try{const j=JSON.parse(await fs.readFile('/mnt/data/conet/domain-validation/applications/'+id+'/native-job.json','utf8'));if(Array.isArray(j.steps)){nativeJob=j;workflowEvidence={kind:'platform-workflow'}}}catch{}
   definition=portableDefinition({...a.definition,sourceVersion:a.sourceVersion},nativeJob,workflowEvidence);
  }
  return {...definition,application:definition.application,revision:a.currentVersionId,status:a.status,permissions:permissions(a,actor,admin),can_edit:permissions(a,actor,admin).canEdit,registry:publicApplication(a),url:a.url,workflowEvidence,sourceReference:a.sourceReference||{applicationId:id,versionId:a.currentVersionId}};
 }
 async function save(body,actor,admin,sourceReference){login(actor);const d=draftDefinition(body),id=d.application.id;
  return serialize(id,async()=>{const a=await apps.findOne({_id:id});if(a){if(a.status==='deleted')throw fail(409,'标识已使用，请创建新应用');if(!permissions(a,actor,admin).canEdit)throw fail(403,released(a)?'已发布应用不能修改，请复制为新应用':'无权修改此草稿');if(body.revision!==a.currentVersionId)throw fail(409,'草稿已更新，请重新加载')}
   const versionId=await putVersion(id,d,'application-draft'),now=new Date().toISOString();const doc={title:d.application.title,description:d.application.description,category:'用户贡献',origin:'contributed',status:'draft',sortOrder:a?.sortOrder??100000,definition:d,currentVersionId:versionId,versionNumber:(a?.versionNumber||0)+(a?.currentVersionId===versionId?0:1),verified:false,executable:false,materializationState:'draft',coverURL:d.application.presentation?.cover||'/assets/app-cover.svg',url:'/apps/'+id+'/',updatedAt:now,...(sourceReference?{sourceReference}: {})};
   if(a){const r=await apps.updateOne({_id:id,status:'draft',currentVersionId:body.revision,publishingToken:{$exists:false}},{$set:doc});if(!r.matchedCount)throw fail(409,'草稿已更新或正在发布，请刷新')}else try{await apps.insertOne({_id:id,...doc,createdBy:actor,ownerKind:'user',createdAt:now})}catch(e){if(e.code===11000)throw fail(409,'应用标识已被占用');throw e}
   return document(id,actor,admin)
  })
 }
 async function copy(id,actor,admin){login(actor);const source=await document(id,actor,admin),application=structuredClone(source.application);application.id=uniqueCopyId(id);application.title=application.title.slice(0,150)+'（副本）';application.data={...application.data,scope:''};delete application.publication;return save({application_yaml:stringify(application),job_yaml:source.job_yaml},actor,admin,{applicationId:id,versionId:source.revision})}
 async function handle(p,req,res,actor,admin,readBody,send){
  if(p==='/application-drafts'&&req.method==='POST'){send(201,await save(await readBody(req),actor,admin));return true}
  if(p==='/application-packages/import'&&req.method==='POST'){login(actor);let size=0;const chunks=[];for await(const c of req){size+=c.length;if(size>4194304)throw fail(413,'程序包超过4MiB');chunks.push(c)}const d=importPackage(Buffer.concat(chunks));d.application.id=uniqueCopyId(d.application.id);delete d.application.publication;for(const [key,buffer]of Object.entries(d.media))d.application.presentation[key]=(await writeMedia(buffer)).url;send(201,await save({application_yaml:stringify(d.application),job_yaml:d.job_yaml},actor,admin));return true}
  const m=p.match(/^\/applications\/([a-z][a-z0-9-]{0,63})\/(authoring|copy|package)$/);if(!m)return false;const [,id,action]=m;
  if(action==='authoring'&&req.method==='GET')send(200,await document(id,actor,admin));
  else if(action==='copy'&&req.method==='POST'){const b=await readBody(req);if(Object.keys(b).length)throw fail(400,'复制不接受覆盖参数');send(201,await copy(id,actor,admin))}
  else if(action==='package'&&req.method==='GET'){const doc=await document(id,actor,admin),media={};for(const key of ['cover','background']){const url=doc.application.presentation?.[key];if(/^\/appbuilder\/media\/[a-f0-9]{64}\.(png|jpg)$/.test(url||''))media[key]={buffer:await readMedia(url),extension:url.split('.').pop()}}const buffer=exportPackage(doc,media);res.setHeader('Content-Type','application/zip');res.setHeader('Content-Disposition','attachment; filename="'+id+'.conetapp.zip"');res.setHeader('Cache-Control','no-store');res.end(buffer)}else throw fail(405,'不支持此操作');return true
 }
 return {handle,document,save,read};
}
