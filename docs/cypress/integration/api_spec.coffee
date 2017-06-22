YAML = require('yamljs')
_ = require('lodash')

API_PATH = "/api/introduction/api"
API_HTML = API_PATH + '.html'

FIRST_PAGE = "api.html"
NEXT_PAGE = "and.html"

describe "API", ->
  context "Main Menu", ->
    it "Menu goes straight to 'API' homepage", ->
      cy.visit('/')

      cy.contains('API')
        .click()
      cy.contains('h1', "API")

      cy.url()
        .should('match', new RegExp(API_HTML))

  context "Header", ->
    beforeEach ->
      cy.visit(API_PATH + ".html")

    it "should have link to edit doc", ->
      cy.contains("a", "Improve this doc").as("editLink")
      # cy.get("@editLink").should("have.attr", "href")
      #     .and("include", API_PATH + ".md")
      cy.get("@editLink")
        .should("have.attr", "href")
        .and("include", "https://github.com/cypress-io/cypress/issues/new")

  context "Sidebar", ->
    beforeEach ->
      cy.visit(API_PATH + ".html")

      cy.readFile("source/_data/sidebar.yml").then (yamlString) ->
        @sidebar = YAML.parse(yamlString)
        @sidebarTitles = _.keys(@sidebar.api)

        @sidebarLinkNames =  _.reduce @sidebar.api, (memo, nestedObj, key) ->
           memo.concat(_.keys(nestedObj))
        , []

        @sidebarLinks =  _.reduce @sidebar.api, (memo, nestedObj, key) ->
             memo.concat(_.values(nestedObj))
          , []

      cy.readFile("themes/cypress/languages/en.yml").then (yamlString) ->
          @english = YAML.parse(yamlString)

    it "displays current page as highlighted", ->
      cy.get("#sidebar").find(".current")
        .should("have.attr", "href").and("include", "api.html")

    it "displays English titles in sidebar", ->
      cy.get("#sidebar")
        .find(".sidebar-title").each (displayedTitle, i) ->
          englishTitle  = @english.sidebar.api[@sidebarTitles[i]]
          expect(displayedTitle.text()).to.eq(englishTitle)

    it "displays English link names in sidebar", ->
      cy.get("#sidebar")
        .find(".sidebar-link").first(5).each (displayedLink, i) ->
          englishLink  = @english.sidebar.api[@sidebarLinkNames[i]]
          expect(displayedLink.text().trim()).to.eq(englishLink)

    it "displays English links in sidebar", ->
      cy.get("#sidebar")
        .find(".sidebar-link").each (displayedLink, i) ->
          sidebarLink  = @sidebarLinks[i]
          expect(displayedLink.attr('href')).to.include(sidebarLink)

  ## This is running too slow to include for now
  ## Issue #431 Needs to be fixed first
  ## https://github.com/cypress-io/cypress/issues/431
  context.skip "Table of Contents", ->
    beforeEach ->
      cy.visit(API_PATH + ".html")

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
      cy.visit(API_PATH + ".html")

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
