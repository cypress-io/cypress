import { describe, expect, it, beforeEach, jest } from '@jest/globals'
import type { DataContext } from '../../../src'
import { CohortsActions } from '../../../src/actions/CohortsActions'
import { createTestDataContext } from '../helper'

describe('CohortsActions', () => {
  let ctx: DataContext
  let actions: CohortsActions

  beforeEach(() => {
    ctx = createTestDataContext('open')

    actions = new CohortsActions(ctx)
  })

  describe('getCohort', () => {
    it('should return null if name not found', async () => {
      const name = '123'

      const cohort = await actions.getCohort(name)

      expect(cohort).toBeUndefined()
      expect(ctx.config.cohortsApi.getCohort).toHaveBeenCalledWith(name)
    })

    it('should return cohort if in cache', async () => {
      const cohort = {
        name: 'loginBanner',
        cohort: 'A',
      }

      jest.spyOn(ctx._apis.cohortsApi, 'getCohort').mockResolvedValue(cohort)

      const cohortReturned = await actions.getCohort(cohort.name)

      expect(cohortReturned).toEqual(cohort)
      expect(ctx.config.cohortsApi.getCohort).toHaveBeenCalledWith(cohort.name)
    })
  })

  describe('determineCohort', () => {
    it('should determine cohort', async () => {
      const cohortConfig = {
        name: 'loginBanner',
        cohorts: ['A', 'B'],
      }

      const pickedCohort = await actions.determineCohort(cohortConfig.name, cohortConfig.cohorts)

      expect(ctx.config.cohortsApi.insertCohort).toHaveBeenNthCalledWith(1, { name: cohortConfig.name, cohort: expect.any(String) })
      expect(cohortConfig.cohorts.includes(pickedCohort.cohort)).toBe(true)
    })
  })
})
