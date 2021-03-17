import { EventEmitter } from 'events'
import { RootRunnable } from '../../src/runnables/runnables-store'
import { addCommand } from '../support/utils'

describe('tests', () => {
  let runner: EventEmitter
  let runnables: RootRunnable

  beforeEach(() => {
    cy.fixture('runnables').then((_runnables) => {
      runnables = _runnables
    })

    runner = new EventEmitter()

    cy.visit('/').then((win) => {
      win.render({
        runner,
        spec: {
          name: 'foo.js',
          relative: 'relative/path/to/foo.js',
          absolute: '/absolute/path/to/foo.js',
        },
        experimentalStudioEnabled: true,
      })
    })

    cy.get('.reporter').then(() => {
      runner.emit('runnables:ready', runnables)
      runner.emit('reporter:start', {})
    })
  })

  it('includes the class "test"', () => {
    cy.contains('test 1')
    .closest('.runnable')
    .should('have.class', 'test')
  })

  it('includes the state as a class', () => {
    cy.contains('suite 1')
    .closest('.runnable')
    .should('have.class', 'runnable-failed')

    cy.contains('suite 2')
    .closest('.runnable')
    .should('have.class', 'runnable-passed')
  })

  describe('expand and collapse', () => {
    beforeEach(() => {
      cy.contains('test 1')
      .parents('.collapsible').first().as('testWrapper')
    })

    it('is collapsed by default', () => {
      cy.contains('test 1')
      .parents('.collapsible').first()
      .should('not.have.class', 'is-open')
      .find('.collapsible-content')
      .should('not.be.visible')
    })

    it('failed tests expands automatically', () => {
      cy.contains('test 2')
      .parents('.collapsible').first()
      .should('have.class', 'is-open')
      .find('.collapsible-content')
      .should('be.visible')
    })

    it('expands/collapses on click', () => {
      cy.contains('test 1')
      .click()

      cy.get('@testWrapper')
      .should('have.class', 'is-open')
      .find('.collapsible-content').should('be.visible')

      cy.contains('test 1')
      .click()

      cy.get('@testWrapper')
      .should('not.have.class', 'is-open')
      .find('.collapsible-content').should('not.be.visible')
    })

    it('expands/collapses on enter', () => {
      cy.contains('test 1')
      .parents('.collapsible-header').first()
      .focus().type('{enter}')

      cy.get('@testWrapper')
      .should('have.class', 'is-open')
      .find('.collapsible-content').should('be.visible')

      cy.contains('test 1')
      .parents('.collapsible-header').first()
      .focus().type('{enter}')

      cy.get('@testWrapper')
      .should('not.have.class', 'is-open')
      .find('.collapsible-content').should('not.be.visible')
    })

    it('expands/collapses on space', () => {
      cy.contains('test 1')
      .parents('.collapsible-header').first()
      .focus().type(' ')

      cy.get('@testWrapper')
      .should('have.class', 'is-open')
      .find('.collapsible-content').should('be.visible')

      cy.contains('test 1')
      .parents('.collapsible-header').first()
      .focus().type(' ')

      cy.get('@testWrapper')
      .should('not.have.class', 'is-open')
      .find('.collapsible-content').should('not.be.visible')
    })
  })

  describe('studio', () => {
    describe('button', () => {
      it('displays studio icon with half transparency when hovering over test title', () => {
        cy.contains('test 1')
        .closest('.runnable-wrapper')
        .realHover()
        .find('.runnable-controls-studio')
        .should('be.visible')
        .should('have.css', 'opacity', '0.5')
      })

      it('displays studio icon with no transparency and tooltip on hover', () => {
        cy.contains('test 1')
        .closest('.collapsible-header')
        .find('.runnable-controls-studio')
        .realHover()
        .should('be.visible')
        .should('have.css', 'opacity', '1')

        cy.get('.cy-tooltip').contains('Add Commands to Test')
      })

      it('emits studio:init:test with the suite id when studio button clicked', () => {
        cy.stub(runner, 'emit')

        cy.contains('test 1').parents('.collapsible-header')
        .find('.runnable-controls-studio').click()

        cy.wrap(runner.emit).should('be.calledWith', 'studio:init:test', 'r3')
      })
    })

    describe('controls', () => {
      it('is not visible by default', () => {
        cy.contains('test 1').click()
        .parents('.collapsible').first()
        .find('.studio-controls').should('not.exist')
      })

      describe('with studio active', () => {
        beforeEach(() => {
          runner.emit('reporter:start', { studioActive: true })

          cy.contains('test 1').click()
          .parents('.collapsible').first()
          .find('.studio-controls').as('studioControls')
        })

        it('is visible with save button when test passed', () => {
          cy.get('@studioControls').should('be.visible')
          cy.get('@studioControls').find('.studio-save').should('be.visible')

          cy.percySnapshot()
        })

        it('is visible without save button if test failed', () => {
          cy.contains('test 2')
          .parents('.collapsible').first()
          .find('.studio-controls').should('be.visible')

          cy.contains('test 2')
          .parents('.collapsible').first()
          .find('.studio-save').should('not.be.visible')
        })

        it('is visible without save button if test was skipped', () => {
          cy.contains('nested suite 1')
          .parents('.collapsible').first()
          .contains('test 1').click()
          .parents('.collapsible').first()
          .find('.studio-controls').as('pendingControls')
          .should('be.visible')

          cy.get('@pendingControls').find('.studio-save').should('not.be.visible')
        })

        it('is not visible while test is running', () => {
          cy.contains('nested suite 1')
          .parents('.collapsible').first()
          .contains('test 2').click()
          .parents('.collapsible').first()
          .find('.studio-controls').should('not.be.visible')
        })

        it('emits studio:cancel when cancel button clicked', () => {
          cy.stub(runner, 'emit')

          cy.get('@studioControls').find('.studio-cancel').click()

          cy.wrap(runner.emit).should('be.calledWith', 'studio:cancel')
        })

        describe('save button', () => {
          it('is disabled without commands', () => {
            cy.get('@studioControls').find('.studio-save').should('be.disabled')
          })

          it('is enabled when there are commands', () => {
            addCommand(runner, {
              hookId: 'r3-studio',
              name: 'get',
              message: '#studio-command',
              state: 'success',
              isStudio: true,
            })

            cy.get('@studioControls').find('.studio-save').should('not.be.disabled')
          })

          it('is emits studio:save when clicked', () => {
            addCommand(runner, {
              hookId: 'r3-studio',
              name: 'get',
              message: '#studio-command',
              state: 'success',
              isStudio: true,
            })

            cy.stub(runner, 'emit')

            cy.get('@studioControls').find('.studio-save').click()

            cy.wrap(runner.emit).should('be.calledWith', 'studio:save')
          })
        })
      })
    })
  })
})
