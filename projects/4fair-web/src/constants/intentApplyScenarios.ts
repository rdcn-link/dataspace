/** 后端 @RequestParam Integer type：快数通=1，其余=0 */
export type ApplyScenarioType = 0 | 1

/** 应用场景唯一标识（下拉 value）；提交 applyType 仍取 value 字段 */
export const INTENT_APPLY_SCENARIO_KST_KEY = 'kuaishutong' as const
export const INTENT_APPLY_SCENARIO_PROJECT_KEY = 'project' as const
export const INTENT_APPLY_SCENARIO_ALGORITHM_KEY = 'algorithm' as const
export const INTENT_APPLY_SCENARIO_COMPETITION_KEY = 'competition' as const
export const INTENT_APPLY_SCENARIO_THESIS_KEY = 'thesis' as const

/** 快数通已认证用户免签附件提示 */
export const INTENT_APPLY_KST_EXEMPT_MESSAGE =
  '您已通过快数通首次认证，本次申请获免签绿色通道。'

/** 应用场景下拉选项 */
export const INTENT_APPLY_SCENARIOS = [
  { label: '快数通', value: '1', key: INTENT_APPLY_SCENARIO_KST_KEY },
  { label: '支撑项目/课题研究', value: '0', key: INTENT_APPLY_SCENARIO_PROJECT_KEY },
  { label: '支撑学术论文/毕业论文', value: '0', key: INTENT_APPLY_SCENARIO_THESIS_KEY },
  { label: '算法模型', value: '0', key: INTENT_APPLY_SCENARIO_ALGORITHM_KEY },
  { label: '参赛', value: '0', key: INTENT_APPLY_SCENARIO_COMPETITION_KEY }
] as const

export type IntentApplyScenarioKey =
  (typeof INTENT_APPLY_SCENARIOS)[number]['key']

export function parseApplyScenarioType(value: string): ApplyScenarioType | null {
  if (value === '1') return 1
  if (value === '0') return 0
  return null
}

export function getScenarioOptionByKey(key: string) {
  return INTENT_APPLY_SCENARIOS.find((item) => item.key === key)
}

export function getApplyTypeForScenarioKey(key: string): ApplyScenarioType | null {
  const option = getScenarioOptionByKey(key)
  if (!option) return null
  return parseApplyScenarioType(option.value)
}

/** applyType 可能为 0，不可用布尔取反判断 */
export function isValidScenarioKey(key: string): boolean {
  return getApplyTypeForScenarioKey(key) !== null
}

export function isThesisScenarioKey(key: string): boolean {
  return key === INTENT_APPLY_SCENARIO_THESIS_KEY
}

export function isKuaishutongScenarioKey(key: string): boolean {
  return key === INTENT_APPLY_SCENARIO_KST_KEY
}

export function isProjectScenarioKey(key: string): boolean {
  return key === INTENT_APPLY_SCENARIO_PROJECT_KEY
}

export function isAlgorithmScenarioKey(key: string): boolean {
  return key === INTENT_APPLY_SCENARIO_ALGORITHM_KEY
}

export function isCompetitionScenarioKey(key: string): boolean {
  return key === INTENT_APPLY_SCENARIO_COMPETITION_KEY
}

/** 支撑学术论文/毕业论文 — 与 order.save 字段一致 */
export type IntentApplyThesisForm = {
  paperTitle: string
  researchDirection: string
  guidanceTeacher: string
  guidanceTeacherUnit: string
  expectedResultsAndCompletionTime: string
}

const THESIS_FIELD_LABELS: Record<keyof IntentApplyThesisForm, string> = {
  paperTitle: '论文名称',
  researchDirection: '研究方向',
  guidanceTeacher: '指导老师',
  guidanceTeacherUnit: '指导老师单位',
  expectedResultsAndCompletionTime: '预期成果及完成时间'
}

export function createEmptyThesisForm(): IntentApplyThesisForm {
  return {
    paperTitle: '',
    researchDirection: '',
    guidanceTeacher: '',
    guidanceTeacherUnit: '',
    expectedResultsAndCompletionTime: ''
  }
}

/** 论文场景下校验必填；非论文场景不校验 */
export function validateThesisFormIfRequired(
  scenarioKey: string,
  thesis: IntentApplyThesisForm
): string | null {
  if (!isThesisScenarioKey(scenarioKey)) return null
  for (const key of Object.keys(THESIS_FIELD_LABELS) as (keyof IntentApplyThesisForm)[]) {
    if (!thesis[key].trim()) {
      return `请填写${THESIS_FIELD_LABELS[key]}`
    }
  }
  return null
}

export function getThesisFieldsForSubmit(
  scenarioKey: string,
  thesis: IntentApplyThesisForm
): IntentApplyThesisForm | Record<string, never> {
  if (!isThesisScenarioKey(scenarioKey)) return {}
  return {
    paperTitle: thesis.paperTitle.trim(),
    researchDirection: thesis.researchDirection.trim(),
    guidanceTeacher: thesis.guidanceTeacher.trim(),
    guidanceTeacherUnit: thesis.guidanceTeacherUnit.trim(),
    expectedResultsAndCompletionTime: thesis.expectedResultsAndCompletionTime.trim()
  }
}

/** 附件大小上限（字节），30MB */
export const INTENT_APPLY_ATTACHMENT_MAX_BYTES = 30 * 1024 * 1024
