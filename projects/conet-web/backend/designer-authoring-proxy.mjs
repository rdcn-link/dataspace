// A restricted authoring surface for the existing XStream Designer. No data
// inference, preview or execution requests are forwarded through this surface.
const fail=(status,message)=>Object.assign(Error(message),{status});
export async function proxyAuthoringDesigner(req,res,backend,designerBackendURL){
 const u=new URL(req.url,'http://localhost'),p=u.pathname.slice('/api/appbuilder/designer'.length)||'/';
 const api=new Set(['/api/config','/api/operators','/api/examples','/api/views','/api/catalogs','/api/datasets','/api/document','/api/mapping','/api/export']);
 if(p.startsWith('/api/')&&!api.has(p))throw fail(403,'流程编辑不读取实体数据或执行计算，请返回应用提交分析');
 if(!p.startsWith('/api/')&&!(p==='/'||/^\/[a-zA-Z0-9_.-]+\.(?:js|css|svg)$/.test(p)))throw fail(404,'设计器资源不存在');
 if(!['GET','POST'].includes(req.method)||(req.method==='POST'&&!api.has(p)))throw fail(405,'设计器操作无效');
 const settings=await fetch(new URL('/api/appbuilder/settings',backend),{signal:AbortSignal.timeout(10000)}).then(async r=>{if(!r.ok)throw fail(503,'无法读取设计器配置');return r.json()});
 if(!designerBackendURL&&!settings.designer_url)throw fail(503,'尚未配置XStream设计器');const upstream=new URL(designerBackendURL||settings.designer_url);if(!['http:','https:'].includes(upstream.protocol)||upstream.username||upstream.password)throw fail(503,'设计器配置无效');
 let body;if(req.method==='POST'){let size=0;const chunks=[];for await(const c of req){size+=c.length;if(size>1048576)throw fail(413,'流程定义过大');chunks.push(c)}body=Buffer.concat(chunks)}
 const target=new URL(upstream.href.replace(/\/$/,'')+p+u.search);const response=await fetch(target,{method:req.method,headers:body?{'Content-Type':'application/json'}:{},body,signal:AbortSignal.timeout(45000)});
 let bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>8388608)throw fail(502,'设计器响应过大');
 if(response.ok&&p==='/app.js'){let source=bytes.toString();const marker='function scheduleInference(){';if(!source.includes(marker))throw fail(503,'设计器版本需重新验证后启用');source=source.replace(marker,marker+"inferenceState='Authoring only · no data access';return;");bytes=Buffer.from(source)}
 if(response.ok&&p==='/api/config'){const c=JSON.parse(bytes);c.chat_provider='disabled';delete c.showcase;bytes=Buffer.from(JSON.stringify(c))}
 res.writeHead(response.status,{'Content-Type':response.headers.get('content-type')||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(bytes);
}
