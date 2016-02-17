describe "Login [000]", ->
  beforeEach ->
    cy
      .visit("/")
      .window().then (win) ->
        {@ipc, @App} = win


        @agents = cy.agents()

        @ipc.handle("get:options", null, {})

  context "without a current user [02s]", ->
    beforeEach ->
      @ipc.handle("get:current:user", null, {})

    it "displays 'Cypress.io' [02t]", ->
      cy.get("#login").contains("Cypress.io")

    it "has Github Login button [02u]", ->
      cy.get("#login").contains("button", "Login with GitHub")

    describe "click 'Login with GitHub' [005]", ->
      beforeEach ->
        cy.get("#login").contains("button", "Login with GitHub").as("loginBtn")

      it "triggers ipc 'window:open' on click [002]", ->
        @agents.spy(@App, "ipc")

        cy
          .get("#login").contains("button", "Login with GitHub").click().then ->
            expect(@App.ipc).to.be.calledWithExactly("window:open", {
              position: "center"
              focus: true
              width: 1000
              height: 635
              preload: false
              title: "Login"
              type: "GITHUB_LOGIN"
            })

      context "on 'window:open' ipc response [007]", ->
        it "displays spinner with 'Logging in...' on ipc response [004]", ->
          cy
            .get("@loginBtn").click()
            .window().then (win) ->
              @ipc.handle("window:open", null, {})
            .contains("Logging in...")

        it "disables 'Login' button [006]", ->
          cy
            .get("@loginBtn").click()
            .window().then (win) ->
              @ipc.handle("window:open", null, {})
            .get("@loginBtn").should("be.disabled")

        it "calls 'loggingIn' on user on ipc response [003]", ->
          cy
            .then ->
              @userLogin = @agents.spy(@App.currentUser, "loggingIn")
            .get("@loginBtn").click()
            .window().then (win) ->
              @ipc.handle("window:open", null, {})
            .contains("Logging in...").then ->
              expect(@userLogin).to.be.called

        it "triggers ipc 'log:in' [008]", ->
          cy
            .get("@loginBtn").click()
            .window().then (win) ->
              @agents.spy(@App, "ipc")
              @ipc.handle("window:open", null, {})
            .contains("Logging in...").then ->
              expect(@App.ipc).to.be.calledWith("log:in", {})

  context "with a current user [02x]", ->
    it "displays email instead of name [02w]", ->
      cy
        .fixture("user").then (@user) ->
          @user.name = null

          @ipc.handle("get:current:user", null, @user)
          @ipc.handle("get:project:paths", null, [])
        .get("header a").should ($a) ->
          expect($a).to.contain(@user.email)

