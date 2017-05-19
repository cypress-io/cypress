getLinks = ->
  @links ?= do ->
    cy.visit('/guides/getting-started/why-cypress.html')

    {
      gettingStarted:     cy.get('a[href^="/guides/getting-started/"]')
      cypressBasics:      cy.get('a[href^="/guides/cypress-basics/"]')
      integratingCypress: cy.get('a[href^="/guides/integrating-cypress/"]')
      advancedCypress:    cy.get('a[href^="/guides/advanced-cypress/"]')
      appendices:         cy.get('a[href^="/guides/appendices/"]')
    }

describe "Guides", ->
  it "menu item goes straight to 'Why Cypress?'", ->
    cy.visit('/')

    cy.contains('Guides')
      .click()
      .contains('h1', "Why Cypress?")

  context "sections: ", ->
    context "Getting Started", ->
      it "all links work", ->
        getLinks().gettingStarted
          .each (element) ->
            cy.request(element[0].href)

    context "Cypress Basics", ->
      it "all links work", ->
        getLinks().cypressBasics
          .each (element) ->
            cy.request(element[0].href)

    context "Integrating Cypress", ->
      it "all links work", ->
        getLinks().integratingCypress
          .each (element) ->
            cy.request(element[0].href)

    context "Advanced Cypress", ->
      it "all links work", ->
        getLinks().advancedCypress
          .each (element) ->
            cy.request(element[0].href)

    context "Appendices", ->
      it "all links work", ->
        getLinks().appendices
          .each (element) ->
            cy.request(element[0].href)
