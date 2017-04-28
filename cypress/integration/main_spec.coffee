YAML = require('yamljs')
_ = require('lodash')

describe "Documentation", ->
  beforeEach ->
    cy.server()

  context "Pages", ->
    describe "404", ->
      it "displays", ->
        cy
          .visit("/404.html")
          .contains("404")

    describe "Homepage", ->
      beforeEach ->
        cy.visit("/")

      it "displays", ->
        cy.contains("Homepage")

    describe "Navigation", ->
      beforeEach ->
        cy.visit("/")

      it "displays links to guides and api", ->
        cy
          .contains(".main-nav-link", "Guides")
            .should("have.attr", "href")
              .and("include", "/cypress-documentation/guides/welcome/guides.html")
        cy
          .contains(".main-nav-link", "API")
            .should("have.attr", "href")
              .and("include", "/cypress-documentation/api/welcome/api.html")

      it "displays link to github repo", ->
        cy
          .get(".main-nav-link").find(".fa-github").parent()
            .should("have.attr", "href")
              .and("eq", "https://github.com/cypress-io/cypress")

      it "displays language dropdown", ->
        cy.contains("select", "English").find("option").contains("English")

    describe.skip "Search", ->

    describe "Guides & API", ->
      beforeEach ->
        @guidesHomepage = "/guides/welcome/guides"

        cy.visit(@guidesHomepage + ".html")

      context "Header", ->
        it.skip "should display capitalized title of doc", ->
          cy
            .contains("h1", "Guides")

        it "should have link to edit doc", ->
          cy
            .contains("a", "Improve this doc").as("editLink")
            .get("@editLink").should("have.attr", "href")
              .and("include", @guidesHomepage + ".md")
            .get("@editLink").should("have.attr", "href")
              .and("include", "https://github.com/cypress-io/cypress-documentation/edit/master/source/")

      context "Sidebar", ->
        beforeEach ->
          cy
            .readFile("source/_data/sidebar.yml").then (yamlString) ->
              @sidebar = YAML.parse(yamlString)
              @sidebarTitles = _.keys(@sidebar.guides)
              #
              # @sidebarLinks = _
              #   .chain(@sidebar.guides)
              #   .map((value, key) ->
              #     value
              #     debugger
              #   )

            .readFile("themes/cypress/languages/en.yml").then (yamlString) ->
              @english = YAML.parse(yamlString)

        it.skip "displays current page as highlighted", ->

        it "displays English titles in sidebar", ->
          cy
            .get("#sidebar")
              .find(".sidebar-title").each (displayedTitle, i) ->
                englishTitle  = @english.sidebar.guides[@sidebarTitles[i]]

                expect(displayedTitle.text()).to.eq(englishTitle)

        it.skip "displays English link names in sidebar", ->
          cy
            .get("#sidebar")
              .find(".sidebar-link").each (displayedLink, i) ->

                # englishLink  = @english.sidebar.guides[sidebarTitles[i]]

                # expect(displayedLink.text()).to.eq(englishTitle)


      context.skip "Table of Contents", ->

      context.skip "Pagination", ->

      context "Comments", ->
        it "displays comments section", ->
          cy.get("#comments").should("be.visible")
