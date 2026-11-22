/** 快数通场景表单（仅页面，暂未对接提交） */
export type IntentApplyKstForm = {
  projectType: string
  projectNumber: string
  projectName: string
  specialProjectName: string
  /** 是否在国家基础数据中心进行数据汇交 */
  dataSubmissionAtNbdc: string
  expectedResultsAndCompletionTime: string
}

export const INTENT_APPLY_KST_PROJECT_TYPES = [
  { label: '国家重点研发计划', value: 'national_key_rd' },
  { label: '国家自然科学基金', value: 'nsfc' },
  { label: '省部级项目', value: 'provincial' },
  { label: '其他', value: 'other' }
] as const

export const INTENT_APPLY_KST_DATA_SUBMISSION_OPTIONS = [
  { label: '是', value: 'yes' },
  { label: '否', value: 'no' }
] as const

export function createEmptyKstForm(): IntentApplyKstForm {
  return {
    projectType: '',
    projectNumber: '',
    projectName: '',
    specialProjectName: '',
    dataSubmissionAtNbdc: '',
    expectedResultsAndCompletionTime: ''
  }
}
