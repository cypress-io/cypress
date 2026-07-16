const { _ } = Cypress

const pending = []
const testAfterRunEvents = []

Cypress.on('test:after:run', (test) => {
  testAfterRunEvents.push(test)
  if (test.state === 'pending') {
    return pending.push(test)
  }
})

describe('src/cypress/runner', () => {
  context('pending tests', () => {
    it('is not pending', () => {})

    it('is pending 1')

    it('is pending 2')

    it('has 2 pending tests', () => {
      expect(pending).to.have.length(2)

      expect(pending[0].title).to.eq('is pending 1')

      expect(pending[1].title).to.eq('is pending 2')
    })
  })
})

describe('async timeouts', () => {
  it('does not timeout during cypress command', (done) => {
    cy.timeout(100)
    cy.wait(200)
    cy.then(() => done())
  })
})

describe('getAllTestsState', () => {
  it('serializes every test of the spec keyed by id, run or not', () => {
    const tests = Cypress.runner.getAllTestsState()
    const byTitle = _.keyBy(_.values(tests), 'title')

    _.each(tests, (test, id) => {
      expect(test.id, 'key is the test id').to.eq(id)
      expect(test.prevAttempts, 'prevAttempts is serialized').to.be.an('array')
    })

    expect(byTitle['is not pending']._titlePath).to.deep.eq(['src/cypress/runner', 'pending tests', 'is not pending'])
    expect(byTitle['is not pending'].state).to.eq('passed')
    expect(byTitle['is pending 1'].state).to.eq('pending')

    // Unlike getTestsState, the currently running test and tests that have
    // not run yet are included — with no state set.
    expect(byTitle['serializes every test of the spec keyed by id, run or not'].state).to.be.undefined
    expect(byTitle['test 2'].state).to.be.undefined
  })
})

// NOTE: this test must remain the last test in the spec
// so we can test the root after hook
// https://github.com/cypress-io/cypress/issues/2296
describe('fires test:after:run after root after hook', () => {
  it('test 1', () => {
  })

  it('test 2', () => {
  })
})

// https://github.com/cypress-io/cypress/issues/2296
after(() => {
  expect(_.last(testAfterRunEvents).title, 'test:after:run for test 2 should not have fired yet').eq('test 1')
})
