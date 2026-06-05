/* eslint-disable mocha/handle-done-callback */

// https://github.com/cypress-io/cypress/issues/15005
//
// A spy attached to a frequently-invoked method (e.g. window.postMessage) can
// accumulate a huge call history. Sinon lists every call in a failing
// assertion's message (the `%C` printf token), which used to make each retry of
// the assertion do progressively more work - the command would appear to hang
// for many minutes instead of failing after the assertion timeout.
//
// The number of calls listed in the message is now capped, so message
// construction - and therefore each retry - stays bounded. This spec passes
// only when the message is truncated; before the fix it would either hang or
// produce an untruncated message and fail.
describe('spy assertion with large call history', { defaultCommandTimeout: 1000 }, () => {
  it('fails after the timeout with a bounded message instead of hanging', function (done) {
    const obj = { foo () {} }

    cy.spy(obj, 'foo').as('foo')

    // accumulate far more calls than Cypress is willing to serialize
    for (let i = 0; i < 1000; i++) {
      obj.foo(i)
    }

    cy.on('fail', (err) => {
      // the listing is truncated rather than including all 1000 calls
      expect(err.message).to.include('more call(s)')

      done()
    })

    // this assertion never passes; before the fix, building its failure message
    // enumerated every call on each retry and the run would hang
    cy.get('@foo').should('have.been.calledWith', 'does-not-exist')
  })
})
