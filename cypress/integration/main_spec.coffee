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
        cy.visit("/guides/welcome/guides.html")

      context.skip "Sidebar", ->

      context.skip "Table of Contents", ->

      context.skip "Pagination", ->

      context "Comments", ->
        it "displays comments section", ->
          cy.get("#comments").should("be.visible")
