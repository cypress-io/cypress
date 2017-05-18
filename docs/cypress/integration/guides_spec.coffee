describe "Guides", ->
  beforeEach ->
    cy.visit('/')

    cy.contains('Guides')
      .click()

  context "Getting Started", ->
    it "gets launched by the 'guides' menu item", ->
      cy.contains('h1', "Why Cypress?")

    it "all links work", ->
      cy.get('a[href^="/guides/getting-started/"]')
        .each (element) ->
          cy.visit(element[0].href)

  context "Cypress Basics", ->
    it "all links work", ->
      cy.get('a[href^="/guides/cypress-basics/"]')
        .each (element) ->
          cy.visit(element[0].href)

  context "Integrating Cypress", ->
    it "all links work", ->
      cy.get('a[href^="/guides/integrating-cypress/"]')
        .each (element) ->
          cy.visit(element[0].href)

  context "Advanced Cypress", ->
    it "all links work", ->
      cy.get('a[href^="/guides/advanced-cypress/"]')
        .each (element) ->
          cy.visit(element[0].href)

  context "Appendices", ->
    it "all links work", ->
      cy.get('a[href^="/guides/appendices/"]')
        .each (element) ->
          cy.visit(element[0].href)
