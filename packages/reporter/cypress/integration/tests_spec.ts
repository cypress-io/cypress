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
        .parents('.collapsible').first()
        .should('not.have.class', 'is-open')
        .find('.collapsible-content')
        .should('not.be.visible')
      })

      describe('expand/collapse test manually', function () {
        beforeEach(function () {
          cy.contains(this.passingTestTitle)
          .parents('.collapsible').first().as('testWrapper')
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
          .parents('.collapsible-header').first()
          .focus().type('{enter}')

          cy.get('@testWrapper')
          .should('have.class', 'is-open')
          .find('.collapsible-content').should('be.visible')

          cy.contains(this.passingTestTitle)
          .parents('.collapsible-header').first()
          .focus().type('{enter}')

          cy.get('@testWrapper')
          .should('not.have.class', 'is-open')
          .find('.collapsible-content').should('not.be.visible')
        })

        it('expands/collapses on space', function () {
          cy.contains(this.passingTestTitle)
          .parents('.collapsible-header').first()
          .focus().type(' ')

          cy.get('@testWrapper')
          .should('have.class', 'is-open')
          .find('.collapsible-content').should('be.visible')

          cy.contains(this.passingTestTitle)
          .parents('.collapsible-header').first()
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
        .parents('.collapsible').first()
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

    describe('progress bar', function () {
      it('displays', function () {
        cy.get('.runnable-active').click()
        cy.get('.command-progress').should('be.visible')
      })

      it('calculates correct width', function () {
        cy.clock(1577836801500, ['Date'])
        cy.get('.runnable-active').click()
        cy.get('.command-progress > span').should('have.attr', 'style').should('contain', 'animation-duration: 2500ms')
        cy.get('.command-progress > span').should('have.attr', 'style').should('contain', 'width: 62.5%')
        // ensures that actual width hits 0 within remaining 2.5 seconds
        cy.get('.command-progress > span', { timeout: 2500 }).should('have.css', 'width', '0px')
      })
    })
  })
})
