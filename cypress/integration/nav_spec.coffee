describe "Navigation", ->
  beforeEach ->
    cy
      .visit("/")
      .window().then (win) ->
        {@ipc, @App} = win
        @agents = cy.agents()
        @agents.spy(@App, "ipc")
        @ipc.handle("get:options", null, {})

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
        cy.screenshot()
        cy.contains("Log Out").should("be.visible")

      it "triggers logout on click of logout", ->
        cy.contains("Jane Lane").click()
        cy.screenshot()
        cy.contains("a", "Log Out").click().then ->
          expect(@App.ipc).to.be.calledWith("log:out")

      it "displays login screen on logout", ->
        @ipc.handle("log:out", null, {})
        cy.contains("Jane Lane").click()
        cy.contains("a", "Log Out").click()
        cy.screenshot()
        cy.contains(".btn", "Log In with GitHub")
