/// <reference types="cypress" />

describe('support.js', () => {
  /**
   * Because tests inside of here are validating beforeEach
   * they must be executed *together* to be meaningful.
   */
  describe('beforeEach', () => {
    let count = 0
    const $ = Cypress.$

    beforeEach(() => {
      count++
      $('body').append(`<h1 class="before-each-body">beforeEach's DOM cleanup: ${count}</h1>`)
      $('head').append(`<style class="before-each-head">
          h1 { color: forestgreen; }
          h1:nth-of-type(2) { color: darkred; }
         </style>`)

      cy.get('head')
      .find('.before-each-head')
      .should('exist').and('have.length', 1)

      cy.get('body')
      .find('h1')
      .should('exist')
      .and('have.length', 1)
    })

    it('Setup-only: cleans up the target between it blocks', () => {})

    it('Actual assertion: should have cleared out the first specs DOM', () => {})
  })
})
