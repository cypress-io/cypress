const { _ } = Cypress

const testAfterRunEvents = []

Cypress.on('test:after:run', (test) => {
  testAfterRunEvents.push(test)
})

it('global test 1', () => {
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
