import fs from 'node:fs/promises';import {createHash} from 'node:crypto';
export async function createMongoRobotStore({uri,driver,legacyFile,collectionPrefix=''}){
 const {MongoClient}=await import(driver);const client=new MongoClient(uri,{maxPoolSize:3});await client.connect();const db=client.db('conet'),runs=db.collection(collectionPrefix+'robot_runs'),centers=db.collection(collectionPrefix+'robot_centers');await runs.createIndex({createdBy:1,createdAt:-1});
 // A single marker makes the one-time import retryable without replacing existing Mongo records.
 const settings=db.collection(collectionPrefix+'robot_settings'),marker=await settings.findOne({_id:'file-import-v1'});
 if(!marker){let legacy;try{legacy=JSON.parse(await fs.readFile(legacyFile,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}if(legacy){for(const r of legacy.runs||[])await runs.updateOne({_id:r.id},{$setOnInsert:r},{upsert:true});for(const c of legacy.centers||[])await centers.updateOne({_id:c.id},{$setOnInsert:c},{upsert:true})}await settings.updateOne({_id:'file-import-v1'},{$setOnInsert:{importedAt:new Date().toISOString(),source:'existing robot workbench'}},{upsert:true})}
 const clean=rows=>rows.map(({_id,...r})=>r),initial={runs:clean(await runs.find().sort({createdAt:1}).toArray()),centers:clean(await centers.find().toArray())};if(!initial.centers.length)initial.centers=[{id:'local-9048',name:'90.48 本地中心',kind:'local',status:'deployed',note:'当前工作台执行中心'}];
 const hashes=new Map();let queue=Promise.resolve();
 function save(state){const snapshot=structuredClone(state);const next=queue.then(async()=>{for(const [kind,items,collection]of [['run',snapshot.runs,runs],['center',snapshot.centers,centers]])for(const item of items){const hash=createHash('sha256').update(JSON.stringify(item)).digest('hex'),key=kind+':'+item.id;if(hashes.get(key)===hash)continue;await collection.replaceOne({_id:item.id},{_id:item.id,...item},{upsert:true});hashes.set(key,hash)}});queue=next.catch(()=>{});return next}
 return {initial,save,async close(){await queue;await client.close()}};
}
