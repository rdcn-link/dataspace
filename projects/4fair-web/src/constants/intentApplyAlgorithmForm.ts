/** 算法模型场景 — 页面表单（暂未对接提交） */
export type IntentApplyAlgorithmForm = {
  usagePurpose: string
  expectedResultsAndCompletionTime: string
}

export const INTENT_APPLY_ALGORITHM_USAGE_PURPOSE_PLACEHOLDER =
  '请详细阐释数据被应用于数据模型的具体方式，包括但不限于具体应用场景，同时明确阐述与之相关的研究目的和商业用途。'

export function createEmptyAlgorithmForm(): IntentApplyAlgorithmForm {
  return {
    usagePurpose: '',
    expectedResultsAndCompletionTime: ''
  }
}
