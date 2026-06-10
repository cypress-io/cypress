// https://github.com/cypress-io/cypress/issues/31505
// When an error is thrown via `throwErrByPath` (e.g. a command validation
// error) immediately after a `.then()` callback that ran an `expect()`
// assertion, the code frame must point at the failing command and not at the
// assertion inside the previous `.then()` callback. The assertion used to leave
// a stale `currentAssertionUserInvocationStack` on state that the failing
// command's error would incorrectly pick up.
describe('issue 31505', () => {
  it('points the code frame at the failing command, not a previous .then() assertion', (done) => {
    cy.on('fail', (err) => {
      expect(err.codeFrame, 'code frame should exist').to.exist

      // the code frame should reference the failing `.its()` command...
      expect(err.codeFrame.frame).to.include('its(')

      // ...and NOT the assertion that ran inside the previous `.then()` callback
      expect(err.codeFrame.frame).not.to.include('previousThenAssertion')

      done()
    })

    cy.wrap({ foo: 'bar' }).then(() => {
      const previousThenAssertion = true

      expect(previousThenAssertion).to.equal(true)
    })

    // Enough separation that the failing command's code frame (which includes a
    // few surrounding source lines) cannot overlap the assertion above.

    cy.wrap({ foo: 'bar' })
    .its() // throws via throwErrByPath: `.its()` requires a property name
  })
})
