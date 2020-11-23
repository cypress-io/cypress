import { EventEmitter } from 'events'
import { RootRunnable } from '../../src/runnables/runnables-store'

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
})
