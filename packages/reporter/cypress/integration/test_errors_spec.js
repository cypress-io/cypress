const { EventEmitter } = require('events')

describe('test errors', function () {
  beforeEach(function () {
    cy.fixture('errors_runnables').as('runnablesErr')

    this.commandErr = {
      name: 'CommandError',
      message: '`foo` \\`bar\\` **baz** *fizz* ** buzz **',
      mdMessage: '`cy.check()` can only be called on `:checkbox` and `:radio`. Your subject contains a: `<form id=\"by-id\">...</form>`',
      stack: `Some Error
        at foo.bar (my/app.js:2:7)
          at baz.qux (cypress/integration/foo_spec.js:5:2)
      From previous event:
        at bar.baz (my/app.js:8:11)
      `,
      parsedStack: [{
        message: 'Some Error',
      }, {
        relativeFile: 'my/app.js',
        absoluteFile: '/me/dev/my/app.js',
        function: 'foo.bar',
        line: 2,
        column: 7,
        whitespace: '  ',
      }, {
        relativeFile: 'cypress/integration/foo_spec.js',
        absoluteFile: '/me/dev/cypress/integration/foo_spec.js',
        function: 'baz.qux',
        line: 5,
        column: 2,
        whitespace: '    ',
      }, {
        message: 'At previous event:',
        whitespace: '  ',
      }, {
        relativeFile: 'my/app.js',
        absoluteFile: '/me/dev/my/app.js',
        function: 'bar.baz',
        line: 8,
        column: 11,
        whitespace: '    ',
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

  describe('print to console', function () {
    beforeEach(function () {
      this.setError(this.commandErr)
    })

    it('hovering shows tooltip', function () {
      cy.get('.runnable-err-print').trigger('mouseover')
      cy.get('.cy-tooltip').should('have.text', 'Print error to console')
    })

    it('clicking prints to console', function () {
      cy.spy(this.runner, 'emit')
      cy.get('.runnable-err-print').click().should(() => {
        expect(this.runner.emit).to.be.calledWith('runner:console:error')

        const err = this.runner.emit.withArgs('runner:console:error').lastCall.args[1].err

        expect(err.message).to.equal(this.commandErr.message)
        expect(err.stack).to.equal(this.commandErr.stack)
      })
    })

    it('does not collapse test when clicking', () => {
      cy.get('.runnable-err-print').click()
      cy.get('.command-wrapper').should('be.visible')
    })
  })

  describe('stack trace', function () {
    beforeEach(function () {
      this.setError(this.commandErr)
    })

    it('hides stack trace by default', function () {
      cy.get('.runnable-err-stack-trace').should('not.be.visible')
    })

    it('opens stack trace on click', function () {
      cy.contains('View stack trace').click()
      cy.get('.runnable-err-stack-trace').should('be.visible')
    })

    it('does not collapse test when clicking', () => {
      cy.contains('View stack trace').click()
      cy.get('.command-wrapper').should('be.visible')
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
      .then((content) => {
        expect(content).not.to.contain('`foo`')
      })

      // renders /`bar/` as `bar`
      cy.get('.runnable-err-message')
      .should('contain', '`bar`')

      // renders **baz** as <strong>baz</strong>
      cy.get('.runnable-err-message')
      .contains('strong', 'baz')
      .then((content) => {
        expect(content).not.to.contain('**baz**')
      })

      // renders *fizz* as <em>fizz</em>
      cy.get('.runnable-err-message')
      .contains('em', 'fizz')
      .then((content) => {
        expect(content).not.to.contain('*fizz*')
      })
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
})
