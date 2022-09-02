import { WeightedAlgorithm, WEIGHTED_EVEN } from '../utils/weightedChoice'

export type CohortConfig = {
  id: string
  cohorts: string[]
  algorithm?: WeightedAlgorithm
}

export type Cohort = {
  id: string
}

export const useCohorts = (config: CohortConfig) => {
  const algorithm = config.algorithm || WEIGHTED_EVEN(config.cohorts)
  const get = (): Cohort => {
    return {
      id: algorithm.pick(config.cohorts),
    }
  }

  return {
    get,
  }
}
