{deferred, stubIpc} = require("../support/util")

describe "Login", ->
  beforeEach ->
    cy
      .fixture("user").as("user")
      .visit("/#login")
      .window().then (win) ->
        {@App} = win
        cy.stub(@App, "ipc").as("ipc")

        @getCurrentUser = deferred()
        @openWindow = deferred()
        @login = deferred()

        stubIpc(@App.ipc, {
          "on:menu:clicked": ->
          "close:browser": ->
          "close:project": ->
          "on:focus:tests": ->
          "updater:check": (stub) => stub.resolves(false)
          "get:options": (stub) => stub.resolves({})
          "get:current:user": (stub) => stub.returns(@getCurrentUser.promise)
          "window:open": (stub) => stub.returns(@openWindow.promise)
          "log:in": (stub) => stub.returns(@login.promise)
        })

        @App.start()

  context "without a current user", ->
    beforeEach ->
      @getCurrentUser.resolve({})

    describe "login display", ->
      it "displays Cypress logo", ->
        cy
          .get("#login")
            .find("img")
              .should("have.attr", "src")
              .and("include", "cypress-inverse")

      it "has login url", ->
        cy
          .location().its("hash")
            .should("contain", "login")

      it "has Github Login button", ->
        cy
          .get("#login").contains("button", "Log In with GitHub")

      it "displays help link", ->
        cy.contains("a", "Need help?")

      it "opens link to login docs on click of help link", ->
        cy.contains("a", "Need help?").click().then ->
          expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/logging-in")

    describe "click 'Log In with GitHub'", ->
      beforeEach ->
        cy
          .get("#login")
            .contains("button", "Log In with GitHub").as("loginBtn")

      it "triggers ipc 'window:open' on click", ->
        cy
          .get("@loginBtn").click().then ->
            expect(@App.ipc).to.be.calledWithExactly("window:open", {
              position: "center"
              focus: true
              width: 1000
              height: 635
              preload: false
              title: "Login"
              type: "GITHUB_LOGIN"
            })

      it "does not lock up UI if login is clicked multiple times", ->
        cy
          .get("@loginBtn").click().click().then ->
            @openWindow.reject({name: "foo", message: "bar", alreadyOpen: true})
          .get("#login").contains("button", "Log In with GitHub").should("not.be.disabled")

      context "on 'window:open' ipc response", ->
        beforeEach ->
          cy
            .get("@loginBtn").click().then ->
              @openWindow.resolve("code-123")

        it "triggers ipc 'log:in'", ->
          cy.then ->
            expect(@App.ipc).to.be.calledWith("log:in", "code-123")

        it "displays spinner with 'Logging in...' on ipc response", ->
          cy.contains("Logging in...")

        it "disables 'Login' button", ->
          cy
            .get("@loginBtn").should("be.disabled")

        describe "on ipc log:in success", ->
          beforeEach ->
            stubIpc(@App.ipc, {
              "get:projects": (stub) -> stub.resolves([])
              "get:project:statuses": (stub) -> stub.resolves([])
            })

            @login.resolve(@user)

          it "triggers get:projects", ->
            cy.get("nav a").then =>
              expect(@App.ipc).to.be.calledWith("get:projects")

          it "displays username in UI", ->
            cy
              .get("nav a").should ($a) ->
                expect($a).to.contain(@user.name)

          context "log out", ->
            it.skip "displays login button on logout", ->
              cy
                .get("nav a").contains("Jane").click()
              cy
                .contains("Log Out").click()
                .get(".nav").contains("Log In")

            it.skip "has login button enabled after logout and re log in", ->
              cy
                .get("nav a").contains("Jane").click()
              cy
                .contains("Log Out").click()
                .get(".nav").contains("Log In").click()
                .get("@loginBtn").should("not.be.disabled")

            it "goes back to login on logout", ->
              cy
                .get("nav a").contains("Jane").click()
              cy
                .contains("Log Out").click().then ->
                  expect(@App.ipc).to.be.calledWith("clear:github:cookies")

                .get("#login")

            it "has login button enabled on logout", ->
              cy
                .get("nav a").contains("Jane").click()
              cy
                .contains("Log Out").click().then ->
                  expect(@App.ipc).to.be.calledWith("clear:github:cookies")
                .get("@loginBtn").should("not.be.disabled")

            it "calls clear:github:cookies", ->
              cy
                .get("nav a").contains("Jane").click()
              cy
                .contains("Log Out").click().then ->
                  expect(@App.ipc).to.be.calledWith("clear:github:cookies")

            it "calls log:out", ->
              cy
                .get("nav a").contains("Jane").click()
              cy
                .contains("Log Out").click().then ->
                  expect(@App.ipc).to.be.calledWith("log:out")

        describe "on ipc 'log:in' error", ->
          beforeEach ->
            @login.reject({name: "foo", message: "There's an error"})

          it "displays error in ui", ->
            cy
              .get(".alert-danger")
                .should("be.visible")
                .contains("There's an error")

          it "login button should be enabled", ->
            cy
              .get("@loginBtn").should("not.be.disabled")

        describe "on ipc 'log:in' unauthorized error", ->
          beforeEach ->
            @login.reject({
              error: "Your email: 'foo@bar.com' has not been authorized."
              message: "Your email: 'foo@bar.com' has not been authorized."
              name: "StatusCodeError"
              statusCode: 401
            })

          it "displays error in ui", ->
            cy
              .get(".alert-danger")
                .should("be.visible")
                .contains("Your email: 'foo@bar.com' has not been authorized")

          it "displays authorized help link", ->
            cy
              .contains("a", "Why am I not authorized?")

          it "opens link to docs on click of help link", ->
            cy
              .contains("a", "Why am I not authorized?").click().then ->
                expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/email-not-authorized")

          it "login button should be enabled", ->
            cy
              .get("@loginBtn").should("not.be.disabled")
