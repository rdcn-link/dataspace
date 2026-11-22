import {adapters} from './npp-spec.mjs';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const config='/mnt/data/conet/conet-server/.state/network/connection.json';
export function profile(row,connections){
 const c=row.metadata?.serviceContracts?.['npp-annual/v1'];if(!c)return null;
 const reasons=[];const files=c.files&&typeof c.files==='object'&&!Array.isArray(c.files)?c.files:{};const years=Object.keys(files).map(Number).sort((a,b)=>a-b);
 if(c.variable!=='NPP'||c.format!=='GeoTIFF'||c.crs!=='EPSG:4326'||c.unit!=='gC/m2/year')reasons.push('变量、格式、投影或单位不符合服务输入契约');
 if(!['real','synthetic'].includes(c.dataKind)||row.metadata.synthetic!==(c.dataKind==='synthetic'))reasons.push('实体/合成属性未明确或不一致');
 if(['datasetId','version','unitEvidence'].some(k=>typeof c[k]!=='string'||!c[k].trim()||c[k].length>2000))reasons.push('缺少数据标识、版本或单位依据');
 if(years.length<2||years.length>201||years.some(y=>!Number.isInteger(y)||y<1900||y>2100||!Object.hasOwn(files,String(y))))reasons.push('年度文件清单无效');
 if(Object.values(files).some(f=>typeof f!=='string'||!f||f.startsWith('/')||f.includes('\\')||f.split('/').includes('..')||!(/\.tiff?$/i.test(f))))reasons.push('仅接受数据集内部的GeoTIFF相对路径');
 if(new Set(Object.values(files)).size!==years.length)reasons.push('不同年份不能绑定同一个文件路径');
 if(typeof row.dacp_uri!=='string'||row.dacp_uri!==connections.union_url?.replace(/\/$/,'')+'/'+row.id)reasons.push('数据集不是当前Union的公开命名空间绑定');
 const nodeAddress=connections.node_urls?.[row.node_id];if(!nodeAddress)reasons.push('所属节点尚未配置连接');
 const b={key:row.node_id+':'+row.id,nodeId:row.node_id,nodeTitle:row.node_title||row.node_id,nodeAddress,publicId:row.id,datasetId:c.datasetId,title:c.title||row.title,version:c.version,unit:c.unit,unitEvidence:c.unitEvidence,format:c.format,crs:c.crs,synthetic:c.dataKind==='synthetic',uri:row.dacp_uri,years,files};
 const fingerprint=[b.nodeId,b.nodeAddress,b.publicId,b.datasetId,b.version,b.unit,b.format,b.crs,Object.entries(files).sort((a,b)=>a[0].localeCompare(b[0])),b.synthetic,c.variable,b.unitEvidence];b.contractHash=createHash('sha256').update(JSON.stringify(fingerprint)).digest('hex');
 return {...b,eligible:reasons.length===0,reasons};
}
export async function discover(includeSynthetic=false){
 const connections=JSON.parse(await fs.readFile(config,'utf8'));const response=await fetch('http://127.0.0.1:8870/api/catalog',{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('节点目录暂不可用');const catalog=await response.json();
 let overview;try{const r=await fetch('http://127.0.0.1:19880/api/overview',{signal:AbortSignal.timeout(10000)});overview=await r.json()}catch{}
 const rows=[];for(const adapter of await adapters()){if(!includeSynthetic&&adapter.dataKind==='synthetic')continue;const row=catalog.datasets.find(r=>r.node_id===adapter.nodeId&&r.metadata?.datasetId===adapter.datasetId);if(!row){rows.push({key:'unconnected:'+adapter.id,nodeId:adapter.nodeId,title:adapter.title,datasetId:adapter.datasetId,synthetic:adapter.dataKind==='synthetic',eligible:false,reasons:['只有适配配置，实体资源尚未接入当前节点'],years:Object.keys(adapter.files).map(Number),adapter});continue}const virtual={...row,metadata:{...row.metadata,serviceContracts:{'npp-annual/v1':adapter}}};const source=profile(virtual,connections);source.adapter=adapter;source.adapterHash=createHash('sha256').update(JSON.stringify(adapter)).digest('hex');source.contractHash=createHash('sha256').update(source.contractHash+source.adapterHash).digest('hex');source.declaredMapping={variable:adapter.variable,band:adapter.band,timeScale:adapter.timeScale,format:adapter.format,crs:adapter.crs,unit:adapter.unit,scale:adapter.scale,offset:adapter.offset,nodataRule:adapter.nodataRule,unitConversion:adapter.unitConversion};if(adapter.timeScale!=='annual'||adapter.band!==1||adapter.scale!==1||adapter.offset!==0||adapter.unitConversion!=='identity'||adapter.nodataRule!=='gdal-mask+finite+nonnegative'){source.eligible=false;source.reasons.push('适配配置的时间尺度、变量或转换规则尚未支持')}rows.push(source)}
 for(const s of rows){const member=overview?.members?.find(m=>m.url?.replace(/\/$/,'')===s.nodeAddress?.replace(/\/$/,''));const capacity=Math.min(member?.status?.capacity||0,member?.grant?.max_concurrent_tasks||0);s.maxYears=Math.max(0,Math.min(24,Math.floor((capacity-2)/2)));if(s.maxYears<2){s.eligible=false;s.reasons.push('节点当前未具备本服务所需的计算容量')} }
 const nodes=Object.keys(connections.node_urls||{}).map(id=>({id,title:catalog.datasets.find(r=>r.node_id===id)?.node_title||id,available:rows.filter(r=>r.nodeId===id&&r.eligible).length}));
 return {complete:catalog.complete,contract:'npp-annual/v1',rows,nodes};
}
export async function resolveSource(key){const data=await discover(true);const source=data.rows.find(s=>s.key===key);if(!source)throw Error('所选数据集已不在节点目录中，请重新选择');if(!source.eligible)throw Error(source.reasons.join('；'));return source;}
export function selectYears(source,start,end){if(start<source.years[0]||end>source.years.at(-1))throw Error('分析年份超出数据集范围');const years=[];for(let y=start;y<=end;y++){if(!source.files[String(y)])throw Error('数据集缺少'+y+'年文件');years.push(y)}if(source.maxYears&&years.length>source.maxYears)throw Error('该节点当前最多支持'+source.maxYears+'个年份');if(years.length<2||years.length>24)throw Error('每次请选择2至24个连续年份');return years;}

export async function resources(q='NPP'){if(typeof q!=='string'||q.length>100)throw Error('查询条件过长');const sources=await discover(true);const r=await fetch('http://127.0.0.1:8871/api/metadata/datasets?q='+encodeURIComponent(q)+'&pageSize=50',{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('空间目录查询暂不可用');const metadata=await r.json();return {sources:sources.rows,nodes:sources.nodes,metadataTotal:metadata.total,metadataRows:metadata.rows.map(d=>{const linked=sources.rows.find(s=>s.datasetId===d.datasetId&&s.eligible);return {id:d.id,datasetId:d.datasetId,title:d.titleZh||d.titleEn,connected:!!linked,sourceKey:linked?.key||null,reason:linked?'已接入兼容数据源，运行前仍需授权和输入检查':'只有目录元数据或尚未完成兼容接入，不能直接运行'}}),metadataPageSize:50}}
