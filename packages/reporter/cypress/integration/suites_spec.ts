import { EventEmitter } from 'events'

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
  })
})
