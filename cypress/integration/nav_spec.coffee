describe "Navigation", ->
  beforeEach ->
    cy
      .visit("/")
      .window().then (win) ->
        {@ipc, @App} = win
        @agents = cy.agents()
        @agents.spy(@App, "ipc")
        @ipc.handle("get:options", null, {})

  context.skip "without a current user", ->
    context "links", ->
      beforeEach ->
        cy.then () ->
          @ipc.handle("get:current:user", null, {})
          @ipc.handle("get:projects", null, [])

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
            expect(@App.ipc).to.be.calledWith("external:open", "https://gitter.im/cypress-io/cypress")

    describe "login in header", ->
      beforeEach ->
        cy
          .then ->
            @ipc.handle("get:current:user", null, {})
            @ipc.handle("get:projects", null, [])

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
    context "links", ->
      beforeEach ->
        cy
          .fixture("user").then (@user) ->
            @ipc.handle("get:current:user", null, @user)
            @ipc.handle("get:projects", null, [])

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
            expect(@App.ipc).to.be.calledWith("external:open", "https://gitter.im/cypress-io/cypress")

    context "with a current user", ->
      describe "username in header", ->
        it "displays user name", ->
          cy
            .fixture("user").then (@user) ->
              @ipc.handle("get:current:user", null, @user)
              @ipc.handle("get:projects", null, [])
            .get("nav a").should ($a) ->
              expect($a).to.contain(@user.name)

        it "displays email instead of name", ->
          cy
            .fixture("user").then (@user) ->
              @user.name = null

              @ipc.handle("get:current:user", null, @user)
              @ipc.handle("get:projects", null, [])
            .get("nav a").should ($a) ->
              expect($a).to.contain(@user.email)

      describe "logout of user", ->
        beforeEach ->
          cy
            .fixture("user").then (@user) ->
              @ipc.handle("get:current:user", null, @user)
              @ipc.handle("get:projects", null, [])

        it "shows dropdown on click of user name", ->
          cy.contains("Jane Lane").click()
          cy.contains("Log Out").should("be.visible")

        it "triggers logout on click of logout", ->
          cy.contains("Jane Lane").click()
          cy.contains("a", "Log Out").click().then ->
            expect(@App.ipc).to.be.calledWith("log:out")

        it.skip "displays login button on logout", ->
          @ipc.handle("log:out", null, {})
          cy.contains("Jane Lane").click()
          cy.contains("a", "Log Out").click()
          cy
            .get("nav a").should ($a) ->
              expect($a).to.contain("Log In")

        it "displays login screen on logout", ->
          @ipc.handle("log:out", null, {})
          cy.contains("Jane Lane").click()
          cy.contains("a", "Log Out").click()
          cy.contains(".btn", "Log In with GitHub")
