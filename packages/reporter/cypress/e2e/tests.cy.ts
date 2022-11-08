import { EventEmitter } from 'events'
import { RootRunnable } from '../../src/runnables/runnables-store'
import { MobxRunnerStore } from '@packages/app/src/store/mobx-runner-store'

let runner: EventEmitter
let runnables: RootRunnable

function visitAndRenderReporter (studioEnabled: boolean = false, studioActive: boolean = false) {
  cy.fixture('runnables').then((_runnables) => {
    runnables = _runnables
  })

  runner = new EventEmitter()

  const runnerStore = new MobxRunnerStore('e2e')

  runnerStore.setSpec({
    name: 'foo.js',
    relative: 'relative/path/to/foo.js',
    absolute: '/absolute/path/to/foo.js',
  })

  cy.visit('/').then((win) => {
    win.render({
      studioEnabled,
      runner,
      runnerStore,
    })
  })

  cy.get('.reporter').then(() => {
    runner.emit('runnables:ready', runnables)
    runner.emit('reporter:start', { studioActive })
  })

  return runnerStore
}

describe('tests', () => {
  beforeEach(() => {
    visitAndRenderReporter()
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
      .should('not.exist')
    })

    it('last retried attempt collapsed by default', () => {
      cy.contains('passed after retry')
      .scrollIntoView()
      .parents('.collapsible').first()
      .should('not.have.class', 'is-open')
      .find('.collapsible-content')
      .should('not.exist')

      cy.percySnapshot()

      cy.contains('passed after retry')
      .click()

      cy.contains('passed after retry')
      .parents('.collapsible').first()
      .find('.attempt-item').as('attempts')

      cy.get('@attempts').eq(0)
      .find('.collapsible')
      .should('not.have.class', 'is-open')
      .find('.collapsible-indicator').should('not.exist')

      cy.get('@attempts').eq(1)
      .scrollIntoView()
      .find('.collapsible')
      .should('have.class', 'is-open')
      .find('.collapsible-indicator').should('not.exist')

      cy.percySnapshot('expanded')
    })

    it('failed tests expands automatically', () => {
      cy.contains('test 2')
      .parents('.collapsible').first()
      .should('have.class', 'is-open')
      .find('.collapsible-content')
      .should('be.visible')
    })

    it('failed and last retried attempt expands automatically', () => {
      cy.contains('failed with retries')
      .parents('.collapsible').first()
      .find('.attempt-item').as('attempts')

      cy.percySnapshot()

      cy.get('@attempts').eq(0)
      .find('.collapsible')
      .should('not.have.class', 'is-open')
      .find('.collapsible-indicator').should('not.exist')

      cy.get('@attempts').eq(1)
      .find('.collapsible')
      .should('have.class', 'is-open')
      .find('.collapsible-content')
      .should('be.visible')

      cy.contains('failed with retries').click()
      cy.percySnapshot('collapsed')
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
      .find('.collapsible-content').should('not.exist')
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
      .find('.collapsible-content').should('not.exist')
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
      .find('.collapsible-content').should('not.exist')
    })
  })
})

describe('studio controls', () => {
  describe('canCopyStudioCommands is true', () => {
    beforeEach(() => {
      const runnerStore = visitAndRenderReporter(true, true)

      runnerStore.setCanSaveStudioLogs(true)

      cy.contains('test 1')
      .scrollIntoView()
      .click()
      .parents('.collapsible').first()
      .find('.studio-controls').as('studioControls')
    })

    it('is enabled with tooltip when there are commands', () => {
      cy.get('@studioControls')
      .find('.studio-copy')
      .should('not.be.disabled')
      .trigger('mouseover')

      cy.get('.cy-tooltip').should('have.text', 'Copy Commands to Clipboard')
    })

    it('is enabled when there are commands', () => {
      cy.get('@studioControls').find('.studio-save').should('not.be.disabled')
    })

    it('is emits studio:save when clicked', () => {
      cy.stub(runner, 'emit')

      cy.get('@studioControls').find('.studio-save').click()

      cy.wrap(runner.emit).should('be.calledWith', 'studio:save')
    })

    it('is emits studio:copy:to:clipboard when clicked', () => {
      cy.stub(runner, 'emit')

      cy.get('@studioControls').find('.studio-copy').click()

      cy.wrap(runner.emit).should('be.calledWith', 'studio:copy:to:clipboard')
    })

    it('displays success state after commands are copied', () => {
      cy.stub(runner, 'emit').callsFake((event, callback) => {
        if (event === 'studio:copy:to:clipboard') {
          callback('')
        }
      })

      cy.get('@studioControls')
      .find('.studio-copy')
      .click()
      .should('have.class', 'studio-copy-success')
      .trigger('mouseover')

      cy.get('.cy-tooltip').should('have.text', 'Commands Copied!')
    })
  })

  describe('canCopyStudioCommands is false', () => {
    describe('copy button', () => {
      beforeEach(() => {
        const runnerStore = visitAndRenderReporter(true, true)

        runnerStore.setCanSaveStudioLogs(false)

        cy.contains('test 1')
        .scrollIntoView()
        .click()
        .parents('.collapsible').first()
        .find('.studio-controls').as('studioControls')
      })

      it('is disabled without tooltip when there are no commands', () => {
        cy.get('@studioControls')
        .find('.studio-copy')
        .should('be.disabled')
        .parent('span')
        .trigger('mouseover')

        cy.get('.cy-tooltip').should('not.exist')
      })
    })

    describe('launch studio button when studio is not active', () => {
      beforeEach(() => {
        const runnerStore = visitAndRenderReporter(true, false)

        runnerStore.setCanSaveStudioLogs(false)
      })

      it('displays studio icon with half transparency when hovering over test title', { scrollBehavior: false }, () => {
        cy.contains('test 1')
        .closest('.runnable-wrapper')
        .realHover()
        .find('.runnable-controls-studio')
        .should('be.visible')
        .should('have.css', 'opacity', '0.5')
      })

      it('displays studio icon with no transparency and tooltip on hover', { scrollBehavior: false }, () => {
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
        visitAndRenderReporter(false, false)

        cy.contains('test 1').click()
        .parents('.collapsible').first()
        .find('.studio-controls').should('not.exist')
      })

      describe('with studio active', () => {
        beforeEach(() => {
          const runnerStore = visitAndRenderReporter(true, true)

          runnerStore.setCanSaveStudioLogs(false)

          cy.contains('test 1')
          .scrollIntoView()
          .click()
          .parents('.collapsible').first()
          .find('.studio-controls').as('studioControls')
        })

        it('is visible with save and copy button when test passed', () => {
          cy.get('@studioControls').should('be.visible')
          cy.get('@studioControls').find('.studio-save').should('be.visible')
          cy.get('@studioControls').find('.studio-copy').should('be.visible')

          cy.percySnapshot()
        })

        it('is visible without save and copy button if test failed', () => {
          cy.contains('test 2')
          .parents('.collapsible').first()
          .find('.studio-controls').should('be.visible')

          cy.contains('test 2')
          .parents('.collapsible').first()
          .find('.studio-save').should('not.be.visible')

          cy.contains('test 2')
          .parents('.collapsible').first()
          .find('.studio-copy').should('not.be.visible')
        })

        it('is visible without save and copy button if test was skipped', () => {
          cy.contains('nested suite 1')
          .parents('.collapsible').first()
          .contains('test 1').click()
          .parents('.collapsible').first()
          .find('.studio-controls').as('pendingControls')
          .should('be.visible')

          cy.get('@pendingControls').find('.studio-save').should('not.be.visible')
          cy.get('@pendingControls').find('.studio-copy').should('not.be.visible')
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
          it('save button is disabled', () => {
            cy.get('@studioControls').find('.studio-save').should('be.disabled')
          })
        })
      })
    })
  })
})
