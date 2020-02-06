const { EventEmitter } = require('events')

describe('tests', function () {
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
      this.passedTestTitle = this.runnables.suites[0].tests[0].title
      this.failedTestTitle = this.runnables.suites[0].tests[1].title

      this.runner.emit('runnables:ready', this.runnables)

      this.runner.emit('reporter:start', {})
    })
  })

  describe('expand and collapse', function () {
    it('is collapsed by default', function () {
      cy.contains(this.passedTestTitle)
      .parents('.runnable-wrapper').as('testWrapper')
      .should('not.have.class', 'is-open')
      .find('.collapsible-content')
      .should('not.be.visible')
    })

    it('failed tests expand automatically', function () {
      cy.contains(this.failedTestTitle)
      .parents('.runnable-wrapper').as('testWrapper')
      .should('have.class', 'is-open')
      .find('.collapsible-content')
      .should('be.visible')
    })

    describe('expand/collapse test manually', function () {
      beforeEach(function () {
        cy.contains(this.passedTestTitle)
        .parents('.runnable-wrapper').as('testWrapper')
        .should('not.have.class', 'is-open')
        .find('.collapsible-content')
        .should('not.be.visible')
      })

      it('expands/collapses on click', function () {
        cy.contains(this.passedTestTitle)
        .click()

        cy.get('@testWrapper')
        .should('have.class', 'is-open')
        .find('.collapsible-content').should('be.visible')

        cy.contains(this.passedTestTitle)
        .click()

        cy.get('@testWrapper')
        .should('not.have.class', 'is-open')
        .find('.collapsible-content').should('not.be.visible')
      })

      it('expands/collapses on enter', function () {
        cy.contains(this.passedTestTitle)
        .focus().type('{enter}')

        cy.get('@testWrapper')
        .should('have.class', 'is-open')
        .find('.collapsible-content').should('be.visible')

        cy.contains(this.passedTestTitle)
        .focus().type('{enter}')

        cy.get('@testWrapper')
        .should('not.have.class', 'is-open')
        .find('.collapsible-content').should('not.be.visible')
      })

      it('expands/collapses on space', function () {
        cy.contains(this.passedTestTitle)
        .focus().type(' ')

        cy.get('@testWrapper')
        .should('have.class', 'is-open')
        .find('.collapsible-content').should('be.visible')

        cy.contains(this.passedTestTitle)
        .focus().type(' ')

        cy.get('@testWrapper')
        .should('not.have.class', 'is-open')
        .find('.collapsible-content').should('not.be.visible')
      })
    })
  })

  describe('filtering', () => {
    it('displays when the "Running" filter is selected and it is active', () => {
      cy.get('[value="active"]').click()
      cy.contains('test (nested) 2').should('be.visible')
    })

    it('does not display when the "Running" filter is selected and it is not active', () => {
      cy.get('[value="active"]').click()
      cy.contains('test 1').should('not.exist')
      cy.contains('test 2').should('not.exist')
      cy.contains('test 3').should('not.exist')
      cy.contains('test 4').should('not.exist')
      cy.contains('test 5').should('not.exist')
      cy.contains('test (nested) 1').should('not.exist')
    })

    it('displays when the "Passed" filter is selected and it is passed', () => {
      cy.get('[value="passed"]').click()
      cy.contains('test 1').should('be.visible')
      cy.contains('test 3').should('be.visible')
      cy.contains('test 4').should('be.visible')
    })

    it('does not display when the "Passed" filter is selected and it is not passed', () => {
      cy.get('[value="passed"]').click()
      cy.contains('test 2').should('not.exist')
      cy.contains('test 5').should('not.exist')
      cy.contains('test (nested) 1').should('not.exist')
      cy.contains('test (nested) 2').should('not.exist')
    })

    it('displays when the "Failed" filter is selected and it is failed', () => {
      cy.get('[value="failed"]').click()
      cy.contains('test 2').should('be.visible')
    })

    it('does not display when the "Failed" filter is selected and it is not failed', () => {
      cy.get('[value="failed"]').click()
      cy.contains('test 1').should('not.exist')
      cy.contains('test 3').should('not.exist')
      cy.contains('test 4').should('not.exist')
      cy.contains('test 5').should('not.exist')
      cy.contains('test (nested) 1').should('not.exist')
      cy.contains('test (nested) 2').should('not.exist')
    })

    it('displays when the "Pending" filter is selected and it is pending', () => {
      cy.get('[value="pending"]').click()
      cy.contains('test (nested) 1').should('be.visible')
    })

    it('does not display when the "Pending" filter is selected and it is not pending', () => {
      cy.get('[value="pending"]').click()
      cy.contains('test 1').should('not.exist')
      cy.contains('test 2').should('not.exist')
      cy.contains('test 3').should('not.exist')
      cy.contains('test 4').should('not.exist')
      cy.contains('test 5').should('not.exist')
      cy.contains('test (nested) 2').should('not.exist')
    })

    it('displays when the "No filters" filter is selected', () => {
      cy.get('[value="passed"]').click()
      cy.get('[value=""]').click()

      cy.contains('test 1').should('be.visible')
      cy.contains('test 2').should('be.visible')
      cy.contains('test 3').should('be.visible')
      cy.contains('test 4').should('be.visible')
      cy.contains('test 5').should('be.visible')
      cy.contains('test (nested) 1').should('be.visible')
      cy.contains('test (nested) 2').should('be.visible')
    })
  })
})
