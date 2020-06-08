import { EventEmitter } from 'events'
import { itHandlesFileOpening } from '../support/utils'

describe('controls', function () {
  beforeEach(function () {
    cy.fixture('runnables').as('runnables')

    this.runner = new EventEmitter()

    cy.visit('/dist').then((win) => {
      win.render({
        runner: this.runner,
        spec: {
          name: 'foo.js',
          relative: 'relative/path/to/foo.js',
          absolute: '/absolute/path/to/foo.js',
        },
      })
    })

    cy.get('.reporter').then(() => {
      this.runner.emit('runnables:ready', this.runnables)

      this.runner.emit('reporter:start', {})
    })
  })

  describe('tests', function () {
    beforeEach(function () {
      this.passingTestTitle = this.runnables.suites[0].tests[0].title
      this.failingTestTitle = this.runnables.suites[0].tests[1].title
    })

    describe('expand and collapse', function () {
      it('is collapsed by default', function () {
        cy.contains(this.passingTestTitle)
        .parents('.runnable-wrapper').as('testWrapper')
        .should('not.have.class', 'is-open')
        .find('.collapsible-content')
        .should('not.be.visible')
      })

      describe('expand/collapse test manually', function () {
        beforeEach(function () {
          cy.contains(this.passingTestTitle)
          .parents('.runnable-wrapper').as('testWrapper')
          .should('not.have.class', 'is-open')
          .find('.collapsible-content')
          .should('not.be.visible')
        })

        it('expands/collapses on click', function () {
          cy.contains(this.passingTestTitle)
          .click()

          cy.get('@testWrapper')
          .should('have.class', 'is-open')
          .find('.collapsible-content').should('be.visible')

          cy.contains(this.passingTestTitle)
          .click()

          cy.get('@testWrapper')
          .should('not.have.class', 'is-open')
          .find('.collapsible-content').should('not.be.visible')
        })

        it('expands/collapses on enter', function () {
          cy.contains(this.passingTestTitle)
          .focus().type('{enter}')

          cy.get('@testWrapper')
          .should('have.class', 'is-open')
          .find('.collapsible-content').should('be.visible')

          cy.contains(this.passingTestTitle)
          .focus().type('{enter}')

          cy.get('@testWrapper')
          .should('not.have.class', 'is-open')
          .find('.collapsible-content').should('not.be.visible')
        })

        it('expands/collapses on space', function () {
          cy.contains(this.passingTestTitle)
          .focus().type(' ')

          cy.get('@testWrapper')
          .should('have.class', 'is-open')
          .find('.collapsible-content').should('be.visible')

          cy.contains(this.passingTestTitle)
          .focus().type(' ')

          cy.get('@testWrapper')
          .should('not.have.class', 'is-open')
          .find('.collapsible-content').should('not.be.visible')
        })
      })
    })

    describe('failed tests', function () {
      it('expands automatically', function () {
        cy.contains(this.failingTestTitle)
        .parents('.runnable-wrapper').as('testWrapper')
        .should('have.class', 'is-open')
        .find('.collapsible-content')
        .should('be.visible')
      })
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
  })
})
