const { EventEmitter } = require('events')
const _ = Cypress._

const cleanWhitespace = (text) => {
  return text.replace(/\s+/gm, '')
}

const itHandlesFileOpening = (trigger) => {
  it('shows tooltip when file path hovered over', function () {
    this.setError(this.commandErr)

    trigger()
    cy.get('.err-file-options').should('be.visible')
  })

  it('opens the file on computer when clicked', function () {
    cy.spy(this.runner, 'emit')

    this.setError(this.commandErr)

    trigger()
    cy.contains('Open on Computer').click().then(() => {
      expect(this.runner.emit).to.be.calledWith('open:file', {
        where: 'computer',
        file: '/me/dev/my/app.js',
        line: 2,
        column: 7,
        editor: undefined,
      })
    })
  })

  describe('open in editor', function () {
    beforeEach(function () {
      cy.stub(this.runner, 'emit').callThrough()
      this.setError(this.commandErr)
    })

    it('loads editor when clicked', function () {
      trigger()
      cy.contains('Open in Editor').click()
      cy.get('.err-file-options button').eq(1).should('have.class', 'is-loading').then(() => {
        expect(this.runner.emit).to.be.calledWith('get:user:editor')
      })
    })

    describe('when user has already set editor and open file', function () {
      beforeEach(function () {
        this.editor = {}

        this.runner.emit.withArgs('get:user:editor').yields({
          preferredEditor: this.editor,
        })
      })

      it('opens in editor', function () {
        trigger()
        cy.contains('Open in Editor').click().then(() => {
          expect(this.runner.emit).to.be.calledWith('open:file', {
            where: 'editor',
            file: '/me/dev/my/app.js',
            line: 2,
            column: 7,
            editor: this.editor,
          })
        })
      })
    })

    describe('when user has not already set editor and opens file', function () {
      const availableEditors = [
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
      })

      it('opens modal with available editors', function () {
        trigger()
        cy.contains('Open in Editor').click()
        cy.get('.err-file-options').trigger('mouseout', { force: true })

        _.each(availableEditors, ({ name }) => {
          cy.contains(name)
        })

        cy.contains('Other')
        cy.contains('Set editor and open file')
      })

      it('shows error message when user clicks "Set editor and open file" without selecting an editor', function () {
        trigger()
        cy.contains('Open in Editor').click()
        cy.get('.err-file-options').trigger('mouseout', { force: true })
        cy.contains('Set editor and open file').click()

        cy.contains('Set editor and open file').should('be.visible')
        cy.wrap(this.runner.emit).should('not.to.be.calledWith', 'set:user:editor')
        cy.wrap(this.runner.emit).should('not.to.be.calledWith', 'open:file')

        cy.get('.validation-error').should('have.text', 'Please select an editor')
      })

      it('shows error message when user selects "Other" and does not input path', function () {
        trigger()
        cy.contains('Open in Editor').click()
        cy.get('.err-file-options').trigger('mouseout', { force: true })
        cy.contains('Other').click()
        cy.contains('Set editor and open file').click()

        cy.contains('Set editor and open file').should('be.visible')
        cy.wrap(this.runner.emit).should('not.to.be.calledWith', 'set:user:editor')
        cy.wrap(this.runner.emit).should('not.to.be.calledWith', 'open:file')

        cy.get('.validation-error').should('have.text', 'Please enter the path to your editor')
      })

      describe('when editor is set', function () {
        beforeEach(function () {
          trigger()
          cy.contains('Open in Editor').click()
          cy.get('.err-file-options').trigger('mouseout', { force: true })
          cy.contains('Visual Studio Code').click()
          cy.contains('Set editor and open file').click()
        })

        it('closes modal', function () {
          cy.contains('Set editor and open file').should('not.be.visible')
        })

        it('emits set:user:editor', function () {
          expect(this.runner.emit).to.be.calledWith('set:user:editor', availableEditors[3])
        })

        it('opens file in selected editor', function () {
          expect(this.runner.emit).to.be.calledWith('open:file', {
            where: 'editor',
            file: '/me/dev/my/app.js',
            line: 2,
            column: 7,
            editor: availableEditors[3],
          })
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

      cy.get('.runnable-err-stack-trace .runnable-err-file-path')
      .should('have.length', 2)
      .first()
      .should('have.text', 'my/app.js:2:7')

      cy.contains('View stack trace').click()
      cy.get('.runnable-err-stack-trace .runnable-err-file-path').eq(1)
      .should('have.text', 'cypress/integration/foo_spec.js:5:2')
    })

    itHandlesFileOpening(() => {
      cy.contains('View stack trace').click()
      cy.get('.runnable-err-stack-trace .runnable-err-file-path').first().trigger('mouseover')
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

    itHandlesFileOpening(() => {
      cy.get('.test-error-code-frame .runnable-err-file-path > span').trigger('mouseover')
    })
  })
})
