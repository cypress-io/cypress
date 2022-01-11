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
