// https://github.com/cypress-io/cypress/issues/761
describe('issue #761 - aborted XHRs from previous tests', () => {
  context('aborted when complete', () => {
    it('test 1 dispatches xhr, but completes in test 2', () => {
      cy.window().then((win) => {
        const xhr = new win.XMLHttpRequest()

        xhr.open('GET', '/timeout?ms=1000')
        xhr.onload = () => {
          // we are in test 2 at this point
          // and should not throw
          xhr.abort()
        }
        xhr.send()
      })
    })

    it('test 2 aborts the completed XHR', () => {
      cy.wait(2000)
    })
  })

  context('aborted before complete', () => {
    let xhr = null

    // TODO: we lose a reference here to the xhr in test 2
    // so it shows up as "pending" forever because we reset
    // the proxied XHR's as references when the next test starts
    it('test 1 dispatches xhr, but completes in test 2', () => {
      cy.window().then((win) => {
        xhr = new win.XMLHttpRequest()

        xhr.open('GET', '/timeout?ms=1000')
        xhr.send()
      })
    })

    it('test 2 aborts the incomplete XHR which is currently in flight', () => {
      // we are in test 2 at this point
      // and should not throw when we
      // abort the incomplete xhr
      expect(xhr.aborted).not.to.be.true

      xhr.abort()
    })
  })
})
