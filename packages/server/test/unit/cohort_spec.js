const cache = require(`../../lib/cache`)
const cohorts = require(`../../lib/cohorts`)

describe('lib/cohort', () => {
  context('.get', () => {
    it('calls cache.get', async () => {
      const cohortTest = {
        name: 'testName',
        cohort: 'A',
      }

      sinon.stub(cache, 'getCohorts').resolves({
        [cohortTest.name]: cohortTest,
      })

      return cohorts.get(cohortTest.name).then((cohort) => {
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
        return cohorts.get(cohortTest.name).then((cohort) => {
          expect(cohort).to.eq(cohortTest)
        })
      })
    })
  })
})
