YAML = require('yamljs')
_ = require('lodash')

FAQ_PATH = "/faq/questions/general-questions-faq"

describe "FAQ", ->
  beforeEach ->
    cy.server()
    cy.visit(FAQ_PATH + ".html")

  context "Main Menu", ->
    it "Menu goes straight to 'General'", ->
      cy.visit('/')

      cy.contains('FAQ')
        .click()
      cy.contains('h1', "General Questions")

      cy.url()
        .should('include', FAQ_PATH)

  context "Sidebar", ->
    beforeEach ->
      cy.readFile("source/_data/sidebar.yml").then (yamlString) ->
        @sidebar = YAML.parse(yamlString)
        @sidebarTitles = _.keys(@sidebar.faq)

        @sidebarLinkNames =  _.reduce @sidebar.faq, (memo, nestedObj, key) ->
           memo.concat(_.keys(nestedObj))
        , []

        @sidebarLinks =  _.reduce @sidebar.faq, (memo, nestedObj, key) ->
             memo.concat(_.values(nestedObj))
          , []

      cy.readFile("themes/cypress/languages/en.yml").then (yamlString) ->
          @english = YAML.parse(yamlString)

    it "displays current page as highlighted", ->
      cy.get("#sidebar").find(".current")
        .should("have.attr", "href").and("include", FAQ_PATH + ".html")

    it "displays English titles in sidebar", ->
      cy.get("#sidebar")
        .find(".sidebar-title").each (displayedTitle, i) ->
          englishTitle  = @english.sidebar.faq[@sidebarTitles[i]]
          expect(displayedTitle.text()).to.eq(englishTitle)

    it "displays English link names in sidebar", ->
      cy.get("#sidebar")
        .find(".sidebar-link").first(5).each (displayedLink, i) ->
          englishLink  = @english.sidebar.faq[@sidebarLinkNames[i]]
          expect(displayedLink.text().trim()).to.eq(englishLink)

    it "displays English links in sidebar", ->
      cy.get("#sidebar")
        .find(".sidebar-link").each (displayedLink, i) ->
          sidebarLink  = @sidebarLinks[i]
          expect(displayedLink.attr('href')).to.include(sidebarLink)

  context "Table of Contents", ->
    it "displays toc links", ->
      cy.get('.toc-level-2>.toc-link').as('tocLinks')

      cy.get('.faq h2').not('.article-title').each ($h2, i) =>
        cy.get('@tocLinks').eq(i).then ($link) =>
          expect($link.text()).to.eq($h2.text())
          expect($link.attr('href')).to.eq('#' + $h2.attr('id'))
