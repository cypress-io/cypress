const { EventEmitter } = require('events')

describe('test errors', function () {
  beforeEach(function () {
    cy.fixture('runnables_error').as('runnablesErr')

    // SET ERROR INFO
    this.setError = function (err) {
      this.runnablesErr.suites[0].tests[0].err = err

      cy.get('.reporter').then(() => {
        this.runner.emit('runnables:ready', this.runnablesErr)

        this.runner.emit('reporter:start', {})
      })
    }

    this.runner = new EventEmitter()

    cy.visit('cypress/support/index.html').then((win) => {
      win.render({
        runner: this.runner,
        specPath: '/foo/bar',
      })
    })
  })

  describe('command error', function () {
    beforeEach(function () {
      this.commandErr = {
        name: 'CommandError',
        message: 'cy.check() can only be called on :checkbox and :radio. Your subject contains a: <form id=\"by-id\">...</form>',
        mdMessage: '`cy.check()` can only be called on `:checkbox` and `:radio`. Your subject contains a: `<form id=\"by-id\">...</form>`',
        stack: 'failed to visit\n\ncould not visit http: //localhost:3000',
        docsUrl: 'https://on.cypress.io/type',
        codeFrames: [
          {
            path: 'users.spec.js',
            line: 5,
            column: 6,
            src: 'cy.get(\'.as - table\')\n.find(\'tbody>tr\').eq(12)\n.find(\'td\').first()\n.find(\'button\').as(\'firstBtn\')\n.then(() => { })',
          },
        ],
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
