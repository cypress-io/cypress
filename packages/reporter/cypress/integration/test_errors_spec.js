const { EventEmitter } = require('events')

const cleanWhitespace = (text) => {
  return text.replace(/\s+/gm, '')
}

describe('test errors', function () {
  beforeEach(function () {
    cy.fixture('runnables_error').as('runnablesErr')

    this.commandErr = {
      name: 'CommandError',
      message: '`foo` \\`bar\\` **baz** *fizz* ** buzz **',
      mdMessage: '`cy.check()` can only be called on `:checkbox` and `:radio`. Your subject contains a: `<form id=\"by-id\">...</form>`',
      stack: `Some Error
      at foo.bar (my/app.js:2:7)
      at baz.qux (cypress/integration/foo_spec.js:5:2)
      `,
      parsedStack: [{
        message: 'Some Error',
      }, {
        relativeFile: 'my/app.js',
        absoluteFile: '/me/dev/my/app.js',
        function: 'foo.bar',
        line: 2,
        column: 7,
      }, {
        relativeFile: 'cypress/integration/foo_spec.js',
        absoluteFile: '/me/dev/cypress/integration/foo_spec.js',
        function: 'baz.qux',
        line: 5,
        column: 2,
      }],
      docsUrl: 'https://on.cypress.io/type',
      codeFrame: {
        relativeFile: 'my/app.js',
        absoluteFile: '/me/dev/my/app.js',
        line: 2,
        column: 7,
        language: 'javascript',
        frame: 'cy.get(\'.as - table\')\n.find(\'tbody>tr\').eq(12)\n.find(\'td\').first()\n.find(\'button\').as(\'firstBtn\')\n.then(() => { })',
      },
    }

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
        config: {
          projectRoot: '/root',
        },
      })
    })
  })

  describe('stack trace', function () {
    it('hides stack trace by default', function () {
      this.setError(this.commandErr)

      cy.get('.runnable-err-stack-trace').should('not.be.visible')
    })

    it('opens stack trace on click', function () {
      this.setError(this.commandErr)

      cy.contains('View stack trace').click()
      cy.get('.runnable-err-stack-trace')
      .should('be.visible')
      .invoke('text')
      .should((content) => {
        expect(cleanWhitespace(content)).to.equal(cleanWhitespace(this.commandErr.stack))
      })
    })

    it('turns files into links', function () {
      this.setError(this.commandErr)

      cy.get('.runnable-err-stack-trace a')
      .should('have.length', 2)
      .first()
      .should('have.text', 'my/app.js:2:7')

      cy.contains('View stack trace').click()
      cy.get('.runnable-err-stack-trace a').eq(1)
      .should('have.text', 'cypress/integration/foo_spec.js:5:2')
    })

    it('opens the file when clicked', function () {
      cy.spy(this.runner, 'emit')

      this.setError(this.commandErr)

      cy.contains('View stack trace').click()
      cy.get('.runnable-err-stack-trace a').first().click().then(() => {
        expect(this.runner.emit).to.be.calledWith('open:file', {
          file: '/me/dev/my/app.js',
          line: 2,
          column: 7,
        })
      })
    })
  })

  describe('command error', function () {
    it('shows error name', function () {
      this.setError(this.commandErr)

      cy.get('.runnable-err-name').should('contain', this.commandErr.name)
    })

    it('renders and escapes markdown', function () {
      this.setError(this.commandErr)

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

    // NOTE: still needs to be implemented
    it.skip('renders and escapes markdown with leading/trailing whitespace', () => {
      cy.get('.runnable-err-message')

      // https://github.com/cypress-io/cypress/issues/1360
      // renders ** buzz ** as <strong> buzz </strong>
      .contains('code', 'foo')
      .and('not.contain', '`foo`')
    })
  })

  describe('code frames', function () {
    it('shows code frame when included on error', function () {
      this.setError(this.commandErr)

      cy
      .get('.test-error-code-frame')
      .should('be.visible')
    })

    it('does not show code frame when not included on error', function () {
      this.commandErr.codeFrame = undefined
      this.setError(this.commandErr)

      cy
      .get('.test-error-code-frame')
      .should('not.be.visible')
    })

    it('use correct language class', function () {
      this.setError(this.commandErr)

      cy
      .get('.test-error-code-frame pre')
      .should('have.class', 'language-javascript')
    })

    it('falls back to text language class', function () {
      this.commandErr.codeFrame.language = null
      this.setError(this.commandErr)

      cy
      .get('.test-error-code-frame pre')
      .should('have.class', 'language-text')
    })
  })
})
