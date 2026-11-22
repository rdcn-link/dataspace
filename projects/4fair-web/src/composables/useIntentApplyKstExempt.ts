import { ref, watch, type Ref } from 'vue'
import {
  INTENT_APPLY_KST_EXEMPT_MESSAGE,
  isKuaishutongScenarioKey
} from '@/constants/intentApplyScenarios'
import { fetchOrderHasKst } from '@/utils/intentApplySubmit'

export function useIntentApplyKstExempt(options: {
  scenarioKey: Ref<string>
  getApplicantUid: () => string
  onExempt?: () => void
}) {
  const kstChecking = ref(false)
  const kstExempt = ref(false)

  let requestSeq = 0

  async function refreshKstExempt() {
    if (!isKuaishutongScenarioKey(options.scenarioKey.value)) {
      kstExempt.value = false
      kstChecking.value = false
      return
    }

    const uid = options.getApplicantUid().trim()
    if (!uid) {
      kstExempt.value = false
      kstChecking.value = false
      return
    }

    const seq = ++requestSeq
    kstChecking.value = true
    try {
      const json = await fetchOrderHasKst(uid)
      if (seq !== requestSeq) return
      const exempt = json.code === 200
      kstExempt.value = exempt
      if (exempt) options.onExempt?.()
    } catch {
      if (seq !== requestSeq) return
      kstExempt.value = false
    } finally {
      if (seq === requestSeq) kstChecking.value = false
    }
  }

  watch(
    () => [options.scenarioKey.value, options.getApplicantUid()] as const,
    () => {
      void refreshKstExempt()
    },
    { immediate: true }
  )

  return {
    kstChecking,
    kstExempt,
    kstExemptMessage: INTENT_APPLY_KST_EXEMPT_MESSAGE,
    refreshKstExempt
  }
}
