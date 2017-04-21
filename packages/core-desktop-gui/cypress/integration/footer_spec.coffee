{deferred, stubIpc} = require("../support/util")

describe "Footer", ->
  beforeEach ->
    cy
      .visit("/")
      .fixture("user").as("user")
      .window().then (win) ->
        {@App} = win
        cy.stub(@App, "ipc").as("ipc")

        @getUser = deferred()
        @getProjects = deferred()

        @version = "1.0.0"

        stubIpc(@App.ipc, {
          "get:options": (stub) => stub.resolves({version: @version})
          "get:current:user": (stub) => stub.resolves(@getUser.promise)
          "on:menu:clicked": ->
          "close:browser": ->
          "close:project": ->
          "on:focus:tests": ->
          "updater:check": (stub) => stub.resolves(false)
          "get:projects": (stub) -> stub.resolves([])
          "get:project:statuses": (stub) -> stub.resolves([])
        })

        @App.start()

  describe "when logged out", ->
    beforeEach ->
      @getUser.resolve(null)

    it "hides footer", ->
      cy.get("footer").should("not.be.visible")

  describe "when logged in", ->
    beforeEach ->
      @getUser.resolve(@user)

    it "shows footer", ->
      cy.get("footer").should("be.visible")

    it "displays version sent from get:options", ->
      cy.get("footer").contains(@version)

    it "opens link to changelog on click of changelog", ->
      cy
        .get("a").contains("Changelog").click().then ->
          expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/changelog")
