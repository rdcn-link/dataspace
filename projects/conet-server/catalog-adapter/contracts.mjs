export const DATASET_FIELDS=['isAiExploration','titleZh','titleEn','cstr','doi','introductionZh','introductionEn','keywordsZh','keywordsEn','subject','topic','format','spatialRange','timeRange','dataCenterName','source','datasetId','dataSetId','sourceType','refreshRate','industryField','authors','shareMode','byteSize','fileNumber','url','project','access','version','publisher','createAt','publishAt','updateAt','seekCount','viewCount','downloadCount','favoriteCount','favoriteNum','followNum','visitNum'];
export function publicDataset(doc,{summary=false}={}){
 const value={id:String(doc._id??doc.id)};
 for(const key of DATASET_FIELDS)if(doc[key]!==undefined&&doc[key]!==null)value[key]=doc[key];
 if(value.url)value.url=safeURL(value.url);
 if(summary)for(const key of ['introductionZh','introductionEn'])if(typeof value[key]==='string')value[key]=value[key].slice(0,400);
 const count=v=>Number.isFinite(Number(v))&&Number(v)>=0?Math.floor(Number(v)):0;value.seekCount=count(doc.seekCount);value.viewCount=count(doc.viewCount??doc.visitNum);value.favoriteCount=count(doc.favoriteCount??doc.favoriteNum??doc.followNum);value.downloadCount=count(doc.downloadCount);
 value.capabilities={metadata:true,filesConnected:false,computeConnected:false};return value;
}
export function safeURL(value){try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:null}catch{return null}}
export function publicNews(doc,{summary=false}={}){const out={id:String(doc._id??doc.id)};for(const key of ['name','description','source','cstr','updateAt'])if(doc[key]!==undefined)out[key]=doc[key];out.url=safeURL(doc.url);out.coverURL=safeURL(doc.coverUrl);if(summary&&typeof out.description==='string')out.description=out.description.slice(0,600);return out;}
export function pageQuery(search){
 const integer=(key,fallback,max)=>{const raw=search.get(key);if(raw===null||raw==='')return fallback;if(!/^\d+$/.test(raw))throw Error('分页参数必须为正整数');const n=Number(raw);if(!Number.isSafeInteger(n)||n<1||n>max)throw Error('分页参数超出范围');return n;};
 const page=integer('page',1,1000000),pageSize=integer('pageSize',12,50);
 const text=key=>{const s=(search.get(key)||'').trim();if(s.length>150)throw Error('查询条件过长');return s;};
 const sort=search.get('sort')||'createAt';if(!['createAt','updateAt','publishAt','seekCount','viewCount','downloadCount'].includes(sort))throw Error('不支持的排序字段');
 return {page,pageSize,q:text('q'),source:text('source'),dataCenterName:text('center'),subject:text('subject'),shareMode:text('shareMode'),sort};
}
export const regexLiteral=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
