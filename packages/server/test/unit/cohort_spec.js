const cache = require(`../../lib/cache`)
const cohorts = require(`../../lib/cohorts`)

describe('lib/cohort', () => {
  context('.get', () => {
    it('calls cache.get', async () => {
      const cohortTest = {
        id: 'testid',
        name: 'testName',
      }

      sinon.stub(cache, 'getCohorts').resolves({
        [cohortTest.id]: cohortTest,
      })

      return cohorts.get(cohortTest.id).then((cohort) => {
        expect(cohort).to.eq(cohortTest)
      })
    })
  })

  context('.set', () => {
    it('calls cache.set', async () => {
      const cohortTest = {
        id: 'testid',
        name: 'testName',
      }

      return cohorts.set(cohortTest).then(() => {
        return cohorts.get(cohortTest.id).then((cohort) => {
          expect(cohort).to.eq(cohortTest)
        })
      })
    })
  })
})
