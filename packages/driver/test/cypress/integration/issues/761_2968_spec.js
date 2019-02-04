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

// this tests that XHR references are blown away
// and no longer invoked when unloading the window
// and that its unnecessary to abort them
// https://github.com/cypress-io/cypress/issues/2968
describe('issue #2968 - unloaded xhrs do not need to be aborted', () => {
  it('let the browser naturally abort requests without manual intervention on unload', () => {
    let xhr
    let log

    const stub = cy.stub()

    cy.on('internal:logChange', (attrs, l) => {
      if (attrs.name === 'xhr') {
        log = l
      }
    })

    cy
    .visit('http://localhost:3500/fixtures/generic.html')
    .window()
    .then((win) => {
      return new Promise((resolve, reject) => {
        xhr = new win.XMLHttpRequest()

        win.XMLHttpRequest.prototype.abort = stub

        xhr.open('GET', '/timeout?ms=1000')
        xhr.abort = stub // this should not get called
        xhr.onerror = stub // this should not fire
        xhr.onload = stub // this should not fire
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            try {
              // the browser should naturally
              // abort / cancel this request when
              // the unload event is called which
              // should cause this xhr to have
              // these properties and be displayed
              // correctly in the Cypress Command Log
              expect(xhr.aborted).to.be.true
              expect(xhr.readyState).to.eq(4)
              expect(xhr.status).to.eq(0)
              expect(xhr.responseText).to.eq('')
            } catch (err) {
              reject(err)
            }

            resolve()
          }
        }

        xhr.send()

        win.location.href = 'about:blank'
      })
    })
    .wrap(null)
    .should(() => {
      expect(stub).not.to.be.called
      expect(log.get('state')).to.eq('failed')
    })
  })
})
