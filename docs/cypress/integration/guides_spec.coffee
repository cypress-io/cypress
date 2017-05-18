describe "Guides", ->
  context "Getting Started", ->
    beforeEach ->
      cy.visit('/')

      cy.contains('Guides')
        .click()

    it "gets launched by the 'guides' menu item", ->
      cy.contains('h1', "Why Cypress?")

    it "all links work", ->
      cy.get('a[href^="/guides/getting-started/"]')
        .each (element) ->
          cy.visit(element[0].href)
