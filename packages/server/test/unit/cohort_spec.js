require('../spec_helper')

const cache = require(`../../lib/cache`)
const cohorts = require(`../../lib/cohorts`)

describe('lib/cohort', () => {
  context('.get', () => {
    it('calls cache.get', async () => {
      const cohortTest = {
        name: 'testName',
        cohort: 'A',
      }
      const cohortTest2 = {
        name: 'testName2',
        cohort: 'B',
      }

      const allCohorts = {
        [cohortTest.name]: cohortTest,
        [cohortTest2.name]: cohortTest2,
      }

      sinon.stub(cache, 'getCohorts').resolves(allCohorts)

      return cohorts.get().then((cohorts) => {
        expect(cohorts).to.eq(allCohorts)
      })
    })
  })

  context('.getByName', () => {
    it('calls cache.getByName', async () => {
      const cohortTest = {
        name: 'testName',
        cohort: 'A',
      }

      sinon.stub(cache, 'getCohorts').resolves({
        [cohortTest.name]: cohortTest,
      })

      return cohorts.getByName(cohortTest.name).then((cohort) => {
        expect(cohort).to.eq(cohortTest)
      })
    })
  })

  context('.set', () => {
    it('calls cache.set', async () => {
      const cohortTest = {
        name: 'testName',
        cohort: 'A',
      }

      return cohorts.set(cohortTest).then(() => {
        return cohorts.getByName(cohortTest.name).then((cohort) => {
          expect(cohort).to.eq(cohortTest)
        })
      })
    })
  })
})
