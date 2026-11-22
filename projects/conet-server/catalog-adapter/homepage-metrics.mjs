import {synthetic} from './platform-contracts.mjs';
export const publishedTaskProductFilter={state:'succeeded','publication.published':true,'publication.consentedBy':{$type:'string',$ne:''},synthetic:{$ne:true},superseded:{$ne:true}};
export function publishedProductCount(tasks,products,now=Date.now()){
 if(!Array.isArray(products))throw Error('Published product registry unavailable');const identities=new Set(),coveredTasks=new Set();
 for(const p of products){if(synthetic(p)||p.revoked===true||p.published===false||!p.published_at)continue;if(p.expires_at&&(!Number.isFinite(Date.parse(p.expires_at))||Date.parse(p.expires_at)<=now))continue;const key=typeof p.dataset_id==='string'&&p.dataset_id?'dataset:'+p.dataset_id:typeof p.dataset_uri==='string'&&p.dataset_uri?'uri:'+p.dataset_uri:typeof p.product_id==='string'&&p.product_id?'product:'+p.product_id:null;if(!key)continue;identities.add(key);if(p.application?.id&&p.run_id)coveredTasks.add(p.application.id+':'+p.run_id)}
 for(const t of tasks){if(t.state!=='succeeded'||t.publication?.published!==true||synthetic(t)||t.superseded===true)continue;if(t.publication.expiresAt&&(!Number.isFinite(Date.parse(t.publication.expiresAt))||Date.parse(t.publication.expiresAt)<=now))continue;const key=t.applicationId+':'+t.id;if(!coveredTasks.has(key))identities.add('task:'+key)}return identities.size
}
export async function homepageMetrics({metadataDB,registryDB,readProducts}){
 const [onlineNodes,original,tasks,products,availableApplications,analysisRuns]=await Promise.all([
  metadataDB.collection('tds-datacenter').countDocuments({isAccess:1}),metadataDB.collection('tds-dataset').countDocuments({status:9}),
  registryDB.collection('tasks').find(publishedTaskProductFilter,{projection:{applicationId:1,id:1,state:1,publication:1,synthetic:1,superseded:1}}).toArray(),readProducts(),
  registryDB.collection('applications').countDocuments({verified:true,status:'online'}),registryDB.collection('tasks').countDocuments({raw:{$exists:true},synthetic:{$ne:true}})
 ]);const publishedAnalysisProducts=publishedProductCount(tasks,products);return {onlineNodes,publishedOriginalDatasets:original,publishedAnalysisProducts,publishedDatasets:original+publishedAnalysisProducts,availableApplications,analysisRuns,updatedAt:new Date().toISOString()}
}
