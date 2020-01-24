const { EventEmitter } = require('events')

describe('controls', function () {
  beforeEach(function () {
    cy.fixture('runnables').as('runnables')

    this.runner = new EventEmitter()

    cy.visit('/dist').then((win) => {
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

  describe('suites', function () {
    beforeEach(function () {
      this.suiteTitle = this.runnables.suites[0].title
    })

    describe('expand and collapse', function () {
      it('is expanded by default', function () {
        cy.contains(this.suiteTitle)
        .parents('.collapsible').as('suiteWrapper')
        .should('have.class', 'is-open')
        .find('.collapsible-content').eq(0)
        .should('be.visible')
      })

      describe('expand/collapse suite manually', function () {
        beforeEach(function () {
          cy.contains(this.suiteTitle)
          .parents('.collapsible').as('suiteWrapper')
          .should('have.class', 'is-open')
          .find('.collapsible-content')
          .should('be.visible')
        })

        it('expands/collapses on click', function () {
          cy.contains(this.suiteTitle)
          .click()

          cy.get('@suiteWrapper')
          .should('not.have.class', 'is-open')
          .find('.collapsible-content').eq(0)
          .should('not.be.visible')

          cy.contains(this.suiteTitle)
          .click()

          cy.get('@suiteWrapper')
          .should('have.class', 'is-open')
          .find('.collapsible-content').eq(0)
          .should('be.visible')
        })

        it('expands/collapses on enter', function () {
          cy.contains(this.suiteTitle)
          .parents('.collapsible-header')
          .focus().type('{enter}')

          cy.get('@suiteWrapper')
          .should('not.have.class', 'is-open')
          .find('.collapsible-content').eq(0)
          .should('not.be.visible')

          cy.contains(this.suiteTitle)
          .parents('.collapsible-header')
          .focus().type('{enter}')

          cy.get('@suiteWrapper')
          .should('have.class', 'is-open')
          .find('.collapsible-content').eq(0)
          .should('be.visible')
        })

        it('expands/collapses on space', function () {
          cy.contains(this.suiteTitle)
          .parents('.collapsible-header')
          .focus().type(' ')

          cy.get('@suiteWrapper')
          .should('not.have.class', 'is-open')
          .find('.collapsible-content').eq(0)
          .should('not.be.visible')

          cy.contains(this.suiteTitle)
          .parents('.collapsible-header')
          .focus().type(' ')

          cy.get('@suiteWrapper')
          .should('have.class', 'is-open')
          .find('.collapsible-content').eq(0)
          .should('be.visible')
        })
      })
    })

    describe('filtering suites list', () => {
      it('filters by successful suites', () => {
        cy.get('button.passed').click()
        cy.contains('suite 3').should('be.visible')
        cy.contains('suite 1').should('not.be.visible')
        cy.contains('suite 4').should('not.be.visible')
        cy.contains('nested suite 1').should('not.be.visible')
      })

      it('filters by failing suites when the successful button is clicked', () => {
        cy.get('button.failed').click()
        cy.contains('suite 3').should('not.be.visible')
        cy.contains('suite 1').should('be.visible')
        cy.contains('suite 4').should('not.be.visible')
        cy.contains('nested suite 1').should('not.be.visible')
      })

      it('filters by pending suites when the pending button is clicked', () => {
        cy.get('button.pending').click()
        cy.contains('suite 3').should('not.be.visible')
        cy.contains('suite 1').should('not.be.visible')
        cy.contains('suite 4').should('be.visible')
        cy.contains('nested suite 1').should('not.be.visible')
      })

      it('clears the filter when the clear filter button is clicked', () => {
        cy.get('button.passed').click()
        cy.get('button.clear').click()

        cy.contains('suite 3').should('be.visible')
        cy.contains('suite 1').should('be.visible')
        cy.contains('suite 4').should('be.visible')
        cy.contains('nested suite 1').should('be.visible')
      })
    })
  })
})
