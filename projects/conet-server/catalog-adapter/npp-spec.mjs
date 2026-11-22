import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const url=name=>fileURLToPath(new URL('./'+name,import.meta.url));
export async function template(){return JSON.parse(await fs.readFile(url('npp-template.json'),'utf8'))}
export async function adapters(){return JSON.parse(await fs.readFile(url('npp-adapters.json'),'utf8')).adapters}
export function validateParameters(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['name','yearStart','yearEnd','sourceKey','sourceContractHash','allowSynthetic','methods','region','inspectionId','mappingConfirmed','fromCaseId'].includes(k)))throw Error('存在未支持的分析参数');
 const {yearStart:start,yearEnd:end}=input;if(!Number.isInteger(start)||!Number.isInteger(end)||start<1900||end>2100||end<=start||end-start>=24)throw Error('请选择1900—2100年内2至24个连续年份');
 const name=input.name??`${start}—${end}年NPP分析`;if(typeof name!=='string'||!name.trim()||name.length>120)throw Error('分析名称需为1至120字');
 const methods=input.methods;if(!Array.isArray(methods)||!methods.includes('annual-statistics')||new Set(methods).size!==methods.length||methods.some(m=>!['annual-statistics','interannual-change','linear-trend'].includes(m)))throw Error('必须选择年度统计，且只能选择已验证实现的方法');if(methods.includes('linear-trend')&&end-start<2)throw Error('描述性线性趋势至少需要3个年份');
 const region=input.region??{mode:'full'};if(!region||typeof region!=='object'||Array.isArray(region))throw Error('分析区域无效');if(region.mode==='full'){if(Object.keys(region).some(k=>k!=='mode'))throw Error('完整范围不接受额外区域参数')}else if(region.mode==='bbox'){const b=region.bbox;if(Object.keys(region).some(k=>!['mode','bbox'].includes(k))||!Array.isArray(b)||b.length!==4||b.some(v=>typeof v!=='number'||!Number.isFinite(v))||b[0]<-180||b[2]>180||b[1]<-90||b[3]>90||b[0]>=b[2]||b[1]>=b[3])throw Error('矩形区域须为有效的[西、南、东、北]经纬度，不支持跨日期线')}else throw Error('目前仅支持完整范围或经纬度矩形区域');
 if(typeof input.sourceKey!=='string'||!input.sourceKey||input.sourceKey.length>160||!(/^[a-f0-9]{64}$/).test(input.sourceContractHash||''))throw Error('请选择当前已接入的兼容数据集及版本');
 if(input.allowSynthetic!==undefined&&typeof input.allowSynthetic!=='boolean')throw Error('合成验证标记无效');if(input.mappingConfirmed!==undefined&&typeof input.mappingConfirmed!=='boolean')throw Error('映射确认参数无效');
 for(const k of ['inspectionId','fromCaseId'])if(input[k]!==undefined&&!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(input[k]))throw Error('记录编号无效');
 return {name:name.trim(),yearStart:start,yearEnd:end,sourceKey:input.sourceKey,sourceContractHash:input.sourceContractHash,methods:[...methods],region:structuredClone(region),...(input.allowSynthetic?{allowSynthetic:true}:{}),...(input.inspectionId?{inspectionId:input.inspectionId}:{}),mappingConfirmed:input.mappingConfirmed===true,...(input.fromCaseId?{fromCaseId:input.fromCaseId}:{})};
}
