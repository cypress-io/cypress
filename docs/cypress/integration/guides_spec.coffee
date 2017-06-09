YAML = require('yamljs')
_ = require('lodash')

GUIDES_PATH = '/guides/getting-started/why-cypress'
GUIDES_HTML = GUIDES_PATH + '.html'

FIRST_PAGE = "why-cypress.html"
NEXT_PAGE = "installing-cypress.html"

MAILTO_REGEX = /mailto:/

Cypress.isHeadless = true
window.top.$Cypress.isHeadless = true

describe "Guides", ->
  context "Main Menu", ->
    it "Menu goes straight to 'Why Cypress?'", ->
      cy.visit('/')

      cy.contains('Guides')
        .click()
        .contains('h1', "Why Cypress?")

      cy.url()
        .should('match', new RegExp(GUIDES_HTML))

  context "Header", ->
    beforeEach ->
      cy.visit(GUIDES_PATH + ".html")

    it "should have link to edit doc", ->
      cy.contains("a", "Improve this doc").as("editLink")
      # cy.get("@editLink").should("have.attr", "href")
      #     .and("include", GUIDES_PATH + ".md")
      cy.get("@editLink").should("have.attr", "href")
          .and("include", "https://github.com/cypress-io/cypress/issues/new")

  context "Sidebar", ->
    beforeEach ->
      cy.visit(GUIDES_PATH + ".html")

      cy.readFile("source/_data/sidebar.yml").then (yamlString) ->
        @sidebar = YAML.parse(yamlString)
        @sidebarTitles = _.keys(@sidebar.guides)

        @sidebarLinkNames =  _.reduce @sidebar.guides, (memo, nestedObj, key) ->
           memo.concat(_.keys(nestedObj))
        , []

        @sidebarLinks =  _.reduce @sidebar.guides, (memo, nestedObj, key) ->
             memo.concat(_.values(nestedObj))
          , []

      cy.readFile("themes/cypress/languages/en.yml").then (yamlString) ->
          @english = YAML.parse(yamlString)

    it "displays current page as highlighted", ->
      cy
        .get("#sidebar").find(".current")
        .should("have.attr", "href").and("include", "why-cypress.html")

    it "displays English titles in sidebar", ->
      cy
        .get("#sidebar")
          .find(".sidebar-title").each (displayedTitle, i) ->
            englishTitle  = @english.sidebar.guides[@sidebarTitles[i]]
            expect(displayedTitle.text()).to.eq(englishTitle)

    it "displays English link names in sidebar", ->
      cy
        .get("#sidebar")
          .find(".sidebar-link").first(5).each (displayedLink, i) ->
            englishLink  = @english.sidebar.guides[@sidebarLinkNames[i]]
            expect(displayedLink.text().trim()).to.eq(englishLink)

    it "displays English links in sidebar", ->
      cy
        .get("#sidebar")
          .find(".sidebar-link").each (displayedLink, i) ->
            sidebarLink  = @sidebarLinks[i]
            expect(displayedLink.attr('href')).to.include(sidebarLink)

  ## This is running too slow to include for now
  ## Issue #431 Needs to be fixed first
  ## https://github.com/cypress-io/cypress/issues/431
  context.skip "Table of Contents", ->
    before ->
      cy.visit(GUIDES_PATH + ".html")

    it "displays toc", ->
      cy.get('.sidebar-link').each (linkElement) ->
        cy.request(linkElement[0].href).its('body').then (body) ->

          $body = Cypress.$(body)

          $h1s = $body.find('.article h1').not('.article-title')
          $h2s = $body.find('.article h2')

          $h1links = $body.find('.toc-level-1>.toc-link')
          $h2links = $body.find('.toc-level-2>.toc-link')

          $h1s.each (i, el) ->
            $h1 = Cypress.$(el)
            $link = $h1links.eq(i)

            expect($link.text()).to.eq($h1.text())
            expect($link.attr('href')).to.eq('#' + $h1.attr('id'))

          $h2s.each (i, el) ->
            $h2 = Cypress.$(el)
            $link = $h2links.eq(i)

            expect($link.text()).to.eq($h2.text())
            expect($link.attr('href')).to.eq('#' + $h2.attr('id'))

  context "Pagination", ->
    beforeEach ->
      cy.visit(GUIDES_PATH + ".html")

    it "does not display Prev link on first page", ->
      cy.get(".article-footer-prev").should("not.exist")

    it "displays Next link", ->
      cy.get(".article-footer-next").should("have.attr", "href").and("include", NEXT_PAGE)

    describe "click on Next page", ->
      beforeEach ->
        cy.get(".article-footer-next").click()
        cy.url().should("contain", NEXT_PAGE)

      it "should display Prev link", ->
        cy.get(".article-footer-prev").should("be.visible")

      it "clicking on Prev link should go back to original page", ->
        cy.get(".article-footer-prev").click()
        cy.url().should("contain", FIRST_PAGE)

  context "Comments", ->
    it "displays comments section", ->
      cy.get("#comments")

  context "Content", ->
    it "all section & body links work", ->
      filterMailtos = (urlsToFilter) ->
        Cypress._.filter(urlsToFilter, (url) -> not url.match(MAILTO_REGEX))

      alreadySeen = []
      cullAlreadySeenUrls = (urlsToCull) ->
        # difference is what to return
        urlsToVisit = Cypress._.difference(urlsToCull, alreadySeen)
        # union is what to persist
        alreadySeen = Cypress._.union(urlsToCull, alreadySeen)

        return urlsToVisit

      # SPIDER ALL THE THINGS
      cy.visit(GUIDES_HTML)

      cy.get('.sidebar-link')
        .each (linkElement) ->
          cy.request(linkElement[0].href).its('body').then (body) ->
            elements = Cypress.$(body).find('a').not('.sidebar-link, .toc-link, .main-nav-link, .mobile-nav-link, .article-edit-link, .article-anchor, #article-toc-top, #mobile-nav-toggle, .article-footer-next, .article-footer-prev, .headerlink, #logo, #footer')

            withoutMailtos = filterMailtos(Cypress._.map(elements, "href"))

            urls = cullAlreadySeenUrls(withoutMailtos)

            cy.wrap(urls).each (url) ->
              cy.request(url)
