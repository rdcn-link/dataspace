import { INTENT_APPLY_KST_PROJECT_TYPES } from '@/constants/intentApplyKstForm'

/** 支撑项目/课题研究 — 页面表单（暂未对接提交） */
export type IntentApplyProjectForm = {
  projectType: string
  projectTopicName: string
  projectResearchContent: string
  expectedResultsAndCompletionTime: string
}

export const INTENT_APPLY_PROJECT_TYPES = INTENT_APPLY_KST_PROJECT_TYPES

export function createEmptyProjectForm(): IntentApplyProjectForm {
  return {
    projectType: '',
    projectTopicName: '',
    projectResearchContent: '',
    expectedResultsAndCompletionTime: ''
  }
}
