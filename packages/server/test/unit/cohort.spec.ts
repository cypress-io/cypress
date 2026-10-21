import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Cohort } from '@packages/types'
import { cache } from '../../lib/cache'
import * as cohorts from '../../lib/cohorts'

describe('lib/cohort', () => {
  beforeEach(async () => {
    await cache.remove()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('.get', () => {
    it('calls cache.get', async () => {
      const cohortTest: Cohort = {
        name: 'testName',
        cohort: 'A',
      }
      const cohortTest2: Cohort = {
        name: 'testName2',
        cohort: 'B',
      }

      const allCohorts = {
        [cohortTest.name]: cohortTest,
        [cohortTest2.name]: cohortTest2,
      }

      vi.spyOn(cache, 'getCohorts').mockResolvedValue(allCohorts)

      return cohorts.get().then((cohorts) => {
        expect(cohorts).toBe(allCohorts)
      })
    })
  })

  describe('.getByName', () => {
    it('calls cache.getByName', async () => {
      const cohortTest: Cohort = {
        name: 'testName',
        cohort: 'A',
      }

      vi.spyOn(cache, 'getCohorts').mockResolvedValue({
        [cohortTest.name]: cohortTest,
      })

      return cohorts.getByName(cohortTest.name).then((cohort) => {
        expect(cohort).toBe(cohortTest)
      })
    })
  })

  describe('.set', () => {
    it('calls cache.set', async () => {
      const cohortTest: Cohort = {
        name: 'testName',
        cohort: 'A',
      }

      return cohorts.set(cohortTest).then(() => {
        return cohorts.getByName(cohortTest.name).then((cohort) => {
          expect(cohort).toStrictEqual(cohortTest)
        })
      })
    })
  })
})
