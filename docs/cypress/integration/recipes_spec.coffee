GUIDES_PATH = '/examples/recipes/logging-in-recipe.html'

describe "Recipes", ->
  context "Logging In", ->
    it "reachable by clicks", ->
      cy.visit('/')

      cy.contains('Examples')
        .click()
      cy.contains('Logging In')
        .click()

      cy.contains('Logging In')
        .should('be.visible')

      cy.url()
        .should('include', GUIDES_PATH)

    # https://github.com/cypress-io/cypress-monorepo/issues/377
    it "has hash that is not -1", ->
      cy.visit(GUIDES_PATH)
      cy.contains('a.toc-link', 'XHR Web Form')
        .should('be.visible')
        .invoke('prop', 'href')
        .should('not.include', '-1')
