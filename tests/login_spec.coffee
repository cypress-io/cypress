describe "Login [000]", ->
  beforeEach ->
    cy
      .visit("/")
      .window().then (win) ->
        {@ipc, @App} = win

        @agents = cy.agents()

        @agents.spy(@App, "ipc")

        @ipc.handle("get:options", null, {})

  context "without a current user [02s]", ->
    beforeEach ->
      @ipc.handle("get:current:user", null, {})

    it "displays 'Cypress.io' [02t]", ->
      cy.get("#login").contains("Cypress.io")

    it "has Github Login button [02u]", ->
      cy.get("#login").contains("button", "Login with GitHub")

    it "displays help link [05r]", ->
      cy.contains("a", "Need help?")

    it "opens link to docs on click of help link [05s]", ->
      cy.contains("a", "Need help?").click().then ->
        expect(@App.ipc).to.be.calledWith("external:open", "http://docs.cypress.io")

    describe "click 'Login with GitHub' [005]", ->
      beforeEach ->
        cy.get("#login").contains("button", "Login with GitHub").as("loginBtn")

      it "triggers ipc 'window:open' on click [002]", ->
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

      it "does not lock up UI if login is clicked multiple times [05u]", ->
        cy
          .get("@loginBtn")
            .click().click()
          .get("@loginBtn").should("not.be.disabled")


      context "on 'window:open' ipc response [007]", ->
        it "triggers ipc 'log:in' [008]", ->
          cy
            .get("@loginBtn").click().then ->
              @ipc.handle("window:open", null, {})
            .then ->
              expect(@App.ipc).to.be.calledWith("log:in", {})

        describe "on ipc 'log:in' success [00a]", ->
          beforeEach ->
            cy
              .get("@loginBtn").click().then ->
                @ipc.handle("window:open", null, {})
              .fixture("user").then (@user) ->
                @ipc.handle("log:in", null, @user)

          it "displays spinner with 'Logging in...' on ipc response [004]", ->
            cy
              .contains("Logging in...")

          it "disables 'Login' button [006]", ->
            cy
              .get("@loginBtn").should("be.disabled")

          it "triggers get:project:paths [05t]", ->
            cy
              .contains("Logging in...").then ->
                expect(@App.ipc).to.be.calledWith("get:project:paths")

          it "displays username in UI [00c]", ->
            cy
              .then ->
                @ipc.handle("get:project:paths", null, [])
              .get("header a").should ($a) ->
                expect($a).to.contain(@user.name)

        describe "on ipc 'log:in' error [00a]", ->
          beforeEach ->
            cy
              .get("@loginBtn").click().then ->
                @ipc.handle("window:open", null, {})

          it "displays error in ui [00d]", ->
            cy
              .fixture("user").then (@user) ->
                @ipc.handle("log:in", {message: "There's an error"}, null)
              .get(".alert-danger")
                .should("be.visible")
                .contains("There's an error")

          it "login button should be enabled [00e]", ->
            cy
              .fixture("user").then (@user) ->
                @ipc.handle("log:in", {message: "There's an error"}, null)
              .get("@loginBtn").should("not.be.disabled")