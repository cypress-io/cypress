/// <reference types="cypress" />

describe('support.js', () => {
  /**
   * Because tests inside of here are validating beforeEach
   * they must be executed *together* to be meaningful.
   */
  describe('beforeEach', () => {
    describe('body & head target cleanup', () => {
      const renderAndTestHead = (id) => {
        const el = Cypress.$(`<style
                  class="before-each-head-${id} before-each-head">
                  .before-each-body { color: deeppink; }
                  </style>`)

        Cypress.$('head').append(el)

        cy.get(`.before-each-head-${id}`).should('exist')
        cy.get(`.before-each-head`).should('have.length', 1)
      }

      const renderAndTestBody = (id) => {
        const el = Cypress.$(`<h1
                  class="before-each-body-${id} before-each-body">
                  testing beforeEach's target cleanup: ${id}
                  </h1>`)

        Cypress.$('body').append(el)

        cy.get(`.before-each-body-${id}`).should('exist')
        cy.get(`.before-each-body`).should('have.length', 1)
      }

      it('Setup-only: cleans up the target between it blocks', () => {
        renderAndTestHead('first')
        renderAndTestBody('first')
      })

      it('Actual assertion: should have cleared out the first specs DOM', () => {
        renderAndTestHead('second')
        renderAndTestBody('second')
      })
    })
  })
})
