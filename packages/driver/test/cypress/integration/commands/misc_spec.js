const { _, $, dom } = Cypress

describe('src/cy/commands/misc', () => {
  before(() => {
    cy
    .visit('/fixtures/jquery.html')
    .then(function (win) {
      this.body = win.document.body.outerHTML
    })
  })

  beforeEach(function () {
    const doc = cy.state('document')

    $(doc.body).empty().html(this.body)
  })

  context('#end', () => {
    it('nulls out the subject', () => {
      cy.noop({}).end().then((subject) => {
        expect(subject).to.be.null
      })
    })
  })

  context('#log', () => {
    it('nulls out the subject', () => {
      cy.wrap({}).log('foo').then((subject) => {
        expect(subject).to.be.null
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
          this.logs.push(log)
        })

        return null
      })

      it('logs immediately', function (done) {
        cy.on('log:added', (attrs, log) => {
          cy.removeAllListeners('log:added')

          expect(log.get('message')).to.eq('foo, {foo: bar}')
          expect(log.get('name')).to.eq('log')
          expect(log.get('end')).to.be.true

          done()
        })

        cy.log('foo', { foo: 'bar' }).then(() => {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true
          expect(lastLog.get('snapshots').length).to.eq(1)

          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('consoleProps', () => {
        return cy.log('foobarbaz', [{}]).then(function () {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            Command: 'log',
            args: [{}],
            message: 'foobarbaz',
          })
        })
      })
    })
  })

  context('#wrap', () => {
    beforeEach(function () {
      this.remoteWindow = cy.state('window')

      delete this.remoteWindow.$.fn.foo
    })

    it('sets the subject to the first argument', () => {
      cy.wrap({}).then((subject) => {
        expect(subject).to.deep.eq({})
      })
    })

    // https://github.com/cypress-io/cypress/issues/3241
    it('cy.wrap(undefined) should retry', () => {
      const stub = cy.stub()

      cy.wrap().should(() => {
        stub()

        expect(stub).to.be.calledTwice
      })

      cy.wrap(undefined).should(() => {
        stub()

        expect(stub.callCount).to.eq(4)
      })
    })

    it('can wrap jquery objects and continue to chain', function () {
      this.remoteWindow.$.fn.foo = 'foo'

      const append = () => {
        setTimeout(() => {
          $('<li class=\'appended\'>appended</li>').appendTo(cy.$$('#list'))
        }, 50)
      }

      cy.on('command:retry', _.after(2, _.once(append)))

      cy.get('#list').then(($ul) => {
        cy
        // ensure that assertions are based on the real subject
        // and not the cy subject - therefore foo should be defined
        .wrap($ul).should('have.property', 'foo')

        // then re-wrap $ul and ensure that the subject passed
        // downstream is the cypress instance
        .wrap($ul)
        .find('li.appended')
        .then(($li) => {
          // must use explicit non cy.should
          // else this test will always pass
          expect($li.length).to.eq(1)
        })
      })
    })

    // TODO: fix this test in 4.0 when we refactor validating subjects
    it.skip('throws a good error when wrapping mixed types: element + string', () => {
      cy.get('button').then(($btn) => {
        const btn = $btn.get(0)

        cy.wrap([btn, 'asdf']).click()
      })
    })

    it('can wrap an array of DOM elements and pass command validation', () => {
      cy.get('button').then(($btn) => {
        const btn = $btn.get(0)

        cy.wrap([btn]).click().then(($btn) => {
          expect(dom.isJquery($btn)).to.be.true
        })

        cy.wrap([btn, btn]).click({ multiple: true }).then(($btns) => {
          expect(dom.isJquery($btns)).to.be.true
        })
      })
    })

    it('can wrap an array of window without it being altered', () => {
      cy.window().then((win) => {
        cy.wrap([win]).then((arr) => {
          expect(arr).to.be.an('array')
          expect(Array.isArray(arr)).to.be.true
        })
      })
    })

    it('can wrap an array of document without it being altered', () => {
      cy.document().then((doc) => {
        cy.wrap([doc]).then((arr) => {
          expect(arr).to.be.an('array')
          expect(Array.isArray(arr)).to.be.true
          expect(arr[0]).to.eq(doc)
        })
      })
    })

    // https://github.com/cypress-io/cypress/issues/2927
    it('can properly handle objects with \'jquery\' functions as properties', () => {
      // the root issue here has to do with the fact that window.jquery points
      // to the jquery constructor, but not an actual jquery instance and
      // we need to account for that...
      cy.window().then((win) => {
        win.jquery = function () {}

        return win
      })
    })

    it('can extend the default timeout', () => {
      Cypress.config('defaultCommandTimeout', 100)

      const timeoutPromise = new Promise((resolve, reject) => {
        return setTimeout(() => {
          resolve(null)
        })
      }, 200)

      cy.wrap(timeoutPromise, { timeout: 300 })
    })

    describe('errors', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'wrap') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      it('throws when wrapping an array of windows', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.scrollTo()` failed because it requires a DOM element.')
          expect(err.message).to.include('[<window>]')
          expect(err.message).to.include('All 2 subject validations failed on this subject.')

          done()
        })

        cy.window().then((win) => {
          cy.wrap([win]).scrollTo('bottom')
        })
      })

      it('throws when wrapping an array of documents', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.screenshot()` failed because it requires a DOM element.')
          expect(err.message).to.include('[<document>]')
          expect(err.message).to.include('All 3 subject validations failed on this subject.')

          done()
        })

        cy.document().then((doc) => {
          cy.wrap([doc]).screenshot()
        })
      })

      it('throws when exceeding default timeout', function (done) {
        Cypress.config('defaultCommandTimeout', 100)

        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(1)
          expect(err.message).to.include('`cy.wrap()` timed out waiting `100ms` to complete.')
          expect(err.message).to.include('You called `cy.wrap()` with a promise that never resolved.')
          expect(err.message).to.include('To increase the timeout, use `{ timeout: number }`')
          expect(this.lastLog.get('error')).to.eq(err)
          done()
        })

        const timeoutPromise = new Promise((resolve) => {
          setTimeout((() => {
            resolve(null)
          }), 200)
        })

        cy.wrap(timeoutPromise)
      })

      it('throws when exceeding custom timeout', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(1)
          expect(err.message).to.include('`cy.wrap()` timed out waiting `100ms` to complete.')
          expect(err.message).to.include('You called `cy.wrap()` with a promise that never resolved.')
          expect(err.message).to.include('To increase the timeout, use `{ timeout: number }`')
          expect(this.lastLog.get('error')).to.eq(err)
          done()
        })

        const timeoutPromise = new Promise((resolve) => {
          setTimeout((() => {
            resolve(null)
          }), 200)
        })

        cy.wrap(timeoutPromise, { timeout: 100 })
      })

      it('logs once when promise parameter is rejected', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(1)
          expect(err.message).to.include('custom error')
          expect(this.lastLog.get('error')).to.eq(err)
          done()
        })

        const rejectedPromise = new Promise((resolve, reject) => {
          reject(new Error('custom error'))
        })

        cy.wrap(rejectedPromise)
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
          this.logs.push(log)
        })

        return null
      })

      it('logs immediately', function (done) {
        cy.on('log:added', (attrs, log) => {
          cy.removeAllListeners('log:added')

          expect(log.get('message')).to.eq('{}')
          expect(log.get('name')).to.eq('wrap')
          expect(log.get('end')).not.to.be.ok

          done()
        })

        cy.wrap({}).then(() => {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true
          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('stringifies DOM elements and sets $el', () => {
        const body = $('body')

        cy.wrap(body).then(function ($el) {
          const { lastLog } = this

          // internally we store the real remote jquery
          // instance instead of the cypress one
          expect(lastLog.get('$el')).not.to.eq($el)

          // but make sure they are the same DOM object
          expect(lastLog.get('$el').get(0)).to.eq($el.get(0))
          expect(lastLog.get('message')).to.eq('<body>')
        })
      })
    })
  })
})
