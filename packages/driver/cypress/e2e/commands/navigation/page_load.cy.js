const Cookie = require('js-cookie')

const { assertLogLength } = require('../../../support/utils')

const { _, Promise, $ } = Cypress

describe('src/cy/commands/navigation', () => {
  // TODO(webkit): fix+unskip for webkit release
  context('#page load', { browser: '!webkit' }, () => {
    it('sets initial=true and then removes', () => {
      Cookie.remove('__cypress.initial')

      expect(Cookie.get('__cypress.initial')).to.be.undefined

      let expected = false

      cy
      .visit('/fixtures/form.html')
      .then(() => {
        // bind after the visit so the assertion only runs for the anchor
        // click below. `__cypress.initial` can't be set or read on an
        // opaque origin like `about:blank`, which a prior test may leave in
        // the AUT, so asserting on the visit's own unload flakes as `undefined`.
        cy.once('window:before:unload', () => {
          expected = true

          expect(Cookie.get('__cypress.initial')).to.eq('true')
        })

        cy.once('window:unload', () => {
          expect(cy.state('onPageLoadErr')).to.be.a('function')
        })

        return null
      })
      // clicking this anchor navigates us to a new page so
      // we should be setting the initial cookie
      .get('a:first').click().then(() => {
        const listeners = cy.listeners('window:load')

        // everything should have unbound properly
        expect(listeners.length).to.eq(0)

        expect(expected).to.be.true

        expect(cy.state('onPageLoadErr')).to.be.null

        expect(Cookie.get('__cypress.initial')).to.be.undefined
      })
    })

    // TODO: broken - https://github.com/cypress-io/cypress/issues/4973 (chrome76+ and firefox)
    it.skip('does not reset the timeout', (done) => {
      cy.timeout(1000)

      // previously loading would reset the timeout
      // which could cause failures on the next test
      // if there was logic after a test finished running
      cy.window().then((win) => {
        const timeout = cy.spy(cy, 'timeout')

        // we are unstable at this point
        cy.on('window:before:unload', () => {
          cy.whenStable(() => {
            expect(timeout).not.to.be.called

            done()
          })
        })

        win.location.href = 'about:blank'
      })
    })

    it('does not time out current commands until stability is reached', () => {
      // on the first retry cause a page load event synchronously
      cy.on('command:retry', (options) => {
        switch (options._retries) {
          case 1: {
            const win = cy.state('window')

            // load a page which times out after 500ms
            // to guarantee that url does not time out
            const $a = win.$('<a href=\'/timeout?ms=500\'>jquery</a>')
            .appendTo(win.document.body)

            causeSynchronousBeforeUnload($a)

            break
          }
          case 2: {
            // on 2nd retry add the DOM element
            const win = cy.state('window')

            $('<div id=\'did-not-exist\'>did not exist<div>')
            .appendTo(win.document.body)

            break
          }
          case 3: {
            // and on the 3rd retry add the class
            cy.state('window')

            $('#did-not-exist').addClass('foo')

            break
          }
          default:
            return
        }
      })

      cy
      .visit('/fixtures/jquery.html')

      // make get timeout after 300ms
      // but even though our page does not load for 500ms
      // this does not time out
      .get('#did-not-exist', { timeout: 300 }).should('have.class', 'foo')
    })

    describe('errors', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (_attrs, log) => {
          this.lastLog = log
          this.logs?.push(log)
        })

        return null
      })

      describe('can time out', () => {
        let pageLoadTimeout

        before(() => {
          pageLoadTimeout = Cypress.config().pageLoadTimeout
        })

        after(() => {
          Cypress.config('pageLoadTimeout', pageLoadTimeout)
        })

        it('times out', function (done) {
          let thenCalled = false

          cy.once('fail', (err, test) => {
            const { lastLog } = this

            // visit, window, page loading
            assertLogLength(this.logs, 3)

            expect(lastLog.get('name')).to.eq('page load')
            expect(lastLog.get('state')).to.eq('failed')
            expect(lastLog.get('error')).to.eq(err)
            expect(err.message).to.include('Your page did not fire its `load` event within `50ms`.')

            return Promise
            .delay(100)
            .then(() => {
              expect(cy.state('onPageLoadErr')).to.be.null
              expect(cy.isStopped()).to.be.true // make sure we ran our cleanup routine
              expect(thenCalled).to.be.false

              done()
            })
          })

          cy
          .visit('/fixtures/jquery.html')
          .window().then((win) => {
            Cypress.config('pageLoadTimeout', 50)
            const $a = win.$('<a href=\'/timeout?ms=500\'>jquery</a>')
            .appendTo(win.document.body)

            causeSynchronousBeforeUnload($a)

            return null
          })
          .wrap(null)
          .then(() => {
            thenCalled = true
          })
        })
      })

      it('does time out once stability is reached', function (done) {
        const logByName = (name) => {
          return _.find(this.logs, (log) => {
            return log.get('name') === name
          })
        }

        cy.on('fail', (err) => {
          cy.on('command:retry', () => {
            throw new Error('should not have retried twice')
          })

          expect(err.message).to.include('Expected to find element')

          const get = logByName('get')

          expect(get.get('error')).to.eq(err)

          return Promise.delay(200)
          .then(() => {
            expect(cy.isStopped()).to.be.true

            done()
          })
        })

        let start = null

        // on the first retry cause a page load event synchronously
        cy.on('command:retry', (options) => {
          switch (options._retries) {
            case 1: {
              // hold a ref to this
              start = options._start

              const win = cy.state('window')

              // load a page which times out after 400ms
              // to guarantee that url does not time out
              const $a = win.$('<a href=\'/timeout?ms=400\'>jquery</a>')
              .appendTo(win.document.body)

              causeSynchronousBeforeUnload($a)

              // immediately logs pending state
              expect(logByName('page load').get('state')).to.eq('pending')
            }
              break
            case 2: {
              // it should have reset this because we became
              // unstable
              expect(start).not.to.eq(options._start)

              // and by the time we retry for the 2nd time
              // the page should be loaded
              expect(logByName('page load').get('state')).to.eq('passed')
            }
              break
            default:
              return
          }
        })

        cy.visit('/fixtures/jquery.html')

        // make get timeout after only 200ms
        .get('#does-not-exist', { timeout: 200 }).should('have.class', 'foo')
      })

      return null
    })
  })

  // this tests isLoading spinner and page load event
  context('#page loading', () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'page load') {
          this.lastLog = log
          this.logs.push(log)
        }
      })

      return null
    })

    // FIXME: fix flaky test (webkit): https://github.com/cypress-io/cypress/issues/24600
    it('emits \'page:loading\' before and after initial visit', { browser: '!webkit' }, () => {
      const emit = cy.spy(Cypress, 'emit').log(false).withArgs('page:loading')

      cy
      .visit('/timeout?ms=10', {
        onBeforeLoad () {
          expect(emit).to.be.calledOnce
          expect(emit.getCall(0)).to.be.calledWith('page:loading', true)
        },
      })
      .then(() => {
        expect(emit).to.be.calledTwice
        expect(emit.getCall(1)).to.be.calledWith('page:loading', false)
      })
    })

    // FIXME: fix flaky test (webkit): https://github.com/cypress-io/cypress/issues/24600
    it('emits during page navigation', { browser: '!webkit' }, () => {
      const emit = cy.spy(Cypress, 'emit').log(false).withArgs('page:loading')
      let expected = false

      cy
      .visit('/fixtures/generic.html')
      .then(() => {
        cy.once('window:unload', () => {
          expected = true
          expect(emit.callCount).to.eq(3)
          expect(emit.getCall(2)).to.be.calledWith('page:loading', true)
        })
      }).get('#dimensions').click()
      .then(() => {
        expect(expected).to.be.true
        expect(emit.callCount).to.eq(4)
        expect(emit.getCall(3)).to.be.calledWith('page:loading', false)
      })
    })

    it('does not log during initial visit', () => {
      cy.visit('/timeout?ms=10').then(function () {
        expect(this.lastLog).not.to.exist
      })
    })

    // FIXME: fix flaky test (webkit): https://github.com/cypress-io/cypress/issues/24600
    it('logs during page navigation', { browser: '!webkit' }, () => {
      let expected = false

      cy
      .visit('/fixtures/generic.html')
      .then(function () {
        cy.once('window:before:unload', () => {
          expected = true

          expect(this.lastLog).to.exist
          expect(this.lastLog.get('state')).to.eq('pending')
          expect(this.lastLog.get('message')).to.eq('--waiting for new page to load--')
          expect(this.lastLog.get('snapshots')).to.have.length(0)
        })
      }).get('#dimensions').click()
      .then(function () {
        expect(expected).to.be.true
        expect(this.lastLog.get('state')).to.eq('passed')
        expect(this.lastLog.get('message')).to.eq('--page loaded--')
        expect(this.lastLog.get('snapshots')).to.have.length(1)
      })
    })

    // FIXME: fix flaky test (webkit): https://github.com/cypress-io/cypress/issues/24600
    it('logs during form submission and yields stale element', { browser: '!webkit' }, () => {
      let expected = false

      const names = cy.queue.names()

      cy
      .visit('/fixtures/form.html')
      .then(function () {
        const $input = cy.$$('form#click-me input[type=submit]')

        cy.once('window:before:unload', () => {
          expected = true

          expect(this.lastLog).to.exist
          expect(this.lastLog.get('state')).to.eq('pending')
          expect(this.lastLog.get('message')).to.eq('--waiting for new page to load--')
          expect(this.lastLog.get('snapshots')).to.have.length(0)
        })

        cy
        .get('form#click-me')
        .find('input[type=submit]')
        .click()
        .then(function (subject) {
          expect(expected).to.be.true

          expect(this.lastLog.get('state')).to.eq('passed')
          expect(this.lastLog.get('message')).to.eq('--page loaded--')
          expect(this.lastLog.get('snapshots')).to.have.length(1)

          expect(cy.queue.names()).to.deep.eq(names.concat([
            'visit', 'then', 'get', 'find', 'click', 'then',
          ]))

          expect(Cypress.dom.isDetached(subject)).to.be.true
          expect(subject.get(0)).to.eq($input.get(0))
        })
      })
    })

    it('tests waiting on stability at the end of the command queue', (done) => {
      cy
      .visit('/fixtures/generic.html')
      .then((win) => {
        cy.on('window:load', () => {
          cy.on('command:queue:end', () => {
            done()
          })
        })

        cy.on('command:queue:before:end', () => {
          // force us to become unstable immediately
          // else the beforeunload event fires at the end
          // of the tick which is too late
          cy.isStable(false, 'testing')

          win.location.href = '/timeout?ms=100'
        })

        return null
      })
    })
  })

  context('resets state', () => {
    it('resets the server state', () => {
      cy.stub(Cypress, 'backend').log(false).callThrough()

      Cypress.emitThen('test:before:run:async', {
        id: 'r1',
        currentRetry: 1,
      })
      .then(() => {
        expect(Cypress.backend).to.be.calledWith('reset:server:state')
      })
    })
  })
})

const causeSynchronousBeforeUnload = function ($a) {
  // this causes a synchronous beforeunload event
  // chrome & firefox behave differently
  const win = $a[0].ownerDocument.defaultView

  if (Cypress.isBrowser('firefox')) {
    win.location.href = $a[0].href
  } else {
    return $a.get(0).click()
  }
}
