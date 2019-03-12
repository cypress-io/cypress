const { $ } = Cypress
const helpers = require('../../support/helpers')

const backupCy = window.cy
const backupCypress = window.Cypress

backupCy.__original__ = true

const assert = (expr, message) => {
  if (!expr) {
    throw new Error(`Assertion Failed: ${message}`)
  }
}

describe('src/cypress/runner', () => {
  beforeEach(function () {
    window.cy = backupCy
    window.Cypress = backupCypress

    cy
    .visit('/fixtures/generic.html')
    .then((autWindow) => {
      delete top.Cypress

      this.Cypress = Cypress.$Cypress.create({})
      this.Cypress.onSpecWindow(autWindow)
      this.Cypress.initialize($('.aut-iframe', top.document))

      window.cy = backupCy
      window.Cypress = backupCypress

      const allStubs = cy.stub().log(false)
      .as('allStubs')

      cy.stub(this.Cypress, 'emit').callsFake(allStubs)
      cy.stub(this.Cypress, 'emitMap').callsFake(allStubs)
      cy.stub(this.Cypress, 'emitThen').callsFake((...args) => {
        allStubs(...args)

        return Promise.resolve()
      })

      backupCypress.mocha.override()

      this.runMochaTests = (obj) => {
        this.Cypress.mocha.override()

        helpers.generateMochaTestsForWin(autWindow, obj)

        this.Cypress.normalizeAll()

        return new Cypress.Promise((resolve) => {
          return this.Cypress.run(resolve)
        })
      }
    })
  })

  describe('a few tests', function () {
    it('fires test:before:run:async twice', function () {
      return this.runMochaTests({
        suites: {
          'suite 1': {
            tests: [{ name: 'test 1', fail: true }],
          },
          'suite 2': {
            hooks: ['before'],
            tests: ['test 2'],
          },
        },
      })
      .then((ret) => {
        assert(ret === 0, `${ret} tests have failed, but should not have`)
      })
    })
  })
})
