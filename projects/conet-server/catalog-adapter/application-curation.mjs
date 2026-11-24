// Platform-library scope; historical definitions, tasks and results are retained.
export const curationDecisions=[{id:'svc-008',included:false,reason:'Office文档结构提取，不属于科学数据分析处理',reviewedAt:'2026-11-24'}];
export const includedInLibrary=id=>!curationDecisions.some(d=>d.id===id&&!d.included);
export async function applyApplicationCuration(apps){for(const decision of curationDecisions)await apps.updateOne({_id:decision.id,origin:'designed'},{$set:{catalogIncluded:decision.included,catalogDecision:decision,...(!decision.included?{status:'offline',executable:false}: {})}})}
