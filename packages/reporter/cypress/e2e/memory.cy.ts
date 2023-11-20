import { EventEmitter } from 'events'
import { RootRunnable } from '../../src/runnables/runnables-store'
import { MobxRunnerStore } from '@packages/app/src/store/mobx-runner-store'

let runner: EventEmitter
let runnables: RootRunnable
const { _ } = Cypress

function visitAndRenderReporter (studioEnabled: boolean = false, studioActive: boolean = false) {
  cy.fixture('runnables_memory').then((_runnables) => {
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

  context('run mode', () => {
    beforeEach(() => {
      _.each(runnables.suites, (suite) => {
        _.each(suite.tests, (test) => {
          runner.emit('test:after:run', test, false)
        })
      })
    })

    it('clears logs for a collapsed test', () => {
      cy.contains('passed')
      .as('passed')
      .closest('.runnable')
      .should('have.class', 'test')
      .find('.runnable-instruments').should('not.exist')

      cy.get('@passed').click()

      cy.get('@passed')
      .parents('.collapsible').first()
      .find('.attempt-item').eq(0)
      .contains('No commands were issued in this test.')

      cy.percySnapshot()
    })

    it('retains logs for an expanded test', () => {
      cy.contains('failed')
      .parents('.collapsible').first()
      .should('have.class', 'is-open')
      .find('.collapsible-content')
      .should('be.visible')

      cy.contains('failed')
      .parents('.collapsible').first()
      .find('.attempt-item')
      .eq(0)
      .find('.attempt-1')
      .within(() => {
        cy.get('.sessions-container')
        cy.get('.runnable-agents-region')
        cy.get('.runnable-routes-region')
        cy.get('.runnable-commands-region')
      })

      cy.percySnapshot()
    })

    it('retains logs for failed attempt and clears logs for passed attempt after retry', () => {
      cy.contains('passed after retry')
      .parents('.collapsible').first()
      .should('not.have.class', 'is-open')
      .find('.collapsible-content')
      .should('not.exist')

      cy.contains('passed after retry').click()

      cy.contains('passed after retry')
      .parents('.collapsible').first()
      .find('.attempt-item').as('attempts')

      cy.get('@attempts').eq(0).as('firstAttempt')
      .find('.collapsible')
      .should('not.have.class', 'is-open')
      .find('.collapsible-indicator').should('not.exist')

      cy.get('@firstAttempt')
      .contains('Attempt 1')
      .click()

      cy.get('@firstAttempt')
      .find('.attempt-1')
      .within(() => {
        cy.get('.sessions-container')
        cy.get('.runnable-agents-region')
        cy.get('.runnable-routes-region')
        cy.get('.runnable-commands-region')
      })

      cy.get('@attempts').eq(1).as('secondAttempt')
      .find('.collapsible')
      .should('have.class', 'is-open')
      .find('.collapsible-indicator').should('not.exist')

      cy.get('@secondAttempt')
      .contains('No commands were issued in this test.')

      cy.percySnapshot()
    })

    it('retains logs for failed attempts', () => {
      cy.contains('failed with retries')
      .parents('.collapsible').first()
      .find('.attempt-item').as('attempts')

      cy.get('@attempts').eq(0).as('firstAttempt')
      .find('.collapsible')
      .should('not.have.class', 'is-open')
      .find('.collapsible-indicator').should('not.exist')

      cy.get('@firstAttempt')
      .contains('Attempt 1')
      .click()

      cy.get('@firstAttempt')
      .find('.attempt-1')
      .within(() => {
        cy.get('.sessions-container')
        cy.get('.runnable-agents-region')
        cy.get('.runnable-routes-region')
        cy.get('.runnable-commands-region')
      })

      cy.get('@attempts').eq(1).as('secondAttempt')
      .find('.collapsible')
      .should('have.class', 'is-open')
      .find('.collapsible-content')
      .should('be.visible')

      cy.get('@secondAttempt')
      .find('.attempt-2')
      .within(() => {
        cy.get('.sessions-container')
        cy.get('.runnable-agents-region')
        cy.get('.runnable-routes-region')
        cy.get('.runnable-commands-region')
      })

      cy.contains('failed with retries')
      .scrollIntoView()
      .percySnapshot()
    })
  })

  context('open mode', () => {
    beforeEach(() => {
      _.each(runnables.suites, (suite) => {
        _.each(suite.tests, (test) => {
          runner.emit('test:after:run', test, true)
        })
      })
    })

    it('retains logs for a collapsed test', () => {
      cy.contains('passed')
      .as('passed')
      .closest('.runnable')
      .should('have.class', 'test')
      .find('.runnable-instruments').should('not.exist')

      cy.get('@passed').click()

      cy.get('@passed')
      .parents('.collapsible').first()
      .find('.attempt-item')
      .eq(0)
      .find('.attempt-1')
      .within(() => {
        cy.get('.sessions-container')
        cy.get('.runnable-agents-region')
        cy.get('.runnable-routes-region')
        cy.get('.runnable-commands-region')
      })

      cy.percySnapshot()
    })

    it('retains logs for an expanded test', () => {
      cy.contains('failed')
      .parents('.collapsible').first()
      .should('have.class', 'is-open')
      .find('.collapsible-content')
      .should('be.visible')

      cy.contains('failed')
      .parents('.collapsible').first()
      .find('.attempt-item')
      .eq(0)
      .find('.attempt-1')
      .within(() => {
        cy.get('.sessions-container')
        cy.get('.runnable-agents-region')
        cy.get('.runnable-routes-region')
        cy.get('.runnable-commands-region')
      })

      cy.percySnapshot()
    })
  })
})
