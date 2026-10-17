import { assertLogLength } from '../../../support/utils'

const { _, Promise } = Cypress

describe('src/cy/commands/navigation', () => {
  // https://github.com/cypress-io/cypress/issues/32460
  context('#go page load', () => {
    it('yields the AUT window after going back', () => {
      cy.visit('/fixtures/generic.html')
      cy.visit('/fixtures/jquery.html')

      cy.go('back').then((win) => {
        expect(win).to.eq(cy.state('window'))
        expect(win.location.pathname).to.eq('/fixtures/generic.html')
      })
    })

    it('yields the AUT window after going forward', () => {
      cy.visit('/fixtures/generic.html')
      cy.visit('/fixtures/jquery.html')
      cy.go('back')

      cy.go('forward').then((win) => {
        expect(win).to.eq(cy.state('window'))
        expect(win.location.pathname).to.eq('/fixtures/jquery.html')
      })
    })

    it('does not resolve until the page it navigates to has loaded', () => {
      let loadedAt

      cy.visit('/slow-load?ms=1000')
      cy.visit('/fixtures/generic.html')
      cy.then(() => {
        cy.on('window:load', () => {
          loadedAt = Date.now()
        })
      })

      cy.go('back').then((win) => {
        expect(loadedAt, 'window:load fired before cy.go() resolved').to.be.a('number')
        expect(win.location.pathname).to.eq('/slow-load')
        expect(win.document.readyState).to.eq('complete')
        expect(win.document.querySelector('img')?.complete).to.be.true
      })
    })

    it('waits for a slow navigation request before checking whether the page unloaded', { browser: '!webkit' }, () => {
      cy.visit('/fixtures/generic.html')
      cy.visit('/fixtures/jquery.html')
      cy.then(() => {
        const automation = Cypress.automation.bind(Cypress)

        cy.stub(Cypress, 'automation').callsFake((eventName, ...args) => {
          if (eventName === 'navigate:aut:history') {
            return Promise.delay(300).then(() => automation(eventName, ...args))
          }

          return automation(eventName, ...args)
        })
      })

      cy.go('back').then((win) => {
        expect(win.location.pathname).to.eq('/fixtures/generic.html')
        expect(win.document.readyState).to.eq('complete')
      })
    })

    it('fails when the page it navigates to does not load within pageLoadTimeout', { pageLoadTimeout: 500 }, (done) => {
      cy.visit('/slow-load?ms=2000', { timeout: 5000 })
      cy.visit('/fixtures/generic.html')
      .then(() => {
        let failed = false

        // the page keeps loading after the failure, so wait for it
        // before finishing to keep it from leaking into the next test
        cy.on('window:load', () => {
          done(failed ? undefined : new Error('the page loaded before cy.go() failed'))
        })

        cy.on('fail', (err) => {
          failed = true

          expect(err.message).to.include('Your page did not fire its `load` event within `500ms`.')
        })

        cy.go('back')
      })
    })

    const sameDocumentNavigations = {
      'a hash change': (win) => {
        win.location.hash = 'foo'
      },
      'history.pushState': (win) => {
        win.history.pushState({}, '', '/fixtures/generic.html?pushed')
      },
    }

    _.each(sameDocumentNavigations, (navigate, name) => {
      it(`resolves without waiting for a page load when going back over ${name}`, () => {
        const onLoad = cy.stub()

        cy.visit('/fixtures/generic.html')
        // a navigation started before the `load` event finishes replaces the
        // current history entry instead of adding one, so let it finish first
        cy.window().then((win) => new Promise((resolve) => win.setTimeout(resolve)))
        cy.window().then((originalWin) => {
          navigate(originalWin)
          cy.on('window:load', onLoad)

          // no page load comes, so if cy.go() waited for one this would fail
          // after 1s instead of after pageLoadTimeout
          cy.go('back', { timeout: 1000 }).then((win) => {
            expect(win).to.eq(originalWin)
            expect(win.location.href).to.eq('http://localhost:3500/fixtures/generic.html')
            expect(onLoad).not.to.be.called
          })
        })
      })
    })
  })

  context('#go', () => {
    it('sets timeout to Cypress.config(pageLoadTimeout)', {
      pageLoadTimeout: 4567,
    }, () => {
      cy.visit('/fixtures/generic.html')
      const timeout = cy.spy(Promise.prototype, 'timeout')

      cy
      .visit('/fixtures/jquery.html')
      .go('back').then(() => {
        expect(timeout).to.be.calledWith(4567, 'go')
      })
    })

    it('handles hashchange events', () => {
      const emit = cy.spy(Cypress, 'emit').log(false).withArgs('url:changed')

      cy
      .visit('/fixtures/generic.html')
      .get('#hashchange').click()
      .then(() => {
        cy.go('back')
        cy.go('forward')
        cy.get('#dimensions').click()
        cy.go('back')
        cy.go('back')
      })
      .then(function () {
        expect(emit.getCall(0)).to.be.calledWith(
          'url:changed',
          'http://localhost:3500/fixtures/generic.html',
        )

        expect(emit.getCall(1)).to.be.calledWith(
          'url:changed',
          'http://localhost:3500/fixtures/generic.html#hashchange',
        )

        expect(emit.getCall(2)).to.be.calledWith(
          'url:changed',
          'http://localhost:3500/fixtures/generic.html',
        )

        expect(emit.getCall(3)).to.be.calledWith(
          'url:changed',
          'http://localhost:3500/fixtures/generic.html#hashchange',
        )

        expect(emit.getCall(4)).to.be.calledWith(
          'url:changed',
          'http://localhost:3500/fixtures/dimensions.html',
        )

        expect(emit.getCall(5)).to.be.calledWith(
          'url:changed',
          'http://localhost:3500/fixtures/generic.html#hashchange',
        )

        expect(emit.getCall(6)).to.be.calledWith(
          'url:changed',
          'http://localhost:3500/fixtures/generic.html',
        )

        expect(emit.callCount).to.eq(7)
      })
    })

    it('removes listeners', () => {
      cy
      .visit('/fixtures/generic.html')
      .visit('/fixtures/jquery.html')
      .then(() => {
        const winLoadListeners = cy.listeners('window:load')
        const beforeWinUnloadListeners = cy.listeners('window:before:unload')

        const cyOn = cy.spy(cy, 'once')

        const winLoad = cyOn.withArgs('window:load')
        const beforeWinUnload = cyOn.withArgs('window:before:unload')

        cy.go('back').then(() => {
          expect(winLoad).to.be.calledOnce
          expect(beforeWinUnload).to.be.calledOnce

          expect(cy.listeners('window:load')).to.deep.eq(winLoadListeners)
          expect(cy.listeners('window:before:unload')).to.deep.eq(beforeWinUnloadListeners)
        })
      })
    })

    it('fires stability:changed and window events events', () => {
      const stub1 = cy.stub()
      const stub2 = cy.stub()
      const stub3 = cy.stub()

      cy
      .visit('/fixtures/generic.html')
      .visit('/fixtures/jquery.html')
      .then(() => {
        cy.on('stability:changed', stub1)
        cy.on('window:before:unload', stub2)
        cy.on('window:unload', stub3)
      })
      .go('back').then(() => {
        expect(stub1.getCall(0)).to.be.calledWith(false, 'beforeunload')
        expect(stub1.getCall(1)).to.be.calledWith(true, 'load')
        expect(stub2).to.be.calledOnce
        expect(stub3).to.be.calledOnce
      })
    })

    it('removes listeners from window', () => {
      cy
      .visit('/fixtures/generic.html')
      .visit('/fixtures/jquery.html')
      .then((win) => {
        const rel = cy.stub(win, 'removeEventListener')

        cy.go('back').then(() => {
          expect(rel).to.be.calledWith('beforeunload')
          expect(rel).to.be.calledWith('unload')
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 50,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'go') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      _.each([null, undefined, NaN, Infinity, {}, [], () => {}], (val) => {
        it(`throws on: '${val}'`, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.eq('`cy.go()` accepts only a string or number argument')
            expect(err.docsUrl).to.eq('https://on.cypress.io/go')

            done()
          })

          // @ts-expect-error - invalid argument
          cy.go(val)
        })
      })

      it('throws on invalid string', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.go()` accepts either `forward` or `back`. You passed: `foo`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/go')

          done()
        })

        // @ts-expect-error - invalid direction
        cy.go('foo')
      })

      it('throws on zero', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.go()` cannot accept `0`. The number must be greater or less than `0`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/go')

          done()
        })

        cy.go(0)
      })

      it('throws when go times out', (done) => {
        cy.timeout(1000)

        cy
        .visit('/timeout?ms=100')
        .visit('/fixtures/jquery.html')
        .then(() => {
          let expected = false

          // wait until the window finishes loading first
          // else we can potentially move onto the next test
          // while we're still unstable, which will result in
          // properties on the window being inaccessible
          // since we only visit once at the beginning of these tests
          cy.on('window:load', () => {
            expect(expected).to.be.true

            done()
          })

          cy.on('fail', (err) => {
            expected = true

            expect(err.message).to.include('Your page did not fire its `load` event within `1ms`.')
          })

          cy.go('back', { timeout: 1 })
        })
      })

      it('only logs once on error', function (done) {
        cy.timeout(1000)

        cy
        .visit('/fixtures/generic.html')
        .visit('/fixtures/jquery.html')
        .then(() => {
          let failed = false

          cy.on('window:load', () => {
            done(failed ? undefined : new Error('the page loaded before cy.go() failed'))
          })

          cy.once('fail', (err) => {
            failed = true

            assertLogLength(this.logs, 1)
            expect(this.logs[0].get('error')).to.eq(err)
          })

          cy.go('back', { timeout: 1 })
        })
      })
    })

    describe('.log', () => {
      beforeEach(() => {
        cy.visit('/fixtures/generic.html').then(function () {
          this.logs = []

          cy.on('log:added', (attrs, log) => {
            if (attrs.name === 'go') {
              this.lastLog = log
            }

            this.logs.push(log)
          })

          return null
        })
      })

      it('logs go', () => {
        cy
        .visit('/fixtures/jquery.html')
        .go('back').then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('go')
          expect(lastLog.get('message')).to.eq('back')
        })
      })

      it('can turn off logging when protocol is disabled', function () {
        cy.state('isProtocolEnabled', false)
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy
        .visit('/fixtures/jquery.html')
        .go('back', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', function () {
        cy.state('isProtocolEnabled', true)
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy
        .visit('/fixtures/jquery.html')
        .go('back', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog.get('name'), 'log name').to.eq('go')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(2)
        })
      })

      it('does not log \'Page Load\' events', () => {
        cy
        .visit('/fixtures/jquery.html')
        .go('back').then(function () {
          this.logs.slice(0).forEach((log) => {
            expect(log.get('name')).not.eq('page load')
          })
        })
      })

      it('logs before + after', () => {
        let beforeunload = false

        cy
        .visit('/fixtures/jquery.html')
        .window().then(function (win) {
          cy.on('window:before:unload', () => {
            const { lastLog } = this

            beforeunload = true
            expect(lastLog.get('snapshots').length).to.eq(1)
            expect(lastLog.get('snapshots')[0].name).to.eq('before')
            expect(lastLog.get('snapshots')[0].body).to.be.an('object')

            return undefined
          })

          cy.go('back').then(function () {
            const { lastLog } = this

            expect(beforeunload).to.be.true
            expect(lastLog.get('snapshots').length).to.eq(2)
            expect(lastLog.get('snapshots')[1].name).to.eq('after')
            expect(lastLog.get('snapshots')[1].body).to.be.an('object')
          })
        })
      })
    })
  })
})
