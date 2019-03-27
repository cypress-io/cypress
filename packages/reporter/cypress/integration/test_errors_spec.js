const { EventEmitter } = require('events')

describe('test errors', function () {
  beforeEach(function () {
    cy.fixture('runnables_error').as('runnablesErr')

    // SET ERROR INFO
    this.setError = function (err) {
      this.runnablesErr.suites[0].tests[0].err = err
    }

    this.runner = new EventEmitter()

    cy.visit('cypress/support/index.html').then((win) => {
      win.render({
        runner: this.runner,
        specPath: '/foo/bar',
      })
    })

    cy.get('.reporter').then(() => {
      this.runner.emit('runnables:ready', this.runnablesErr)

      this.runner.emit('reporter:start', {})
    })
  })

  describe('command error', function () {
    beforeEach(function () {
      this.commandErr = {
        name: 'CommandError',
        message: 'failed to visit',
        stack: 'failed to visit\n\ncould not visit http: //localhost:3000',
      }

      this.setError(this.commandErr)
    })

    it('shows err name', function () {
      cy.get('.runnbale-err-name').should('contain', this.commandErr.name)
    })

    it('shows err msg', function () {
      cy.get('.runnable-err-message').should('contain', this.commandErr.message)
    })
  })
})
