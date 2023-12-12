import { EventEmitter } from 'events'
import { itHandlesFileOpening } from '../support/utils'
import Err from '../../src/errors/err-model'
import { RootRunnable } from '../../src/runnables/runnables-store'

describe('test errors', () => {
  let commandErr: Partial<Err>
  let setError: Function
  let runnablesWithErr: RootRunnable
  let runner: EventEmitter

  beforeEach(() => {
    cy.fixture('runnables_error').then((_runnablesWithErr) => runnablesWithErr = _runnablesWithErr)
    cy.fixture('command_error').then((_commandErr) => commandErr = _commandErr)

    runner = new EventEmitter()

    cy.visit('/').then((win) => {
      setError = (err: Error) => {
        // @ts-ignore
        runnablesWithErr.suites[0].tests[0].err = err

        cy.get('.reporter').then(() => {
          runner.emit('runnables:ready', runnablesWithErr)
          runner.emit('reporter:start', {})
        })
      }

      win.render({
        runner,
        runnerStore: {
          spec: {
            name: 'foo.js',
            relative: 'relative/path/to/foo.js',
            absolute: '/absolute/path/to/foo.js',
          },
        },
      })
    })
  })

  describe('print to console', () => {
    beforeEach(() => {
      setError(commandErr)
    })

    it('clicking prints to console', () => {
      cy.spy(runner, 'emit')
      cy.get('.runnable-err-print').click().should(() => {
        expect(runner.emit).to.be.calledWith('runner:console:error')

        // @ts-ignore
        const err = runner.emit.withArgs('runner:console:error').lastCall.args[1].err

        expect(err.message).to.equal(commandErr.message)
        expect(err.stack).to.equal(commandErr.stack)
      })
    })

    it('shows popup confirming output was printed', () => {
      cy.get('.runnable-err-print').click()
      cy.contains('Printed output to your console')
    })

    it('does not collapse test when clicking', () => {
      cy.get('.runnable-err-print').click()
      cy.get('.command-wrapper').should('be.visible')
    })

    it('does not expand or collapse stack trace when clicking', () => {
      cy.get('.runnable-err-print').click()
      cy.get('.runnable-err-stack-trace').should('not.exist')
      cy.contains('View stack trace').click()
      cy.get('.runnable-err-stack-trace').should('be.visible')
      cy.get('.runnable-err-print').click()
      cy.get('.runnable-err-stack-trace').should('be.visible')
    })
  })

  describe('stack trace', () => {
    beforeEach(() => {
      setError(commandErr)
    })

    it('does not render stack trace by default', () => {
      cy.get('.runnable-err-stack-trace').should('not.exist')
    })

    it('opens stack trace on click', () => {
      cy.contains('View stack trace').click()
      cy.get('.runnable-err-stack-trace').should('be.visible')
      cy.percySnapshot()
    })

    it('pairs down stack line whitespace', () => {
      cy.contains('View stack trace').click()

      cy.get('.runnable-err-stack-trace').within(() => {
        cy.get('.err-stack-line')
        .should('have.length', 10)
        .first().should('have.text', 'at foo.bar (my/app.js:2:7)')

        cy.get('.err-stack-line')
        .eq(1).should('have.text', '  at baz.qux (cypress/integration/foo_spec.js:5:2)')

        cy.get('.err-stack-line')
        .eq(2).should('have.text', '  at space (cypress/integration/a b.js:34:99)')

        cy.get('.err-stack-line')
        .eq(3).should('have.text', 'At previous event:')

        cy.get('.err-stack-line')
        .eq(4).should('have.text', '  at bar.baz (http://localhost:1234/me/dev/my/app.js:8:11)')

        cy.get('.err-stack-line')
        .eq(5).should('have.text', '  at callFn (cypress://../driver/src/cypress/runner.js:9:12)')
      })
    })

    it('does not include message in stack trace', () => {
      cy.contains('View stack trace').click()
      cy.get('.runnable-err-stack-trace')
      .invoke('text')
      .should('not.include', 'Some Error')
      .should('not.include', 'Message line below blank line')
    })

    it('turns files into links', () => {
      cy.contains('View stack trace').click()

      cy.get('.runnable-err-stack-trace .runnable-err-file-path')
      .should('have.length', 3)
      .first()
      .should('have.text', 'my/app.js:2:7')

      cy.get('.runnable-err-stack-trace .runnable-err-file-path').eq(1)
      .should('have.text', 'cypress/integration/foo_spec.js:5:2')

      cy.get('.runnable-err-stack-trace .runnable-err-file-path').eq(2)
      .should('have.text', 'cypress/integration/a b.js:34:99')
    })

    it('does not turn cypress:// files into links', () => {
      cy.contains('View stack trace').click()
      cy.contains('cypress://').find('a').should('not.exist')
    })

    it('does not turn cypress_runner.js files into links', () => {
      cy.contains('View stack trace').click()
      cy.contains('cypress_runner.js').find('a').should('not.exist')
    })

    it('does not turn lines without absoluteFile into links', () => {
      cy.contains('View stack trace').click()
      cy.contains('.err-stack-line', 'http://localhost:1234/me/dev/my/app.js:8:11')
      .find('a').should('not.exist')
    })

    it('does not turn anything after "From Node.js Internals" into links', () => {
      cy.contains('View stack trace').click()
      cy.contains('events.js').find('a').should('not.exist')
      cy.contains('node/internals.js').find('a').should('not.exist')
    })

    it('does not collapse test when clicking', () => {
      cy.contains('View stack trace').click()
      cy.get('.command-wrapper').should('be.visible')
    })

    it('displays tooltip on hover', () => {
      cy.contains('View stack trace').click()

      cy.get('.runnable-err-stack-trace a').first().trigger('mouseover')
      cy.get('.cy-tooltip').first().should('have.text', 'Open in IDE')
    })

    itHandlesFileOpening({
      getRunner: () => runner,
      selector: '.runnable-err-stack-trace a',
      file: {
        file: '/me/dev/my/app.js',
        line: 2,
        column: 7,
      },
      stackTrace: true,
    })
  })

  describe('command error', () => {
    it('shows error name', () => {
      setError(commandErr)

      cy.get('.runnable-err-name').should('contain', commandErr.name)
    })

    it('renders and escapes markdown', () => {
      setError(commandErr)

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

      cy.percySnapshot()
    })

    it('opens "Learn more" link externally', () => {
      setError(commandErr)

      cy.spy(runner, 'emit')

      cy.get('.runnable-err-message').contains('Learn more').click()
      cy.wrap(runner.emit).should('be.calledWith', 'external:open', 'https://on.cypress.io/type')
    })

    // https://github.com/cypress-io/cypress/issues/28452
    it('does not show br tags in formatted error message', () => {
      setError(commandErr)

      cy.spy(runner, 'emit')

      cy.get('.runnable-err-message').find('br').should('not.exist')
    })

    // NOTE: still needs to be implemented
    it.skip('renders and escapes markdown with leading/trailing whitespace', () => {
      setError(commandErr)
      cy.get('.runnable-err-message')

      // https://github.com/cypress-io/cypress/issues/1360
      // renders ** buzz ** as <strong> buzz </strong>
      .contains('strong', 'buzz')
      .and('not.contain', '** buzz **')
    })
  })

  describe('code frames', () => {
    beforeEach(() => {
      setError(commandErr)
    })

    it('shows code frame when included on error', () => {
      cy
      .get('.test-err-code-frame')
      .should('be.visible')

      cy.percySnapshot()
    })

    it('use correct language class', () => {
      cy
      .get('.test-err-code-frame pre')
      .should('have.class', 'language-javascript')
    })

    it('displays tooltip on hover', () => {
      cy.get('.test-err-code-frame a').first().trigger('mouseover')
      cy.get('.cy-tooltip').first().should('have.text', 'Open in IDE')
    })

    itHandlesFileOpening({
      getRunner: () => runner,
      selector: '.test-err-code-frame a',
      file: {
        file: '/me/dev/my/app.js',
        line: 2,
        column: 7,
      },
    })
  })

  describe('code frames', () => {
    it('does not show code frame when not included on error', () => {
      commandErr.codeFrame = undefined
      setError(commandErr)

      cy
      .get('.test-err-code-frame')
      .should('not.exist')
    })

    it('falls back to text language class', () => {
      // @ts-ignore
      commandErr.codeFrame.language = null
      setError(commandErr)
      cy
      .get('.test-err-code-frame pre')
      .should('have.class', 'language-text')
    })
  })

  describe('studio error', () => {
    beforeEach(() => {
      setError(runnablesWithErr)
    })

    it('is not visible by default', () => {
      cy.get('.studio-err-wrapper').should('not.exist')
    })

    it('is visible when studio is active', () => {
      runner.emit('reporter:start', { studioActive: true })

      cy.get('.studio-err-wrapper').should('exist').should('be.visible')

      cy.percySnapshot()
    })
  })
})
