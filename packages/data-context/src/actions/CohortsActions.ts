import type { Cohort } from '@packages/types'
import type { DataContext } from '..'
import { WEIGHTED, WEIGHTED_EVEN } from '../util/weightedChoice'
const debug = require('debug')('cypress:data-context:actions:CohortActions')

export interface CohortsApiShape {
  getCohorts(): Promise<Record<string, Cohort> | undefined>

  getCohort(name: string): Promise<Cohort | undefined>

  insertCohort (cohort: Cohort): Promise<void>
}

export class CohortsActions {
  constructor (private ctx: DataContext) {}

  async getCohorts () {
    debug('Getting all cohorts')

    return this.ctx._apis.cohortsApi.getCohorts()
  }

  async getCohort (name: string) {
    debug('Getting cohort for %s', name)

    return this.ctx._apis.cohortsApi.getCohort(name)
  }

  async determineCohort (name: string, cohorts: string[], weights?: number[]) {
    debug('Determining cohort', name, cohorts)

    const cohortFromCache = await this.getCohort(name)

    let cohortSelected: Cohort

    if (!cohortFromCache || !cohorts.includes(cohortFromCache.cohort)) {
      const algorithm = weights ? WEIGHTED(weights) : WEIGHTED_EVEN(cohorts)
      const pickedCohort = {
        name,
        cohort: algorithm.pick(cohorts),
      }

      debug('Inserting cohort for %o', pickedCohort)
      await this.ctx._apis.cohortsApi.insertCohort(pickedCohort)
      cohortSelected = pickedCohort
    } else {
      cohortSelected = cohortFromCache
    }

    debug('Selecting cohort', cohortSelected)

    return cohortSelected
  }
}
