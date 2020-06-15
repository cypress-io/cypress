import { EventEmitter } from 'events'
import { itHandlesFileOpening } from '../support/utils'

describe('tests', () => {
  let passingTestTitle: any
  let failingTestTitle: any

  beforeEach(() => {
    const runner = new EventEmitter()

    cy.visit('/dist').then((win) => {
      win.render({
        runner,
        spec: {
          name: 'foo.js',
          relative: 'relative/path/to/foo.js',
          absolute: '/absolute/path/to/foo.js',
        },
      })
    })

    cy.get('.reporter')
    cy.fixture('runnables').then((runnables) => {
      passingTestTitle = runnables.suites[0].tests[0].title
      failingTestTitle = runnables.suites[0].tests[1].title

      runner.emit('runnables:ready', runnables)
      runner.emit('reporter:start', {})
    })
  })

  it('is collapsed by default', () => {
    cy.contains(passingTestTitle)
    .parents('.runnable-wrapper').as('testWrapper')
    .should('not.have.class', 'is-open')
    .find('.collapsible-content')
    .should('not.be.visible')
  })

  it('failed tests expand automatically', () => {
    cy.contains(failingTestTitle)
    .parents('.runnable-wrapper').as('testWrapper')
    .should('have.class', 'is-open')
    .find('.collapsible-content')
    .should('be.visible')
  })

  describe('manual expanding/collapsing', () => {
    beforeEach(() => {
      cy.contains(passingTestTitle)
      .parents('.runnable-wrapper').as('testWrapper')
      .should('not.have.class', 'is-open')
      .find('.collapsible-content')
      .should('not.be.visible')
    })

    it('expands/collapses on click', () => {
      cy.contains(passingTestTitle)
      .click()

      cy.get('@testWrapper')
      .should('have.class', 'is-open')
      .find('.collapsible-content').should('be.visible')

      cy.contains(passingTestTitle)
      .click()

      cy.get('@testWrapper')
      .should('not.have.class', 'is-open')
      .find('.collapsible-content').should('not.be.visible')
    })

    describe('header', function () {
      it('displays', function () {
        cy.get('.runnable-header').find('a').should('have.text', 'relative/path/to/foo.js')
      })

      itHandlesFileOpening('.runnable-header', {
        file: '/absolute/path/to/foo.js',
        line: 0,
        column: 0,
      })
    })

    it('expands/collapses on enter', () => {
      cy.contains(passingTestTitle)
      .focus().type('{enter}')

      cy.get('@testWrapper')
      .should('have.class', 'is-open')
      .find('.collapsible-content').should('be.visible')

      cy.contains(passingTestTitle)
      .focus().type('{enter}')

      cy.get('@testWrapper')
      .should('not.have.class', 'is-open')
      .find('.collapsible-content').should('not.be.visible')
    })

    it('expands/collapses on space', () => {
      cy.contains(passingTestTitle)
      .focus().type(' ')

      cy.get('@testWrapper')
      .should('have.class', 'is-open')
      .find('.collapsible-content').should('be.visible')

      cy.contains(passingTestTitle)
      .focus().type(' ')

      cy.get('@testWrapper')
      .should('not.have.class', 'is-open')
      .find('.collapsible-content').should('not.be.visible')
    })
  })
})
