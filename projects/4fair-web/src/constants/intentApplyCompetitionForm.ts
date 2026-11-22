/** 参赛场景 — 页面表单（暂未对接提交） */
export type IntentApplyCompetitionForm = {
  usagePurpose: string
  expectedResultsAndCompletionTime: string
}

export function createEmptyCompetitionForm(): IntentApplyCompetitionForm {
  return {
    usagePurpose: '',
    expectedResultsAndCompletionTime: ''
  }
}
