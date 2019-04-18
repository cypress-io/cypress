const { EventEmitter } = require('events')

describe('controls', function () {
  beforeEach(function () {
    cy.fixture('runnables').as('runnables')

    this.runner = new EventEmitter()

    cy.visit('cypress/support/index.html').then((win) => {
      win.render({
        runner: this.runner,
        specPath: '/foo/bar',
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
  })
})
