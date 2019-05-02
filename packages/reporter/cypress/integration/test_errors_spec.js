const { EventEmitter } = require('events')

describe('test errors', function () {
  beforeEach(function () {
    cy.fixture('runnables_error').as('runnablesErr')

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
        message: '`foo` \\`bar\\` **baz**',
        mdMessage: '`cy.check()` can only be called on `:checkbox` and `:radio`. Your subject contains a: `<form id=\"by-id\">...</form>`',
        stack: 'failed to visit\n\ncould not visit http: //localhost:3000',
        docsUrl: 'https://on.cypress.io/type',
        codeFrames: [
          {
            file: 'users.spec.js',
            line: 5,
            column: 6,
            language: 'javascript',
            frame: 'cy.get(\'.as - table\')\n.find(\'tbody>tr\').eq(12)\n.find(\'td\').first()\n.find(\'button\').as(\'firstBtn\')\n.then(() => { })',
          },
        ],
      }
    })

    it('shows error name', function () {
      this.setError(this.commandErr)

      cy.get('.runnable-err-name').should('contain', this.commandErr.name)
    })

    it('renders and escapes backticks', function () {
      this.setError(this.commandErr)

      cy
      .get('.runnable-err-message')
      .should('contain', '`bar`')
      .and('contain', '**baz**')
      .contains('code', 'foo')
      .and('not.contain', '`foo`')
    })

    it('use correct language class', function () {
      this.setError(this.commandErr)

      cy
      .get('.test-error-code-frame pre')
      .should('have.class', 'language-javascript')
    })

    it('falls back to text language class', function () {
      this.commandErr.codeFrames[0].language = null
      this.setError(this.commandErr)

      cy
      .get('.test-error-code-frame pre')
      .should('have.class', 'language-text')
    })
  })
})
