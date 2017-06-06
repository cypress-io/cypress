YAML = require('yamljs')
_ = require('lodash')

GUIDES_PATH = "/guides/getting-started/why-cypress"
API_PATH = "/api/welcome/api"
ECO_PATH = "/ecosystem/index"
FAQ_PATH = "/faq/index"

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

  context "Navigation", ->
    beforeEach ->
      cy.visit("/")

    it "displays links to pages", ->
      cy.contains(".main-nav-link", "Guides")
        .should("have.attr", "href").and("include", GUIDES_PATH)

      cy.contains(".main-nav-link", "API")
        .should("have.attr", "href").and("include", API_PATH)

      cy.contains(".main-nav-link", "Ecosystem")
        .should("have.attr", "href").and("include", ECO_PATH)

      cy.contains(".main-nav-link", "FAQ")
        .should("have.attr", "href").and("include", FAQ_PATH)

    it "displays link to github repo", ->
      cy
      .get(".main-nav-link").find(".fa-github").parent()
      .should("have.attr", "href")
      .and("eq", "https://github.com/cypress-io/cypress")

      it "displays language dropdown", ->
        cy.contains("select", "English").find("option").contains("English")

    describe "active nav", ->
      it "higlights guides when on a guides page", ->
        cy
          .visit(GUIDES_PATH + ".html")
            .contains(".main-nav-link", "Guides")
              .should("have.class", "active")

      it "higlights api when on a api page", ->
        cy
          .visit(API_PATH + ".html")
            .contains(".main-nav-link", "API")
              .should("have.class", "active")

      it "higlights eco when on a eco page", ->
        cy
          .visit(ECO_PATH + ".html")
            .contains(".main-nav-link", "Ecosystem")
              .should("have.class", "active")

      it "higlights FAQ when on a FAQ page", ->
        cy
          .visit(FAQ_PATH + ".html")
            .contains(".main-nav-link", "FAQ")
              .should("have.class", "active")

  context "Search", ->
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
        .get(".ds-dropdown-menu").should("not.be.visible")
        .get("#search-input").type("g")
        .get(".ds-dropdown-menu").should("be.visible")
