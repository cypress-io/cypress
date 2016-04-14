describe "Login", ->
  beforeEach ->
    cy
      .visit("/")
      .window().then (win) ->
        {@ipc, @App} = win

        @agents = cy.agents()

        @agents.spy(@App, "ipc")

        @ipc.handle("get:options", null, {})

  context "without a current user", ->
    beforeEach ->
      @ipc.handle("get:current:user", null, {})

    it "displays 'Cypress.io'", ->
      cy.get("#login").contains("Cypress.io")

    it "has Github Login button", ->
      cy.get("#login").contains("button", "Login with GitHub")

    it "displays help link", ->
      cy.contains("a", "Need help?")

    it "opens link to docs on click of help link", ->
      cy.contains("a", "Need help?").click().then ->
        expect(@App.ipc).to.be.calledWith("external:open", "https://docs.cypress.io")

    describe "click 'Login with GitHub'", ->
      beforeEach ->
        cy.get("#login").contains("button", "Login with GitHub").as("loginBtn")

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
            @ipc.handle("window:open", {alreadyOpen: true}, null)
          .get("#login").contains("button", "Login with GitHub").should("not.be.disabled")

      context "on 'window:open' ipc response", ->
        beforeEach ->
          cy
            .get("@loginBtn").click().then ->
              @ipc.handle("window:open", null, "code-123")

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
            cy
              .contains("Logging in...")
              .fixture("user").then (@user) ->
                @ipc.handle("log:in", null, @user)

          it "triggers get:project:paths", ->
            expect(@App.ipc).to.be.calledWith("get:project:paths")

          it "displays username in UI", ->
            cy
              .then ->
                @ipc.handle("get:project:paths", null, [])
              .get("header a").should ($a) ->
                expect($a).to.contain(@user.name)

          it "has login button enabled on logout", ->
            cy
              .then ->
                @ipc.handle("get:project:paths", null, [])
              .get("header a").contains("Jane").click()
            cy
              .contains("Logout").click().then ->
                @ipc.handle("log:out")
              .get("@loginBtn").should("not.be.disabled")


        describe "on ipc 'log:in' error", ->
          it "displays error in ui", ->
            cy
              .fixture("user").then (@user) ->
                @ipc.handle("log:in", {message: "There's an error"}, null)
              .get(".alert-danger")
                .should("be.visible")
                .contains("There's an error")

          it "login button should be enabled", ->
            cy
              .fixture("user").then (@user) ->
                @ipc.handle("log:in", {message: "There's an error"}, null)
              .get("@loginBtn").should("not.be.disabled")


        describe "on ipc 'log:in' unauthorized error", ->
          beforeEach ->
            cy
              .fixture("user").then (@user) ->
                @ipc.handle("log:in", {
                  error: "Your email: 'foo@bar.com' has not been authorized."
                  message: "Your email: 'foo@bar.com' has not been authorized."
                  name: "StatusCodeError"
                  statusCode: 401
                }, null)

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
                expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/guides/installing-and-running#section-your-email-has-not-been-authorized-")

          it "login button should be enabled", ->
            cy
              .get("@loginBtn").should("not.be.disabled")