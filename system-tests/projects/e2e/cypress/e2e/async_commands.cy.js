/* eslint-disable
    mocha/no-global-tests,
*/

// https://github.com/cypress-io/cypress/issues/4742
// When a test body returns a promise (e.g. an `async` function) and enqueues
// cy commands *after* an `await`, the command queue must be awaited by mocha so
// that a failing command (such as a failing assertion) fails the test overall.

it('fails when a command times out after await in an async test', async () => {
  await Promise.resolve('bar')

  // This assertion can never pass, so the command retries until it times out.
  // The timeout fires *after* the async function's promise has resolved, which
  // is the exact scenario that previously let the test pass despite failing.
  cy.wrap('foo', { timeout: 100 }).should('equal', 'baz')
})

it('passes when an async test enqueues only passing commands after await', async () => {
  await Promise.resolve('bar')

  cy.wrap('foo').should('equal', 'foo')
})
