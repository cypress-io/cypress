import { EventEmitter } from 'events'
import { RootRunnable } from '../../src/runnables/runnables-store'
import { MobxRunnerStore } from '@packages/app/src/store/mobx-runner-store'

let runner: EventEmitter
let runnables: RootRunnable

function visitAndRenderReporter (studioEnabled: boolean = false, studioActive: boolean = false, specRelative: string = 'relative/path/to/foo.js') {
  cy.fixture('runnables').then((_runnables) => {
    runnables = _runnables
  })

  runner = new EventEmitter()

  const runnerStore = new MobxRunnerStore('e2e')

  runnerStore.setSpec({
    name: 'foo.js',
    relative: specRelative,
    absolute: '/absolute/path/to/foo.js',
  })

  cy.visit('/').then((win) => {
    win.render({
      studioEnabled,
      runner,
      runnerStore,
    })
  })

  cy.get('.reporter.mounted').then(() => {
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
    cy.get('.suite').first().within((el) => {
      cy.wrap(el).contains('suite 1')
      cy.get('.test').eq(0).should('have.class', 'runnable-passed')
      cy.get('.test').eq(1).should('have.class', 'runnable-failed')
    })

    cy.get('.suite').eq(1).within((el) => {
      cy.wrap(el).contains('suite 1 > nested suite 1')
      cy.get('.test').eq(0).should('have.class', 'runnable-pending')
      cy.get('.test').eq(1).should('have.class', 'runnable-active')
    })

    cy.get('.suite').eq(2).within((el) => {
      cy.wrap(el).contains('suite 2')
      cy.get('.test').eq(0).should('have.class', 'runnable-passed')
      cy.get('.test').eq(1).should('have.class', 'runnable-passed')
      cy.get('.test').eq(2).should('have.class', 'runnable-passed')
      .should('have.class', 'runnable-retried')
    })
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

  describe('studio controls', () => {
    it('hides launch studio icon when running all specs', () => {
      visitAndRenderReporter(true, false, '__all')

      cy.contains('test 1').realHover()
      cy.get('[data-cy="launch-studio"]').should('not.exist')
    })

    it('shows launch studio icon when running a single spec', () => {
      visitAndRenderReporter(true, false, 'relative/path/to/foo.js')

      cy.contains('test 1').realHover()
      cy.get('[data-cy="launch-studio"]').should('exist')
    })

    it('hides new test button in suites when running all specs', () => {
      visitAndRenderReporter(true, false, '__all')

      cy.contains('suite 1').realHover()
      cy.get('[data-cy="create-new-test-from-suite"]').should('not.exist')
    })

    it('shows new test button in suites when running a single spec', () => {
      visitAndRenderReporter(true, false, 'relative/path/to/foo.js')

      cy.contains('suite 1').realHover()
      cy.get('[data-cy="create-new-test-from-suite"]').should('exist')
    })
  })
})

describe('studio controls', () => {
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
      .should('have.css', 'opacity', '1')
    })

    it('displays studio icon with no transparency and tooltip on hover', { scrollBehavior: false }, () => {
      cy.contains('test 1')
      .closest('.collapsible-header')
      .find('.runnable-controls-studio')
      .realHover()
      .should('be.visible')
      .should('have.css', 'opacity', '1')

      cy.get('.cy-tooltip').contains('Edit in Studio')
    })

    it('emits studio:init:test with the suite id when studio button clicked', () => {
      cy.stub(runner, 'emit')

      cy.contains('test 1').parents('.collapsible-header')
      .find('.runnable-controls-studio').click()

      cy.wrap(runner.emit).should('be.calledWith', 'studio:init:test', 'r3')
    })
  })
})
