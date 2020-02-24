const { EventEmitter } = require('events')

describe('suites', function () {
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
      this.suiteTitle = this.runnables.suites[0].title

      this.runner.emit('runnables:ready', this.runnables)
      this.runner.emit('reporter:start', {})
    })
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

  describe('filtering', function () {
    beforeEach(() => {
      cy.get('.toggle-options').click()
    })

    it('displays when the "Passed" filter is selected and it contains passed tests', () => {
      cy.get('.filter-passed').click()
      cy.contains('suite 1').should('be.visible')
      cy.contains('suite 3').should('be.visible')
    })

    it('does not display when the "Passed" filter is selected and it does not contain passed tests', () => {
      cy.get('.filter-passed').click()
      cy.contains('suite 4').should('not.exist')
      cy.contains('suite (nested) 1').should('not.exist')
    })

    it('displays when the "Failed" filter is selected and it contains failed tests', () => {
      cy.get('.filter-failed').click()
      cy.contains('suite 1').should('be.visible')
    })

    it('does not display when the "Failed" filter is selected and it does not contain failed tests', () => {
      cy.get('.filter-failed').click()
      cy.contains('suite 3').should('not.exist')
      cy.contains('suite 4').should('not.exist')
      cy.contains('suite (nested) 1').should('not.exist')
    })

    it('displays when the "Pending" filter is selected and it contains pending tests', () => {
      cy.get('.filter-pending').click()
      cy.contains('suite 1').should('be.visible')
      cy.contains('suite (nested) 1').should('be.visible')
    })

    it('always displays running test', function () {
      cy.wrap({}).then(() => {
        this.runner.emit('test:before:run:async', { id: 'r7' })
      })

      cy.get('.filter-passed').click()
      cy.contains('suite (nested) 1').should('be.visible')
      cy.get('.filter-failed').click()
      cy.contains('suite (nested) 1').should('be.visible')
      cy.get('.filter-pending').click()
      cy.contains('suite (nested) 1').should('be.visible')
    })

    it('does not display when the "Pending" filter is selected and it does not contain pending tests', () => {
      cy.get('.filter-pending').click()
      cy.contains('suite 3').should('not.exist')
      cy.contains('suite 4').should('not.exist')
    })

    it('does not display when any filter and no children', () => {
      cy.get('.filter-passed').click()
      cy.contains('suite 5').should('not.exist')
      cy.get('.filter-failed').click()
      cy.contains('suite 5').should('not.exist')
      cy.get('.filter-pending').click()
      cy.contains('suite 5').should('not.exist')
    })

    it('displays all when filter is cleared', () => {
      cy.get('.filter-passed').click()
      cy.get('.clear-filter').click()

      cy.contains('suite 1').should('be.visible')
      cy.contains('suite 3').should('be.visible')
      cy.contains('suite 4').should('be.visible')
      cy.contains('suite 5').should('be.visible')
      cy.contains('suite (nested) 1').should('be.visible')
    })
  })
})
