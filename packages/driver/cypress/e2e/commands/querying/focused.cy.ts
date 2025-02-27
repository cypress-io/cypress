import { assertLogLength } from '../../../support/utils'

const { _ } = Cypress

describe('src/cy/commands/querying', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  context('#focused', () => {
    it('returns the activeElement', () => {
      const $button = cy.$$('#button')

      $button.get(0).focus()

      expect(cy.state('document').activeElement).to.eq($button.get(0))

      cy.focused().then(($focused) => {
        expect($focused.get(0)).to.eq($button.get(0))
      })
    })

    it('returns null if no activeElement', () => {
      const $button = cy.$$('#button')

      $button.get(0).focus()
      $button.get(0).blur()

      cy.focused().should('not.exist').then(($focused) => {
        expect($focused).to.be.null
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
        cy.on('command:retry', _.after(2, () => {
          cy.$$(':text:first').addClass('focused').focus()
        }))

        cy.focused().should('have.class', 'focused').then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')

          expect(lastLog.get('ended')).to.be.true
        })
      })

      // https://github.com/cypress-io/cypress/issues/409
      it('retries on an elements value', () => {
        const $input = cy.$$('input:first')

        cy.on('command:retry', _.after(2, () => {
          $input.val('1234')

          $input.get(0).focus()
        }))

        cy.focused().should('have.value', '1234').then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')

          expect(lastLog.get('ended')).to.be.true
        })
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.$$('input:first').get(0).focus()

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'focused') {
            this.lastLog = log
          }
        })
      })

      it('is a parent command', () => {
        cy.get('body').focused().then(function () {
          const { lastLog } = this

          expect(lastLog.get('type')).not.to.eq('child')
        })
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.get('body').focused({ log: false })
        .then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.get('body').focused({ log: false })
        .then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog.get('name')).to.eq('focused')
          expect(hiddenLog.get('hidden')).to.be.true
          expect(hiddenLog.get('snapshots')).to.have.length(1)
        })
      })

      it('ends immediately', () => {
        cy.focused().then(function () {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true

          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        cy.focused().then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)

          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('passes in $el', () => {
        cy.get('input:first').focused().then(function ($input) {
          const { lastLog } = this

          expect(lastLog.get('$el')).to.eql($input)
        })
      })

      it('#consoleProps', () => {
        cy.get('input:first').focused().then(function ($input) {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            name: 'focused',
            type: 'command',
            props: {
              Yielded: $input.get(0),
              Elements: 1,
            },
          })
        })
      })

      it('#consoleProps with null element', () => {
        const button = cy.$$('#button')

        button.get(0).focus()
        button.get(0).blur()

        cy.focused().should('not.exist').then(function () {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            name: 'focused',
            type: 'command',
            props: {
              Yielded: '--nothing--',
              Elements: 0,
            },
          })
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

      it('fails waiting for the element to exist', (done) => {
        const button = cy.$$('#button')

        button.get(0).focus()
        button.get(0).blur()

        cy.on('fail', (err) => {
          expect(err.message).to.include('Expected to find element: `focused`, but never found it.')

          done()
        })

        cy.focused()
      })

      it('fails waiting for the focused element not to exist', (done) => {
        cy.$$('input:first').focus()

        cy.on('fail', (err) => {
          expect(err.message).to.include('Expected <input#input> not to exist in the DOM, but it was continuously found.')

          done()
        })

        cy.focused().should('not.exist')
      })

      it('eventually fails the assertion', function (done) {
        cy.$$('input:first').focus()

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(lastLog.get('error').message)
          expect(err.message).not.to.include('undefined')
          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.be.an.instanceof(chai.AssertionError)

          done()
        })

        cy.focused().should('have.class', 'focused')
      })

      it('does not log an additional log on failure', function (done) {
        cy.on('fail', () => {
          assertLogLength(this.logs, 2)

          done()
        })

        cy.focused().should('have.class', 'focused')
      })
    })
  })
})
