// https://github.com/cypress-io/cypress/issues/31505
// When an error is thrown via `throwErrByPath` (e.g. a command validation
// error) immediately after a `.then()` callback that ran an `expect()`
// assertion, the code frame must point at the failing command and not at the
// assertion inside the previous `.then()` callback.
//
// Chai assertions store their invocation stack on
// `state('currentAssertionUserInvocationStack')`, which used to never be
// cleared. A later command failing with a non-assertion `CypressError` (which
// doesn't set `err.userInvocationStack`) would then pick up that stale stack in
// `getUserInvocationStack`, mislocating the code frame.
//
// NOTE: this regression only manifests in browsers where the assertion stack
// survives between commands (e.g. Chrome, which Cypress runs in CI). It is
// harmless in Electron dev mode, where internal assertions overwrite the state.
describe('issue 31505', () => {
  it('points the code frame at the failing command, not a previous .then() assertion', (done) => {
    cy.on('fail', (err) => {
      expect(err.codeFrame, 'code frame should exist').to.exist

      // the code frame should reference the failing `cy.task()` command...
      expect(err.codeFrame.frame).to.include('cy.task(')

      // ...and NOT the assertion that ran inside the previous `.then()` callback
      expect(err.codeFrame.frame).not.to.include('previousThenAssertion')

      done()
    })

    cy.wrap({ foo: 'bar' }).then(() => {
      const previousThenAssertion = true

      expect(previousThenAssertion).to.equal(true)
    })

    // `cy.task()` with no argument throws synchronously via `throwErrByPath`.
    cy.task()
  })
})
