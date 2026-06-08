import systemTests from '../lib/system-tests'

describe('e2e spy assertion with large call history', () => {
  systemTests.setup()

  // https://github.com/cypress-io/cypress/issues/15005
  // A failing assertion on a spy with a very large call history should fail
  // quickly with a bounded (truncated) message instead of hanging. The spec
  // intercepts its own failure and asserts the message is truncated, so a
  // passing run (exit code 0) proves the fix is in place.
  systemTests.it('does not hang and truncates the spy call listing', {
    spec: 'spy_assertion_large_call_history.cy.js',
    expectedExitCode: 0,
  })
})
