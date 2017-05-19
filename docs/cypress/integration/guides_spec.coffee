describe "Guides", ->
  it "menu item goes straight to 'Why Cypress?'", ->
    cy.visit('/')

    cy.contains('Guides')
      .click()
      .contains('h1', "Why Cypress?")

  it "all section links work", ->
    cy.visit('/guides/getting-started/why-cypress.html')

    requestAllLinks = (selector) ->
      cy.get(selector)
        .each (element) ->
          cy.request(element[0].href)

    requestAllLinks('a[href^="/guides/getting-started/"]')
    requestAllLinks('a[href^="/guides/cypress-basics/"]')
    requestAllLinks('a[href^="/guides/integrating-cypress/"]')
    requestAllLinks('a[href^="/guides/advanced-cypress/"]')
    requestAllLinks('a[href^="/guides/appendices/"]')
