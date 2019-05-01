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
        message: '`foo` \\`bar\\` **baz** *fizz* ** buzz **',
        mdMessage: '`cy.check()` can only be called on `:checkbox` and `:radio`. Your subject contains a: `<form id=\"by-id\">...</form>`',
        stack: 'failed to visit\n\ncould not visit http: //localhost:3000',
        docsUrl: 'https://on.cypress.io/type',
        codeFrames: [
          {
            path: 'users.spec.js',
            line: 5,
            column: 6,
            language: 'javascript',
            src: 'cy.get(\'.as - table\')\n.find(\'tbody>tr\').eq(12)\n.find(\'td\').first()\n.find(\'button\').as(\'firstBtn\')\n.then(() => { })',
          },
        ],
      }

      this.setError(this.commandErr)
    })

    it('shows err name', function () {
      cy.get('.runnbale-err-name').should('contain', this.commandErr.name)
    })

    it('renders and escapes markdown', () => {
      cy.get('.runnable-err-message')

      // renders `foo` as <code>foo</code>
      .contains('code', 'foo')
      .and('not.contain', '`foo`')

      // renders /`bar/` as `bar`
      cy.get('.runnable-err-message')
      .should('contain', '`bar`')

      // renders **baz** as <strong>baz</strong>
      cy.get('.runnable-err-message')
      .contains('strong', 'baz')
      .and('not.contain', '**baz**')

      // renders *fizz* as <em>fizz</em>
      cy.get('.runnable-err-message')
      .contains('em', 'fizz')
      .and('not.contain', '*fizz*')
    })

    it.skip('renders and escapes markdown with leading/trailing whitespace', () => {
      cy.get('.runnable-err-message')

      // https://github.com/cypress-io/cypress/issues/1360
      // renders ** buzz ** as <strong> buzz </strong>
      .contains('code', 'foo')
      .and('not.contain', '`foo`')
    })
  })
})
