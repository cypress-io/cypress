GUIDES_PATH = '/guides/getting-started/why-cypress.html'

describe "Guides", ->
  it "main menu item goes straight to 'Why Cypress?'", ->
    cy.visit('/')

    cy.contains('Guides')
      .click()
      .contains('h1', "Why Cypress?")

    cy.url()
      .should('match', new RegExp(GUIDES_PATH))

  it "all section & body links work", ->
    filterMailtos = (urlsToFilter) ->
      Cypress._.filter(urlsToFilter, (url) -> not url.match(/mailto:/))

    alreadySeen = []
    cullAlreadySeenUrls = (urlsToCull) ->
      # difference is what to return
      urlsToVisit = Cypress._.difference(urlsToCull, alreadySeen)
      # union is what to persist
      alreadySeen = Cypress._.union(urlsToCull, alreadySeen)

      return urlsToVisit

    # SPIDER ALL THE THINGS
    cy.visit(GUIDES_PATH)

    cy.get('.sidebar-link')
      .each (linkElement) ->
        # .first()
        # .then (linkElement) ->
        cy.visit linkElement[0].href

        cy.get('a')
          .not('.sidebar-link, .toc-link, .main-nav-link, .mobile-nav-link, .article-edit-link, .article-anchor, #article-toc-top, #mobile-nav-toggle, .article-footer-next, .headerlink, #logo')
          .then (elements) ->
            withoutMailtos = filterMailtos(Cypress._.map(elements, "href"))
            return cullAlreadySeenUrls(withoutMailtos)
          .each (url) ->
            cy.request(url)
