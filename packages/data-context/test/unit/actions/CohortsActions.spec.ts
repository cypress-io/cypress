import type { DataContext } from '../../../src'
import { CohortsActions } from '../../../src/actions/CohortsActions'
import { createTestDataContext } from '../helper'
import { expect } from 'chai'
import sinon, { SinonStub } from 'sinon'

describe('CohortsActions', () => {
  let ctx: DataContext
  let actions: CohortsActions

  beforeEach(() => {
    sinon.restore()

    ctx = createTestDataContext('open')

    actions = new CohortsActions(ctx)
  })

  context('getCohort', () => {
    it('should return null if id not found', async () => {
      const id = '123'

      const cohort = await actions.getCohort(id)

      expect(cohort).to.be.undefined
      expect(ctx.cohortsApi.getCohort).to.have.been.calledWith(id)
    })

    it('should return cohort if in cache', async () => {
      const cohort = {
        id: '123',
        name: 'cohort1',
        cohort: 'A',
      }

      ;(ctx._apis.cohortsApi.getCohort as SinonStub).resolves(cohort)

      const cohortReturned = await actions.getCohort(cohort.id)

      expect(cohortReturned).to.eq(cohort)
      expect(ctx.cohortsApi.getCohort).to.have.been.calledWith(cohort.id)
    })
  })

  context('insertCohort', () => {
    it('should insert cohort', async () => {
      const cohort = {
        id: '123',
        name: 'cohort1',
        cohort: 'A',
      }

      await actions.insertCohort(cohort)

      expect(ctx.cohortsApi.insertCohort).to.have.been.calledWith(cohort)
    })
  })
})
