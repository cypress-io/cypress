const { EventEmitter } = require('events')
const _ = Cypress._

const itHandlesFileOpening = (containerSelector) => {
  beforeEach(function () {
    cy.stub(this.runner, 'emit').callThrough()
    this.setError(this.commandErr)
  })

  describe('when user has already set opener and opens file', function () {
    beforeEach(function () {
      this.editor = {}

      this.runner.emit.withArgs('get:user:editor').yields({
        preferredOpener: this.editor,
      })

      cy.contains('View stack trace').click()
    })

    it('opens in preferred opener', function () {
      cy.get(`${containerSelector} a`).first().click().then(() => {
        expect(this.runner.emit).to.be.calledWith('open:file', {
          where: this.editor,
          file: '/me/dev/my/app.js',
          line: 2,
          column: 7,
        })
      })
    })
  })

  describe('when user has not already set opener and opens file', function () {
    const availableEditors = [
      { id: 'computer', name: 'On Computer', isOther: false, openerId: 'computer' },
      { id: 'atom', name: 'Atom', isOther: false, openerId: 'atom' },
      { id: 'vim', name: 'Vim', isOther: false, openerId: 'vim' },
      { id: 'sublime', name: 'Sublime Text', isOther: false, openerId: 'sublime' },
      { id: 'vscode', name: 'Visual Studio Code', isOther: false, openerId: 'vscode' },
      { id: 'other', name: 'Other', isOther: true, openerId: '' },
    ]

    beforeEach(function () {
      this.runner.emit.withArgs('get:user:editor').yields({ availableEditors })
      // usual viewport of only reporter is a bit cramped for the modal
      cy.viewport(600, 600)
      cy.contains('View stack trace').click()
      cy.get(`${containerSelector} a`).first().click()
    })

    it('opens modal with available editors', function () {
      _.each(availableEditors, ({ name }) => {
        cy.contains(name)
      })

      cy.contains('Other')
      cy.contains('Set preference and open file')
    })

    // NOTE: this fails because mobx doesn't make the editors observable, so
    // the changes to the path don't bubble up correctly. this only happens
    // in the Cypress test and not when running the actual app
    it.skip('updates "Other" path when typed into', function () {
      cy.contains('Other').find('input[type="text"]').type('/path/to/editor')
      .should('have.value', '/path/to/editor')
    })

    describe('when editor is not selected', function () {
      it('disables submit button', function () {
        cy.contains('Set preference and open file')
        .should('have.class', 'is-disabled')
        .click()

        cy.wrap(this.runner.emit).should('not.to.be.calledWith', 'set:user:editor')
        cy.wrap(this.runner.emit).should('not.to.be.calledWith', 'open:file')
      })

      it('shows validation message when hovering over submit button', function () {
        cy.get('.editor-picker-modal .submit').trigger('mouseover')
        cy.get('.cy-tooltip').should('have.text', 'Please select a preference')
      })
    })

    describe('when Other is selected but path is not entered', function () {
      beforeEach(function () {
        cy.contains('Other').click()
      })

      it('disables submit button', function () {
        cy.contains('Set preference and open file')
        .should('have.class', 'is-disabled')
        .click()

        cy.wrap(this.runner.emit).should('not.to.be.calledWith', 'set:user:editor')
        cy.wrap(this.runner.emit).should('not.to.be.calledWith', 'open:file')
      })

      it('shows validation message when hovering over submit button', function () {
        cy.get('.editor-picker-modal .submit').trigger('mouseover')
        cy.get('.cy-tooltip').should('have.text', 'Please enter the path for the "Other" editor')
      })
    })

    describe('when editor is set', function () {
      beforeEach(function () {
        cy.contains('Visual Studio Code').click()
        cy.contains('Set preference and open file').click()
      })

      it('closes modal', function () {
        cy.contains('Set preference and open file').should('not.be.visible')
      })

      it('emits set:user:editor', function () {
        expect(this.runner.emit).to.be.calledWith('set:user:editor', availableEditors[4])
      })

      it('opens file in selected editor', function () {
        expect(this.runner.emit).to.be.calledWith('open:file', {
          where: availableEditors[4],
          file: '/me/dev/my/app.js',
          line: 2,
          column: 7,
        })
      })
    })
  })
}

describe('test errors', function () {
  beforeEach(function () {
    cy.fixture('runnables_error').as('runnablesErr')

    this.commandErr = {
      name: 'CommandError',
      message: '`foo` \\`bar\\` **baz** *fizz* ** buzz **',
      stack: `Some Error
        at foo.bar (my/app.js:2:7)
          at baz.qux (cypress/integration/foo_spec.js:5:2)
      From previous event:
        at bar.baz (my/app.js:8:11)
      `,
      parsedStack: [{
        message: 'Some Error',
        whitespace: '',
      }, {
        message: '',
        whitespace: '',
      }, {
        message: 'Message line below blank line',
        whitespace: '  ',
      }, {
        originalFile: 'my/app.js',
        relativeFile: 'my/app.js',
        absoluteFile: '/me/dev/my/app.js',
        function: 'foo.bar',
        line: 2,
        column: 7,
        whitespace: '  ',
      }, {
        originalFile: 'cypress/integration/foo_spec.js',
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
        originalFile: 'my/app.js',
        relativeFile: 'my/app.js',
        absoluteFile: '/me/dev/my/app.js',
        function: 'bar.baz',
        line: 8,
        column: 11,
        whitespace: '    ',
      }, {
        originalFile: 'cypress://../driver/src/cypress/runner.js',
        relativeFile: 'cypress://../driver/src/cypress/runner.js',
        absoluteFile: 'cypress://../driver/src/cypress/runner.js',
        function: 'callFn',
        line: 9,
        column: 12,
        whitespace: '    ',
      }, {
        originalFile: 'http://localhost:12345/__cypress/runner/cypress_runner.js',
        relativeFile: 'http://localhost:12345/__cypress/runner/cypress_runner.js',
        absoluteFile: 'http://localhost:12345/__cypress/runner/cypress_runner.js',
        function: 'throwErr',
        line: 10,
        column: 13,
        whitespace: '    ',
      }, {
        message: 'From Node.js Internals:',
        whitespace: '  ',
      }, {
        originalFile: 'events.js',
        relativeFile: 'events.js',
        absoluteFile: 'events.js',
        function: 'emit',
        line: 11,
        column: 14,
        whitespace: '    ',
      }, {
        originalFile: 'some/node/internals.js',
        relativeFile: 'some/node/internals.js',
        absoluteFile: '/user/path/to/node/some/node/internals.js',
        function: 'writeFile',
        line: 12,
        column: 15,
        whitespace: '    ',
      }],
      docsUrl: 'https://on.cypress.io/type',
      codeFrame: {
        originalFile: 'my/app.js',
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

    it('pairs down stack line whitespace', function () {
      cy.contains('View stack trace').click()

      cy.get('.runnable-err-stack-trace').within(() => {
        cy.get('.err-stack-line')
        .should('have.length', 9)
        .first().should('have.text', 'at foo.bar (my/app.js:2:7)')

        cy.get('.err-stack-line')
        .eq(1).should('have.text', '  at baz.qux (cypress/integration/foo_spec.js:5:2)')

        cy.get('.err-stack-line')
        .eq(2).should('have.text', 'At previous event:')

        cy.get('.err-stack-line')
        .eq(3).should('have.text', '  at bar.baz (my/app.js:8:11)')

        cy.get('.err-stack-line')
        .eq(4).should('have.text', '  at callFn (cypress://../driver/src/cypress/runner.js:9:12)')
      })
    })

    it('does not include message in stack trace', function () {
      cy.contains('View stack trace').click()
      cy.get('.runnable-err-stack-trace')
      .invoke('text')
      .should('not.include', 'Some Error')
      .should('not.include', 'Message line below blank line')
    })

    it('turns files into links', function () {
      cy.contains('View stack trace').click()

      cy.get('.runnable-err-stack-trace .runnable-err-file-path')
      .should('have.length', 3)
      .first()
      .should('have.text', 'my/app.js:2:7')

      cy.get('.runnable-err-stack-trace .runnable-err-file-path').eq(1)
      .should('have.text', 'cypress/integration/foo_spec.js:5:2')
    })

    it('does not turn cypress:// files into links', function () {
      cy.contains('View stack trace').click()
      cy.contains('cypress://').find('a').should('not.exist')
    })

    it('does not turn cypress_runner.js files into links', function () {
      cy.contains('View stack trace').click()
      cy.contains('cypress_runner.js').find('a').should('not.exist')
    })

    it('does not turn anything after "From Node.js Internals" into links', function () {
      cy.contains('View stack trace').click()
      cy.contains('events.js').find('a').should('not.exist')
      cy.contains('node/internals.js').find('a').should('not.exist')
    })

    it('does not collapse test when clicking', () => {
      cy.contains('View stack trace').click()
      cy.get('.command-wrapper').should('be.visible')
    })

    itHandlesFileOpening('.runnable-err-stack-trace')
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

  describe('code frames', function () {
    it('shows code frame when included on error', function () {
      this.setError(this.commandErr)

      cy
      .get('.test-err-code-frame')
      .should('be.visible')
    })

    it('does not show code frame when not included on error', function () {
      this.commandErr.codeFrame = undefined
      this.setError(this.commandErr)

      cy
      .get('.test-err-code-frame')
      .should('not.be.visible')
    })

    it('use correct language class', function () {
      this.setError(this.commandErr)

      cy
      .get('.test-err-code-frame pre')
      .should('have.class', 'language-javascript')
    })

    it('falls back to text language class', function () {
      this.commandErr.codeFrame.language = null
      this.setError(this.commandErr)

      cy
      .get('.test-err-code-frame pre')
      .should('have.class', 'language-text')
    })

    itHandlesFileOpening('.test-err-code-frame')
  })
})
