const { assertLogLength } = require('../../../support/utils')
const { _, $, Promise } = Cypress

describe('src/cy/commands/actions/submit', () => {
  beforeEach(function () {
    cy.visit('/fixtures/dom.html')
  })

  context('#submit', () => {
    it('does not change the subject when default actions is prevented', () => {
      const form = cy.$$('form:first').on('submit', () => {
        return false
      })

      cy.get('form:first').submit().then(($form) => {
        expect($form.get(0)).to.eq(form.get(0))
      })
    })

    it('works with native event listeners', () => {
      let submitted = false

      cy.$$('form:first').get(0).addEventListener('submit', () => {
        submitted = true
      })

      cy.get('form:first').submit().then(() => {
        expect(submitted).to.be.true
      })
    })

    it('bubbles up to the window', () => {
      let onsubmitCalled = false

      cy
      .window().then((win) => {
        win.onsubmit = () => {
          onsubmitCalled = true
        }
      })
      .get('form:first').submit().then(() => {
        expect(onsubmitCalled).to.be.true
      })
    })

    it('does not submit the form action is prevented default', (done) => {
      cy.$$('form:first').parent().on('submit', (e) => {
        e.preventDefault()
      })

      cy
      .window()
      .then((win) => {
        const $win = $(win)

        // if we reach beforeunload we know the form
        // has been submitted
        $win.on('beforeunload', () => {
          done(new Error('submit event should not submit the form.'))

          return undefined
        })

        cy.get('form:first').submit().then(() => {
          $win.off('beforeunload')

          done()
        })
      })
    })

    it('does not submit the form action returned false', (done) => {
      cy.$$('form:first').parent().on('submit', (e) => {
        return false
      })

      cy
      .window()
      .then((win) => {
        const $win = $(win)

        // if we reach beforeunload we know the form
        // has been submitted
        $win.on('beforeunload', () => {
          done('submit event should not submit the form.')

          return undefined
        })

        cy.get('form:first').submit().then(() => {
          $win.off('beforeunload')

          done()
        })
      })
    })

    it('actually submits the form.', () => {
      let beforeunload = false

      cy
      .window().then((win) => {
        // if we reach beforeunload we know the form
        // has been submitted
        $(win).on('beforeunload', () => {
          beforeunload = true

          return undefined
        })
      })
      .get('form:first').submit().then(() => {
        expect(beforeunload).to.be.true
      })
    })

    // if we removed our submit handler this would fail.
    it('fires \'form:submitted event\'', () => {
      const $form = cy.$$('form:first')
      // we must rely on isReady already being pending here
      // because the submit method does not trigger beforeunload
      // synchronously.

      let submitted = false

      cy.on('form:submitted', (e) => {
        submitted = true

        expect(e.target).to.eq($form.get(0))
      })

      cy.get('form:first').submit().then(() => {
        expect(submitted).to.be.true
      })
    })

    it('does not fire \'form:submitted\' if default action is prevented', () => {
      let submitted = false

      cy.on('form:submitted', (e) => {
        submitted = true
      })

      cy.$$('form:first').on('submit', (e) => {
        e.preventDefault()
      })

      cy
      .get('form:first').submit().then(() => {
        expect(submitted).to.be.false
      })
    })

    it('delays 50ms before resolving', () => {
      cy.$$('form:first').on('submit', (e) => {
        cy.spy(Promise, 'delay')
      })

      cy.get('form:first').submit().then(() => {
        expect(Promise.delay).to.be.calledWith(50, 'submit')
      })
    })

    it('increases the timeout delta', () => {
      cy.spy(cy, 'timeout')

      cy.get('form:first').submit().then(() => {
        expect(cy.timeout).to.be.calledWith(50, true)
      })
    })

    describe('assertion verification', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'assert') {
            this.lastLog = log
          }
        })

        return null
      })

      it('eventually passes the assertion', () => {
        cy.$$('form:first').submit(function () {
          _.delay(() => {
            $(this).addClass('submitted')
          }, 100)

          return false
        })

        cy.get('form:first').submit().should('have.class', 'submitted').then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')
          expect(lastLog.get('ended')).to.be.true
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 100,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
          this.logs.push(log)
        })

        return null
      })

      it('is a child command', (done) => {
        cy.on('fail', () => {
          done()
        })

        cy.submit()
      })

      it('throws when non dom subject', (done) => {
        cy.on('fail', () => {
          done()
        })

        cy.noop({}).submit()
      })

      it('throws when subject isnt a form', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 2)
          expect(lastLog.get('error')).to.eq(err)
          expect(err.message).to.include('`cy.submit()` can only be called on a `<form>`. Your subject contains a: `<input id="input">`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/submit')

          done()
        })

        cy.get('input').submit()
      })

      it('throws when subject is not in the document', (done) => {
        let submitted = 0

        const form = cy.$$('form:first').submit((e) => {
          submitted += 1
          form.remove()

          return false
        })

        cy.on('fail', (err) => {
          expect(submitted).to.eq(1)
          expect(err.message).to.include('`cy.submit()` failed because the page')

          done()
        })

        cy.get('form:first').submit().submit()
      })

      it('throws when subject is a collection of elements', (done) => {
        const forms = cy.$$('form')

        // make sure we have more than 1 form.
        expect(forms.length).to.be.gt(1)

        cy.on('fail', (err) => {
          expect(err.message).to.include(`\`cy.submit()\` can only be called on a single \`form\`. Your subject contained ${forms.length} \`form\` elements.`)
          expect(err.docsUrl).to.eq('https://on.cypress.io/submit')

          done()
        })

        cy.get('form').submit()
      })

      it('logs once when not dom subject', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        return cy.submit()
      })

      it('eventually fails the assertion', function (done) {
        cy.$$('form:first').submit(() => {
          return false
        })

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(lastLog.get('error').message)
          expect(err.message).not.to.include('undefined')
          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.be.an.instanceof(chai.AssertionError)

          done()
        })

        cy.get('form:first').submit().should('have.class', 'submitted')
      })

      it('does not log an additional log on failure', function (done) {
        cy.$$('form:first').submit(() => {
          return false
        })

        cy.on('fail', () => {
          assertLogLength(this.logs, 3)

          done()
        })

        cy.get('form:first').submit().should('have.class', 'submitted')
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'submit') {
            this.lastLog = log
          }
        })

        return null
      })

      it('logs immediately before resolving', () => {
        const $form = cy.$$('form:first')

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'submit') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('$el').get(0)).to.eq($form.get(0))
          }
        })

        cy.get('form:first').submit()
      })

      it('provides $el', () => {
        cy.$$('form:first').submit(() => {
          return false
        })

        cy.get('form').first().submit().then(function ($form) {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('submit')
          expect(lastLog.get('$el')).to.match($form)
        })
      })

      it('snapshots before submitted', function () {
        let expected = false

        cy.$$('form:first').submit(() => {
          return false
        })

        cy.$$('form').first().submit(() => {
          const { lastLog } = this

          expected = true

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0].name).to.eq('before')
          expect(lastLog.get('snapshots')[0].body).to.be.an('object')
        })

        cy.get('form').first().submit().then(() => {
          expect(expected).to.be.true
        })
      })

      it('snapshots after submitting', () => {
        cy.$$('form:first').submit(() => {
          return false
        })

        cy.get('form').first().submit().then(function ($form) {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(2)
          expect(lastLog.get('snapshots')[1].name).to.eq('after')
          expect(lastLog.get('snapshots')[1].body).to.be.an('object')
        })
      })

      it('#consoleProps', () => {
        cy.$$('form:first').submit(() => {
          return false
        })

        cy.get('form').first().submit().then(function ($form) {
          const { lastLog } = this

          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            name: 'submit',
            type: 'command',
            props: {
              'Applied To': lastLog.get('$el').get(0),
              Elements: 1,
            },
          })
        })
      })
    })
  })
})
