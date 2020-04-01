/* eslint-disable
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {
  Promise,
} = Cypress

describe('src/cy/commands/debugging', function () {
  context('#debug', function () {
    beforeEach(function () {
      this.utilsLog = cy.stub(Cypress.utils, 'log')
    })

    it('does not change the subject', () => cy.wrap({}).debug().then((subject) => expect(subject).to.deep.eq({})))

    it('logs current subject', function () {
      const obj = { foo: 'bar' }

      return cy.wrap(obj).its('foo').debug().then(function () {
        return expect(this.utilsLog).to.be.calledWithMatch('Current Subject: ', 'bar')
      })
    })

    it('logs previous command', () => {
      return cy.wrap({}).debug().then(function () {
        expect(this.utilsLog).to.be.calledWithMatch('Command Name: ', 'wrap')
        expect(this.utilsLog).to.be.calledWithMatch('Command Args: ', [{}])

        return expect(this.utilsLog).to.be.calledWithMatch('Current Subject: ', {})
      })
    })

    it('logs undefined on being parent', () => {
      return cy.debug().then(function () {
        expect(this.utilsLog).to.be.calledWithMatch('Current Subject: ', undefined)

        return expect(this.utilsLog).to.be.calledWithMatch('Command Name: ', undefined)
      })
    })

    return describe('.log', function () {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'debug') {
            this.lastLog = log
          }
        })

        return null
      })

      return it('can turn off logging', () => {
        return cy
        .wrap([], { log: false })
        .debug({ log: false }).then(function () {
          return expect(this.lastLog).to.be.undefined
        })
      })
    })
  })

  return context('#pause', function () {
    beforeEach(function () {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'pause') {
          this.lastLog = log
        }
      })

      return null
    })

    return it('can pause between each command and skips assertions', function () {
      let expected = false

      cy.once('paused', (name) => {
        // should be pending
        expect(this.lastLog.get('state')).to.eq('pending')

        expect(name).to.eq('wrap')

        cy.once('paused', (name) => {
          expected = true

          expect(name).to.eq('then')

          // resume the rest of the commands so this
          // test ends
          return Cypress.emit('resume:all')
        })

        return Cypress.emit('resume:next')
      })

      return cy.pause().wrap({}).should('deep.eq', {}).then(function () {
        expect(expected).to.be.true

        // should be pending
        expect(this.lastLog.get('state')).to.eq('passed')

        // should no longer have onPaused
        return expect(cy.state('onPaused')).to.be.null
      })
    })
  })
})
