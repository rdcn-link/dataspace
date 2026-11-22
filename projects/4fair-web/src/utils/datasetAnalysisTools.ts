import { isCo2AnalysisDataset } from '@/utils/co2AnalysisDataset'
import { isFieldExpeditionAnalysisDataset } from '@/utils/fieldExpeditionAnalysisDataset'
import { isSedimentAnalysisDataset } from '@/utils/sedimentAnalysisDataset'
import { isSedimentProfileAnalysisDataset } from '@/utils/sedimentProfileAnalysisDataset'
import { isSedimentThicknessAnalysisDataset } from '@/utils/sedimentThicknessAnalysisDataset'

export type DatasetAnalysisTool = {
  id: 'co2' | 'sediment' | 'sediment-profile' | 'sediment-thickness' | 'field-expedition'
  routeName:
    | 'DatasetCo2Analysis'
    | 'DatasetSedimentAnalysis'
    | 'DatasetSedimentProfileAnalysis'
    | 'DatasetSedimentThicknessAnalysis'
    | 'DatasetFieldExpeditionAnalysis'
}

export function resolveDatasetAnalysisTool(input: {
  name?: string | null
  nameEn?: string | null
  cstr?: string | null
}): DatasetAnalysisTool | null {
  if (isCo2AnalysisDataset(input)) {
    return { id: 'co2', routeName: 'DatasetCo2Analysis' }
  }
  if (isFieldExpeditionAnalysisDataset(input)) {
    return { id: 'field-expedition', routeName: 'DatasetFieldExpeditionAnalysis' }
  }
  if (isSedimentProfileAnalysisDataset(input)) {
    return { id: 'sediment-profile', routeName: 'DatasetSedimentProfileAnalysis' }
  }
  if (isSedimentThicknessAnalysisDataset(input)) {
    return { id: 'sediment-thickness', routeName: 'DatasetSedimentThicknessAnalysis' }
  }
  if (isSedimentAnalysisDataset(input)) {
    return { id: 'sediment', routeName: 'DatasetSedimentAnalysis' }
  }
  return null
}
