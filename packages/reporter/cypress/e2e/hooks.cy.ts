import { EventEmitter } from 'events'
import { RootRunnable } from '../../src/runnables/runnables-store'
import { addCommand, itHandlesFileOpening } from '../support/utils'

describe('hooks', () => {
  let runner: EventEmitter
  let runnables: RootRunnable

  beforeEach(() => {
    cy.fixture('runnables_hooks').then((_runnables) => {
      runnables = _runnables
    })

    runner = new EventEmitter()

    cy.visit('/').then((win) => {
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

    cy.get('.reporter').then(() => {
      runner.emit('runnables:ready', runnables)
      runner.emit('reporter:start', {})
    })
  })

  describe('general behavior', () => {
    beforeEach(() => {
      cy.contains('test 1').click()
    })

    it('assigns commands to the correct hook', () => {
      cy.contains('before each').closest('.collapsible').find('.command').should('have.length', 2)
      cy.contains('before each').closest('.collapsible').should('contain', 'http://localhost:3000')
      cy.contains('before each').closest('.collapsible').should('contain', '.wrapper')

      cy.contains('test body').closest('.collapsible').find('.command').should('have.length', 1)
      cy.contains('test body').closest('.collapsible').should('contain', '.body')

      cy.contains('after each').closest('.collapsible').find('.command').should('have.length', 1)
      cy.contains('after each').closest('.collapsible').should('contain', '.cleanup')
      cy.percySnapshot()
    })

    it('displays hooks in the correct order', () => {
      const hooks = ['before each', 'test body', 'after each']

      cy.contains('test 1').closest('.runnable').find('.hook-name').each(($name, i) => {
        cy.wrap($name).should('contain', hooks[i])
      })
    })

    it('displays (failed) next to name for failed hooks', () => {
      const err = {
        name: 'CypressError',
        message: 'Could not find element',
        stack: 'Could not find element\n  at foo (bar.js:1:2)',
      }

      runner.emit('test:after:run', { state: 'failed', id: 'r6', failedFromHookId: 'h3', err })

      cy.contains('test 2').closest('.runnable').contains('before each')
      .find('.hook-failed-message')
      .should('be.visible')
    })

    it('does not render (failed) next to name for passed hooks', () => {
      cy.contains('test 1').closest('.runnable').contains('before each')
      .find('.hook-failed-message')
      .should('not.exist')
    })

    describe('expanding/collapsing', () => {
      it('is expanded by default', () => {
        cy.contains('before each').closest('.collapsible').find('.commands-container')
        .should('be.visible')
      })

      it('collapses on click', () => {
        cy.contains('before each').click()
        .closest('.collapsible').find('.commands-container')
        .should('not.exist')
      })

      it('expands on second click', () => {
        cy.contains('before each').click().click()
        .closest('.collapsible').find('.commands-container')
        .should('be.visible')
      })
    })
  })

  describe('duplicate hooks', () => {
    beforeEach(() => {
      cy.contains('test 3').click()
    })

    it('splits different hooks with the same name', () => {
      cy.contains('before all (1)').closest('.collapsible').find('.command').should('have.length', 1)
      cy.contains('before all (1)').closest('.collapsible').should('contain', 'before1')

      cy.contains('before all (2)').closest('.collapsible').find('.command').should('have.length', 1)
      cy.contains('before all (2)').closest('.collapsible').should('contain', 'before2')

      cy.contains('before each (1)').closest('.collapsible').find('.command').should('have.length', 2)
      cy.contains('before each (1)').closest('.collapsible').should('contain', 'http://localhost:3000')
      cy.contains('before each (1)').closest('.collapsible').should('contain', '.wrapper')

      cy.contains('before each (2)').closest('.collapsible').find('.command').should('have.length', 1)
      cy.contains('before each (2)').closest('.collapsible').should('contain', '.header')
    })

    it('does not display hook number when only one', () => {
      cy.get('.hooks-container').should('contain', 'after each')
      cy.get('.hooks-container').should('not.contain', 'after each (1)')
    })
  })

  describe('open hooks in IDE', () => {
    beforeEach(() => {
      cy.contains('test 1').click()
    })

    it('does not display button without hover', () => {
      cy.contains('Open in IDE').should('not.be.visible')
    })

    it('creates button when hook has invocation details', () => {
      cy.contains('before each').closest('.hook-header').should('contain', 'Open in IDE')
    })

    it('creates button when test has invocation details', () => {
      cy.contains('test body').closest('.hook-header').should('contain', 'Open in IDE')
    })

    it('does not create button when hook does not have invocation details', () => {
      cy.contains('after each').closest('.hook-header').should('not.contain', 'Open in IDE')
    })

    describe('handles file opening', () => {
      beforeEach(() => {
        cy.get('.hook-open-in-ide').first().invoke('show')
      })

      itHandlesFileOpening({
        getRunner: () => runner,
        selector: '.hook-open-in-ide',
        file: {
          file: '/absolute/path/to/foo_spec.js',
          column: 4,
          line: 10,
        },
      })
    })
  })

  describe('studio hook', () => {
    it('is not visible when not in studio mode', () => {
      cy.contains('test 1').click()

      cy.contains('studio commands').should('not.exist')
    })

    describe('with studio active', () => {
      beforeEach(() => {
        runner.emit('reporter:start', { studioActive: true })

        cy.contains('test 1').click()
      })

      it('is visible with hook-studio class', () => {
        cy.contains('studio commands').should('exist')
        .closest('.hook-item').should('have.class', 'hook-studio')

        cy.percySnapshot()
      })

      it('is not visible if test failed', () => {
        cy.contains('test 2').closest('.test')
        .contains('studio commands').should('not.exist')
      })

      describe('prompt', () => {
        it('displays by default and disappears once commands are added', () => {
          cy.get('.hook-studio').find('.studio-prompt').should('exist').then(() => {
            addCommand(runner, {
              id: 1,
              hookId: 'r3-studio',
              number: 1,
              name: 'get',
              message: '#studio-command-parent',
              state: 'success',
              isStudio: true,
              type: 'parent',
            })

            addCommand(runner, {
              id: 2,
              hookId: 'r3-studio',
              name: 'click',
              message: '#studio-command-child',
              state: 'success',
              isStudio: true,
              type: 'child',
            })

            cy.get('.hook-studio').find('.studio-prompt').should('not.exist')
          })
        })

        it('displays when there is only a visit command and disappears once additional commands are added', () => {
          addCommand(runner, {
            id: 1,
            hookId: 'r3-studio',
            number: 1,
            name: 'visit',
            message: 'the://url',
            state: 'success',
            type: 'parent',
          })

          cy.get('.hook-studio').find('.studio-prompt').should('exist').then(() => {
            addCommand(runner, {
              id: 2,
              hookId: 'r3-studio',
              number: 2,
              name: 'get',
              message: '#studio-command-parent',
              state: 'success',
              isStudio: true,
              type: 'parent',
            })

            addCommand(runner, {
              id: 3,
              hookId: 'r3-studio',
              name: 'click',
              message: '#studio-command-child',
              state: 'success',
              isStudio: true,
              type: 'child',
            })

            cy.get('.hook-studio').find('.studio-prompt').should('not.exist')
          })
        })

        it('does not display when a failed visit command is added', () => {
          addCommand(runner, {
            id: 1,
            hookId: 'r3-studio',
            number: 1,
            name: 'visit',
            message: 'the://url',
            state: 'failed',
            type: 'parent',
          })

          cy.get('.hook-studio').find('.studio-prompt').should('not.exist')
        })
      })
    })
  })
})
