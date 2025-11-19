/**
 * DOM Stress Tests
 *
 * This test suite is designed to test browser stability and Cypress performance
 * when dealing with extremely large non-virtualized DOM trees (up to 100,000 DOM nodes).
 *
 * These tests verify that Cypress can handle pages with massive DOM trees without
 * crashing, which is important for testing applications that may have performance
 * issues or anti-patterns like rendering all list items at once instead of using
 * virtual scrolling.
 *
 * Test scenarios include:
 * - Loading lists with 100 to 100,000 DOM elements rendered simultaneously
 * - Scrolling performance with large DOM trees
 * - Browser stability under memory pressure from massive DOM trees
 * - Rapid scrolling patterns that stress the browser
 */

describe(`DOM Stress Tests`, () => {
  const counts = [
    100,
    1000,
    3992,
    10000,
  ]

  for (const count of counts) {
    describe(`basic list (${count} count)`, () => {
      beforeEach(() => {
        cy.log(`loading basic list with ${count}items`)
        cy.visit('/fixtures/dom-stress-test.html')
        cy.get('input[data-cy="item-count"]').clear().type(count)
        cy.get('input[data-cy="list-id"]').clear().type('basic-list')
        cy.get('button[data-cy="add-list"]').click()
      })

      it(`should load the large DOM tree (${count} count) without crashing`, () => {
        cy.get('#basic-list .item')
        .should('have.length.greaterThan', 0, { log: false })
      })

      it('handles normal scrolling without crashing', () => {
        cy.get('#basic-list').scrollTo(0, 1000)
        cy.get('#basic-list').scrollTo(0, 2000)
        cy.get('#basic-list').scrollTo(0, 5000)
      })

      it('handles rapid scrolling without crashing', () => {
        cy.get('#basic-list').scrollTo(0, 100)
        cy.get('#basic-list').scrollTo(0, 300)
        cy.get('#basic-list').scrollTo(0, 600)
        cy.get('#basic-list').scrollTo(0, 1000)
        cy.get('#basic-list').scrollTo(0, 1500)
        cy.get('#basic-list').scrollTo(0, 2000)
      })

      it('handles stress scrolling without crashing', () => {
        cy.get('button[data-cy="stress-scroll"]').click()
        cy.wait(2000)
        cy.get('#basic-list').scrollTo(0, 10000)
      })
    })
  }
})
