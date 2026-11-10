import { assertLogLength } from '../../../support/utils'

type FooWindow = Cypress.AUTWindow & { foo?: string }

const { Promise } = Cypress

describe('src/cy/commands/navigation', () => {
  context('#reload', () => {
    beforeEach(function () {
      cy.visit('/fixtures/generic.html')
    })

    it('calls into window.location.reload', () => {
      cy.on('fail', () => {
        expect(Cypress.automation).to.be.calledWith('reload:aut:frame', { forceReload: false })
      })

      cy.stub(Cypress, 'automation').withArgs('reload:aut:frame', { forceReload: false }).resolves()

      cy.reload({ timeout: 1000 })
    })

    it('can pass forceReload + options', () => {
      cy.on('fail', () => {
        expect(Cypress.automation).to.be.calledWith('reload:aut:frame', { forceReload: true })
      })

      cy.stub(Cypress, 'automation').withArgs('reload:aut:frame', { forceReload: true }).resolves()

      cy.reload(true, { timeout: 1000 })
    })

    it('returns the window object', () => {
      cy
      .window().then((oldWin: FooWindow) => {
        oldWin.foo = 'bar'
        expect(oldWin.foo).to.eq('bar')

        cy.reload().then((win: FooWindow) => {
          expect(win).not.to.be.undefined
          expect(win.foo).to.be.undefined

          expect(win).to.eq(cy.state('window'))
        })
      })
    })

    // https://github.com/cypress-io/cypress/issues/7598
    // cy.reload() is just window.location.reload(), and per the WHATWG HTML
    // Storage standard both localStorage and sessionStorage persist across a
    // reload (localStorage lives for the origin; sessionStorage lives for the
    // top-level traversable's session), so a reload must not clear them.
    // https://html.spec.whatwg.org/multipage/webstorage.html#the-localstorage-attribute
    // https://html.spec.whatwg.org/multipage/webstorage.html#the-sessionstorage-attribute
    it('preserves localStorage and sessionStorage across the reload', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('reload-local', 'persisted')
        win.sessionStorage.setItem('reload-session', 'persisted')
      })

      cy.reload()

      cy.window().then((win) => {
        expect(win.localStorage.getItem('reload-local'), 'localStorage').to.eq('persisted')
        expect(win.sessionStorage.getItem('reload-session'), 'sessionStorage').to.eq('persisted')
      })
    })

    it('removes window:load listeners', () => {
      const listeners = cy.listeners('window:load')

      const winLoad = cy.spy(cy, 'once').withArgs('window:load')

      cy.reload().then(() => {
        expect(winLoad).to.be.calledOnce
        expect(cy.listeners('window:load')).to.deep.eq(listeners)
      })
    })

    // TODO: fix this
    it('sets timeout to Cypress.config(pageLoadTimeout)', {
      pageLoadTimeout: 4567,
    }, () => {
      const timeout = cy.spy(Promise.prototype, 'timeout')

      cy.reload().then(() => {
        expect(timeout).to.be.calledWith(4567, 'reload')
      })
    })

    it('fires stability:changed and window events events', () => {
      const stub1 = cy.stub()
      const stub2 = cy.stub()
      const stub3 = cy.stub()

      cy.on('stability:changed', stub1)
      cy.on('window:before:unload', stub2)
      cy.on('window:unload', stub3)

      cy.reload().then(() => {
        expect(stub1.getCall(0)).to.be.calledWith(false, 'beforeunload')
        expect(stub1.getCall(1)).to.be.calledWith(true, 'load')
        expect(stub2).to.be.calledOnce
        expect(stub3).to.be.calledOnce
      })
    })

    it('removes listeners', () => {
      const win = cy.state('window')

      const rel = cy.stub(win, 'removeEventListener')

      cy.reload().then(() => {
        expect(rel).to.be.calledWith('beforeunload')
        expect(rel).to.be.calledWith('unload')
      })
    })

    describe('errors', {
      defaultCommandTimeout: 100,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
          this.logs?.push(log)
        })

        return null
      })

      it('logs once on failure', {
        defaultCommandTimeout: 200,
      }, function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)

          done()
        })

        // @ts-expect-error - invalid argument
        cy.reload(Infinity)
      })

      it('throws passing more than 2 args', {
        defaultCommandTimeout: 1000,
      }, (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.reload()` can only accept a boolean or `options` as its arguments.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/reload')

          done()
        })

        // @ts-expect-error - too many arguments
        cy.reload(1, 2, 3)
      })

      it('throws passing 2 invalid arguments', { defaultCommandTimeout: 200, retries: 1 }, (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.reload()` can only accept a boolean or `options` as its arguments.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/reload')

          done()
        })

        // @ts-expect-error - invalid arguments
        cy.reload(true, 1)
      })

      it('throws passing 1 invalid argument', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.reload()` can only accept a boolean or `options` as its arguments.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/reload')

          done()
        })

        // @ts-expect-error - invalid argument
        cy.reload(1)
      })

      it('fully refreshes page', () => {
        cy
        .window().then((win: FooWindow) => {
          win.foo = 'foo'
        })
        .reload()
        .window().then((win: FooWindow) => {
          expect(win.foo).to.be.undefined
        })
      })

      it('throws when reload times out', (done) => {
        cy.timeout(1000)
        cy.spy(Cypress.utils, 'locReload')

        cy
        .visit('/timeout?ms=100').then(() => {
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
        })
        .reload({ timeout: 1 })
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'reload') {
            this.lastLog = log
          }

          this.logs.push(log)
        })
      })

      it('logs reload', () => {
        cy.reload().then(function () {
          expect(this.lastLog.get('name')).to.eq('reload')
        })
      })

      it('can turn off logging when protocol is disabled', function () {
        cy.state('isProtocolEnabled', false)
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.reload({ log: false }).then(function () {
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

        cy.reload({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog.get('name'), 'log name').to.eq('reload')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(2)
        })
      })

      it('does not log \'Page Load\' events', () => {
        cy.reload().then(function () {
          this.logs.slice(0).forEach((log) => {
            expect(log.get('name')).not.eq('page load')
          })
        })
      })

      it('logs before + after', () => {
        let beforeunload = false

        cy
        .window().then(function () {
          cy.on('window:before:unload', () => {
            const { lastLog } = this

            beforeunload = true
            expect(lastLog.get('snapshots').length).to.eq(1)
            expect(lastLog.get('snapshots')[0].name).to.eq('before')
            expect(lastLog.get('snapshots')[0].body).to.be.an('object')

            return undefined
          })
        }).reload().then(function () {
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
