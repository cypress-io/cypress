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

    describe "Search", ->
      beforeEach ->
        cy.visit("/")

      it "posts to Algolia api with correct index on search", ->
        cy
          .route({
            method: "POST",
            url: /algolia/
          }).as("postAlgolia")
          .get("#search-input").type("g")
          .wait("@postAlgolia").then (xhr) ->
            expect(xhr.requestBody.requests[0].indexName).to.eq("cypress")

      it "displays algolia dropdown on search", ->
        cy
          .get(".aa-dropdown-menu").should("not.be.visible")
          .get("#search-input").type("g")
          .get(".aa-dropdown-menu").should("be.visible")

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
            .should("have.attr", "href").and("include", "guides.html")

        it "displays English titles in sidebar", ->
          cy
            .get("#sidebar")
              .find(".sidebar-title").each (displayedTitle, i) ->
                englishTitle  = @english.sidebar.guides[@sidebarTitles[i]]

                expect(displayedTitle.text()).to.eq(englishTitle)

        it "displays English link names in sidebar", ->
          cy
            .get("#sidebar")
              .find(".sidebar-link").each (displayedLink, i) ->
                englishLink  = @english.sidebar.guides[@sidebarLinkNames[i]]

                expect(displayedLink.text().trim()).to.eq(englishLink)

        it "displays English links in sidebar", ->
          cy
            .get("#sidebar")
              .find(".sidebar-link").each (displayedLink, i) ->
                sidebarLink  = @sidebarLinks[i]

                expect(displayedLink.attr('href')).to.include(sidebarLink)

      context.skip "Table of Contents", ->

      context "Pagination", ->
        beforeEach ->
          @firstPage = "guides.html"
          @nextPage = "our-goals.html"

        it "does not display Prev link on first page", ->
          cy.get(".article-footer").should("not.contain", "Prev")

        it "displays Next link", ->
          cy.get(".article-footer").contains("Next").should("have.attr", "href").and("include", @nextPage)

        describe "click on Next page", ->
          beforeEach ->
            cy.get(".article-footer").contains("Next").click()
            cy.url().should("contain", @nextPage)

          it "should display Prev link", ->
            cy.get(".article-footer").should("contain", "Prev")

          it "clicking on Prev link should go back to original page", ->
            cy.get(".article-footer").contains("Prev").click()
            cy.url().should("contain", @firstPage)

      context "Comments", ->
        it "displays comments section", ->
          cy.get("#comments").should("be.visible")
