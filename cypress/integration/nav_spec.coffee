{deferred, stubIpc} = require("../support/util")

describe "Navigation", ->
  beforeEach ->
    cy
      .fixture("user").as("user")
      .visit("/")
      .window().then (win) ->
        {@App} = win
        cy.stub(@App, "ipc").as("ipc")

        @getCurrentUser = deferred()

        stubIpc(@App.ipc, {
          "on:menu:clicked": ->
          "close:browser": ->
          "close:project": ->
          "on:focus:tests": ->
          "updater:check": (stub) => stub.resolves(false)
          "get:options": (stub) => stub.resolves({})
          "get:current:user": (stub) => stub.returns(@getCurrentUser.promise)
          "get:projects": (stub) -> stub.resolves([])
          "get:project:statuses": (stub) -> stub.resolves([])
          "log:out": (stub) -> stub.resolves({})
        })

        @App.start()

  context.skip "without a current user", ->
    beforeEach ->
      @getCurrentUser.resolve({})

    context "links", ->
      it "displays link to docs", ->
        cy.get("nav").contains("Docs")

      it "opens link to docs on click", ->
        cy
          .get("nav").contains("Docs").click().then ->
            expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io")

      it "displays link to chat", ->
        cy.get("nav").contains("Chat")

      it "opens link to chat on click", ->
        cy
          .get("nav").contains("Chat").click().then ->
            expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/chat")

      it "displays login button", ->
        cy
          .get("nav a").should ($a) ->
            expect($a).to.contain("Log In")

      describe "login of user", ->
        it "routes to login on click", ->
          cy
            .contains("Log In").click()
            .hash().should("include", "login")

        it "displays login screen on login", ->
          cy
            .contains("Log In").click()
          cy.contains(".btn", "Log In with GitHub")

  context "with a current user", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)

    context "links", ->
      it "displays link to docs", ->
        cy.get("nav").contains("Docs")

      it "opens link to docs on click", ->
        cy
          .get("nav").contains("Docs").click().then ->
            expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io")

      it "displays link to chat", ->
        cy.get("nav").contains("Chat")

      it "opens link to chat on click", ->
        cy
          .get("nav").contains("Chat").click().then ->
            expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/chat")

      it "displays user name", ->
        cy
          .get("nav a").should ($a) ->
            expect($a).to.contain(@user.name)

      it "shows dropdown on click of user name", ->
        cy.contains("Jane Lane").click()
        cy.contains("Log Out").should("be.visible")

      describe "logging out", ->

        it "triggers logout on click of logout", ->
          cy.contains("Jane Lane").click()
          cy.contains("a", "Log Out").click().then ->
            expect(@App.ipc).to.be.calledWith("log:out")

        it.skip "displays login button", ->
          cy.contains("Jane Lane").click()
          cy.contains("a", "Log Out").click()
          cy
            .get("nav a").should ($a) ->
              expect($a).to.contain("Log In")

        it "displays login screen", ->
          cy.contains("Jane Lane").click()
          cy.contains("a", "Log Out").click()
          cy.contains(".btn", "Log In with GitHub")

  context "when current user has no name", ->
    beforeEach ->
      @user.name = null
      @getCurrentUser.resolve(@user)

    it "displays email instead of name", ->
      cy
        .get("nav a").should ($a) ->
          expect($a).to.contain(@user.email)
