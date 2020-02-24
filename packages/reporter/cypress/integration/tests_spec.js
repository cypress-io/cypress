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
    beforeEach(() => {
      cy.get('.toggle-options').click()
    })

    it('displays when the "Passed" filter is selected and it is passed', () => {
      cy.get('.filter-passed').click()
      cy.contains('test 1').should('be.visible')
      cy.contains('test 3').should('be.visible')
      cy.contains('test 4').should('be.visible')
    })

    it('does not display when the "Passed" filter is selected and it is not passed', () => {
      cy.get('.filter-passed').click()
      cy.contains('test 2').should('not.exist')
      cy.contains('test 5').should('not.exist')
      cy.contains('test (nested) 1').should('not.exist')
      cy.contains('test (nested) 2').should('not.exist')
    })

    it('displays when the "Failed" filter is selected and it is failed', () => {
      cy.get('.filter-failed').click()
      cy.contains('test 2').should('be.visible')
    })

    it('does not display when the "Failed" filter is selected and it is not failed', () => {
      cy.get('.filter-failed').click()
      cy.contains('test 1').should('not.exist')
      cy.contains('test 3').should('not.exist')
      cy.contains('test 4').should('not.exist')
      cy.contains('test 5').should('not.exist')
      cy.contains('test (nested) 1').should('not.exist')
      cy.contains('test (nested) 2').should('not.exist')
    })

    it('displays when the "Pending" filter is selected and it is pending', () => {
      cy.get('.filter-pending').click()
      cy.contains('test (nested) 1').should('be.visible')
    })

    it('does not display when the "Pending" filter is selected and it is not pending', () => {
      cy.get('.filter-pending').click()
      cy.contains('test 1').should('not.exist')
      cy.contains('test 2').should('not.exist')
      cy.contains('test 3').should('not.exist')
      cy.contains('test 4').should('not.exist')
      cy.contains('test 5').should('not.exist')
      cy.contains('test (nested) 2').should('not.exist')
    })

    it('does not display when any filter and no children', () => {
      cy.get('.filter-passed').click()
      cy.get('.clear-filter').click()

      cy.contains('test 1').should('be.visible')
      cy.contains('test 2').should('be.visible')
      cy.contains('test 3').should('be.visible')
      cy.contains('test 4').should('be.visible')
      cy.contains('test 5').should('be.visible')
      cy.contains('test (nested) 1').should('be.visible')
      cy.contains('test (nested) 2').should('be.visible')
    })

    it('always displays running test', function () {
      cy.wrap({}).then(() => {
        this.runner.emit('test:before:run:async', { id: 'r7' })
      })

      cy.get('.filter-passed').click()
      cy.contains('test (nested) 2').should('be.visible')
      cy.get('.filter-failed').click()
      cy.contains('test (nested) 2').should('be.visible')
      cy.get('.filter-pending').click()
      cy.contains('test (nested) 2').should('be.visible')
    })

    it('displays empty message when none match', function () {
      this.runnables.suites = []
      this.runnables.tests = [{
        'id': 'r1',
        'title': 'test 1',
      }, {
        'id': 'r2',
        'title': 'test 2',
      }, {
        'id': 'r3',
        'title': 'test 3',
      }]

      this.runner.emit('runnables:ready', this.runnables)

      cy.get('.filter-passed').click()
      cy.get('.filter-empty-message')
      .should('be.visible')
      .should('have.length', 1)
      .should('have.text', 'No tests match the filter "Passed"')
    })
  })
})
