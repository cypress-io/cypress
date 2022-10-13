import { MobxRunnerStore } from '@packages/app/src/store'
import { EventEmitter } from 'events'
import { RootRunnable } from '../../src/runnables/runnables-store'

const runnerStore = new MobxRunnerStore('e2e')

runnerStore.setSpec({
  name: 'foo.js',
  relative: 'relative/path/to/foo.js',
  absolute: '/absolute/path/to/foo.js',
})

describe('suites', () => {
  let runner: EventEmitter
  let runnables: RootRunnable

  function renderReporter ({ studioEnabled }: { studioEnabled?: boolean } = {}) {
    cy.fixture('runnables').then((_runnables) => {
      runnables = _runnables
    })

    runner = new EventEmitter()

    cy.visit('/').then((win) => {
      win.render({
        runner,
        studioEnabled: studioEnabled || false,
        runnerStore,
      })
    })

    cy.get('.reporter').then(() => {
      runner.emit('runnables:ready', runnables)
      runner.emit('reporter:start', {})
    })
  }

  beforeEach(() => {
    renderReporter()
  })

  it('includes the class "suite"', () => {
    cy.contains('suite 1')
    .closest('.runnable')
    .should('have.class', 'suite')

    // ensure the page is loaded before taking snapshot
    // close failed commands -- not needed for to this test
    cy.contains('test 2').click()
    cy.contains('failed with retries').click()
    cy.percySnapshot()
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
    it('is expanded by default', () => {
      cy.contains('suite 1')
      .parents('.collapsible').as('suiteWrapper')
      .should('have.class', 'is-open')
      .find('.collapsible-content').eq(0)
      .should('be.visible')
    })

    describe('expand/collapse suite manually', () => {
      beforeEach(() => {
        cy.contains('suite 1')
        .parents('.collapsible').as('suiteWrapper')
        .should('have.class', 'is-open')
        .find('.collapsible-content')
        .should('be.visible')
      })

      it('expands/collapses on click', () => {
        cy.contains('suite 1')
        .click()

        cy.get('@suiteWrapper')
        .should('not.have.class', 'is-open')
        .find('.collapsible-content')
        .should('not.exist')

        cy.contains('suite 1')
        .click()

        cy.get('@suiteWrapper')
        .should('have.class', 'is-open')
        .find('.collapsible-content').eq(0)
        .should('be.visible')
      })

      it('expands/collapses on enter', () => {
        cy.contains('suite 1')
        .parents('.collapsible-header')
        .focus().type('{enter}')

        cy.get('@suiteWrapper')
        .should('not.have.class', 'is-open')
        .find('.collapsible-content')
        .should('not.exist')

        cy.contains('suite 1')
        .parents('.collapsible-header')
        .focus().type('{enter}')

        cy.get('@suiteWrapper')
        .should('have.class', 'is-open')
        .find('.collapsible-content').eq(0)
        .should('be.visible')
      })

      it('expands/collapses on space', () => {
        cy.contains('suite 1')
        .parents('.collapsible-header')
        .focus().type(' ')

        cy.get('@suiteWrapper')
        .should('not.have.class', 'is-open')
        .find('.collapsible-content')
        .should('not.exist')

        cy.contains('suite 1')
        .parents('.collapsible-header')
        .focus().type(' ')

        cy.get('@suiteWrapper')
        .should('have.class', 'is-open')
        .find('.collapsible-content').eq(0)
        .should('be.visible')
      })
    })
  })

  describe('studio button', () => {
    beforeEach(() => {
      renderReporter({ studioEnabled: true })
    })

    it('displays studio icon with half transparency when hovering over test title', () => {
      cy.contains('nested suite 1')
      .closest('.runnable-wrapper')
      .realHover()
      .find('.runnable-controls-studio')
      .should('be.visible')
      .should('have.css', 'opacity', '0.5')
    })

    it('displays studio icon with no transparency and tooltip on hover', () => {
      cy.contains('nested suite 1')
      .closest('.collapsible-header')
      .find('.runnable-controls-studio')
      .realHover()
      .should('be.visible')
      .should('have.css', 'opacity', '1')

      cy.get('.cy-tooltip').contains('Add New Test')
    })

    it('emits studio:init:suite with the suite id when clicked', () => {
      cy.stub(runner, 'emit')

      cy.contains('suite 1').parents('.collapsible-header')
      .find('.runnable-controls-studio').click()

      cy.wrap(runner.emit).should('be.calledWith', 'studio:init:suite', 'r2')
    })
  })
})
