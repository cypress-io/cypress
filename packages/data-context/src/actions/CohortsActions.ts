import type { Cohort } from '@packages/types'
import type { DataContext } from '..'

export interface CohortsApiShape {
  getCohort(name: string): Promise<Cohort>

  insertCohort (cohort: Cohort): Promise<void>
}

export class CohortsActions {
  constructor (private ctx: DataContext) {}

  async getCohort (name: string) {
    return this.ctx._apis.cohortsApi.getCohort(name)
  }

  async insertCohort (cohort: Cohort) {
    return this.ctx._apis.cohortsApi.insertCohort(cohort)
  }
}
