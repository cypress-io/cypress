import type { DataContext } from '../../../src'
import { CohortsActions } from '../../../src/actions/CohortsActions'
import { createTestDataContext } from '../helper'
import { expect } from 'chai'
import sinon, { SinonStub, match } from 'sinon'

describe('CohortsActions', () => {
  let ctx: DataContext
  let actions: CohortsActions

  beforeEach(() => {
    sinon.restore()

    ctx = createTestDataContext('open')

    actions = new CohortsActions(ctx)
  })

  context('getCohort', () => {
    it('should return null if name not found', async () => {
      const name = '123'

      const cohort = await actions.getCohort(name)

      expect(cohort).to.be.undefined
      expect(ctx.config.cohortsApi.getCohort).to.have.been.calledWith(name)
    })

    it('should return cohort if in cache', async () => {
      const cohort = {
        name: 'loginBanner',
        cohort: 'A',
      }

      ;(ctx._apis.cohortsApi.getCohort as SinonStub).resolves(cohort)

      const cohortReturned = await actions.getCohort(cohort.name)

      expect(cohortReturned).to.eq(cohort)
      expect(ctx.config.cohortsApi.getCohort).to.have.been.calledWith(cohort.name)
    })
  })

  context('determineCohort', () => {
    it('should determine cohort', async () => {
      const cohortConfig = {
        name: 'loginBanner',
        cohorts: ['A', 'B'],
      }

      const pickedCohort = await actions.determineCohort(cohortConfig.name, cohortConfig.cohorts)

      expect(ctx.config.cohortsApi.insertCohort).to.have.been.calledOnceWith({ name: cohortConfig.name, cohort: match.string })
      expect(cohortConfig.cohorts.includes(pickedCohort.cohort)).to.be.true
    })
  })
})
