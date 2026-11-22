export const runLabel='运行火点时段完整合成验证';
let ui;
export function renderResult(box,run){
 const {$,make,panel,link,jsonDetails}=ui,r=run.report,p=panel('森林火点时段统计 · 合成数据');
 p.id='fire-result';$('fire-main').querySelector('#fire-result')?.remove();
 p.append(make('p',r.validRows+' 条通过筛选的探测记录 · '+r.nodes.length+' 个独立模拟节点'),make('p','输入 '+r.inputRows+' 条；条件筛除 '+r.filteredRows+' 条；异常剔除 '+r.excludedRows+' 条。'),make('p','时间窗口：'+r.scope.start+' 至 '+r.scope.end+'（不含结束时刻）'),make('p','分箱：'+r.scope.period+' · UTC+08:00；置信度 ≥ '+r.scope.minConfidence));
 const scroll=make('div');scroll.style.overflowX='auto';const table=make('table',null,'param-table');table.id='fire-table';const head=make('tr');for(const h of ['北京时间段','记录来源','探测记录数'])head.append(make('th',h));table.append(head);
 for(const g of r.groups){const tr=make('tr');tr.append(make('td',g.period),make('td',({human:'人工记录',modis:'MODIS遥感',all:'合并记录'}[g.source]||g.source)),make('td',String(g.count)));table.append(tr)}scroll.append(table);p.append(scroll);
 const root='/api/metadata/simulation-runs/'+run.id+'/',image=make('img');image.src=root+'comparison.png';image.alt='合成火点探测记录时序图';image.style.width='100%';p.append(image,link('下载统计CSV',root+'comparison.csv','svc-button'),link('下载完整成果ZIP',root+'result.zip','svc-button'),make('p','零值仅表示该筛选输入没有探测记录，不证明该时段没有火灾。重复卫星过境观测不能直接合并为独立火灾事件。','muted'));
 p.append(make('p','季节按气象季节划分：3–5月春、6–8月夏、9–11月秋；冬季由前一年12月和当年1–2月组成。来源分类为人工human与遥感modis；不同记录不推定为不同物理火灾。','muted'));jsonDetails(p,'节点、参数与运行溯源',r);$('fire-main').prepend(p);
}
export async function loadDetail(s,host,context){
 ui=context;const {$,make,api,link,panel,list,jsonDetails,formFor,renderJob}=ui;
 host.querySelector('.design-notice').textContent='合成数据应用验证 · 独立DACP节点与真实Union调度。真实森林火点附件、跨机构部署与正式授权尚未验收。';
 const layout=make('div',null,'detail-layout'),main=make('div'),side=make('aside');main.id='fire-main';main.style.minWidth='0';side.style.minWidth='0';layout.append(main,side);host.append(layout);
 const intro=panel('按时段比较人工与MODIS记录');intro.append(make('p','各节点本地解析带时区时间、校验坐标和置信度，执行画像、筛选分组统计与绘图。选中节点通过Union汇聚摘要。'));list(intro,['支持小时、日、月、季节、年份；统一为UTC+08:00，时间窗口左闭右开','以探测记录ID分片；跨节点重复ID、缺失分片或参数不一致时拒绝汇聚','支持置信度与经纬度框筛选、异常剔除计数、零值时间箱','当前只统计合成探测记录，不推算独立火灾次数、火灾面积或风险预报']);main.append(intro);
 const data=panel('输入数据与适用范围');data.append(make('p','实际输入：各模拟节点独立的hotspots.csv。必填来源human/modis与带时区时间，置信度为已声明的0到100数值尺度。实际人工记录与MODIS质量标志需先确认映射。bbox仅为示例筛选框，不代表大兴安岭行政或森林边界。'));for(const d of s.datasets)data.append(link('真实数据元数据参考：'+d.title,d.metadataURL));data.append(make('p','默认剔除异常并记录数量；可将invalidPolicy改为reject。正式运行前各参与中心须审批并约定成果权益。','muted'));jsonDetails(data,'默认分析范围',Object.fromEntries(s.parameters.map(p=>[p.key,p.default])));main.append(data);side.append(formFor(s));
 const q=new URLSearchParams(location.search),draft=q.get('draft');if(!draft)return;
 try{const job=await api('/api/metadata/service-jobs/'+encodeURIComponent(draft));if(job.service.id!==s.id)throw Error('草稿与应用不匹配');renderJob(job);const id=q.get('run');if(!id)return;let r=await api('/api/metadata/simulation-runs/'+encodeURIComponent(id));if(r.jobId!==job.id)throw Error('运行与草稿不匹配');const status=make('p','恢复运行状态…');$('job-result').append(status);while(['queued','running'].includes(r.state)){await new Promise(resolve=>setTimeout(resolve,1500));r=await api('/api/metadata/simulation-runs/'+encodeURIComponent(id));}status.textContent=r.state==='succeeded'?'已恢复合成验证结果':'执行失败：'+r.error;if(r.report)renderResult($('job-result'),r);jsonDetails($('job-result'),'运行记录',r);}catch(e){$('job-status').textContent=e.message}
}
