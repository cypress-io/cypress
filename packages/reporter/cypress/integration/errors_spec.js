const { EventEmitter } = require('events')

describe('test errors', function () {
  beforeEach(function () {
    cy.fixture('errors_runnables').as('runnablesErr')

    // SET ERROR INFO
    this.setError = function (err) {
      this.runnablesErr.suites[0].tests[0].err = err

      cy.get('.reporter').then(() => {
        this.runner.emit('runnables:ready', this.runnablesErr)

        this.runner.emit('reporter:start', {})
      })
    }

    this.runner = new EventEmitter()

    cy.visit('/dist').then((win) => {
      win.render({
        runner: this.runner,
        specPath: '/foo/bar',
      })
    })
  })

  describe('command error', function () {
    beforeEach(function () {
      this.commandErr = {
        name: 'CypressError',
        message: 'cy.click() failed because this element:\n\n<button id="covered-button"></button>\n\nis being covered by another element:\n\n<span id="button-cover"></span>\n\nFix this problem, or use {force: true} to disable error checking.\n\nhttps://on.cypress.io/element-cannot-be-interacted-with',
      }

      this.setError(this.commandErr)
    })

    it('renders message and escapes html', () => {
      cy.get('.test-error')
      .should('contain', 'cy.click()')
      .and('contain', '<button id="covered-button"></button>')
      .and('contain', '<span id="button-cover"></span>')
      .and('contain', 'https://on.cypress.io/element-cannot-be-interacted-with')
    })
  })
})
