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

// as of chrome 71, chrome no longer fires
// readyState or abort events synchronously
// when the document unloads. instead we must
// assume they are aborting the request and
// simply check to ensure the XHR has been
// canceled internally by Cypress
// https://github.com/cypress-io/cypress/issues/3973
if (Cypress.isBrowser('chrome')) {
  describe('issue #3973 - unloaded xhrs do not fire readystatechange event in chrome >= 71', () => {
    it('cancels pending requests that are incomplete', () => {
      const logs = []

      const xhrs = []
      const stub = cy.stub()

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'xhr') {
          logs.push(log)
        }
      })

      cy
      .server()
      .route('GET', /timeout/).as('getTimeout')
      .visit('http://localhost:3500/fixtures/generic.html')
      .window()
      .then((win) => {
        const xhr = new win.XMLHttpRequest()

        xhrs.push(xhr)

        xhr.open('GET', '/timeout?ms=100')
        xhr.send()
      })
      .wait('@getTimeout')
      .window()
      .then((win) => {
        return new Promise((resolve) => {
          cy.on('window:unload', resolve)

          const xhr = new win.XMLHttpRequest()

          xhrs.push(xhr)

          xhr.open('GET', '/timeout?ms=2000')

          xhr.abort = stub // this should not get called
          xhr.onerror = stub // this should not fire
          xhr.onload = stub // this should not fire

          xhr.send()

          win.location.reload()
        })
      })
      .wait('@getTimeout')
      .then((xhrProxy) => {
      // after we unload we should cancel the
      // pending XHR's and receive it here
      // after waiting on it
        expect(xhrProxy.canceled).to.be.true

        const [firstXhr, secondXhr] = xhrs
        const [firstLog, secondLog] = logs

        // should be the same XHR here as the proxy's XHR
        expect(secondXhr === xhrProxy.xhr).to.be.true

        expect(firstXhr.canceled).not.to.be.true
        expect(firstXhr.aborted).not.to.be.true
        expect(firstXhr.readyState).to.eq(4)
        expect(firstLog.get('state')).to.eq('passed')

        // since we've canceled the underlying XHR
        // ensure that our abort code did not run
        // and that the underlying XHR was never
        // completed with a status or response
        expect(secondXhr.canceled).to.be.true
        expect(secondXhr.aborted).not.to.be.true
        expect(secondXhr.status).to.eq(0)
        expect(secondXhr.responseText).to.eq('')

        expect(stub).not.to.be.called
        expect(secondLog.get('state')).to.eq('failed')
        expect(secondLog.invoke('renderProps')).to.deep.eq({
          message: 'GET (canceled) /timeout?ms=2000',
          indicator: 'aborted',
        })
      })
    })
  })
}
