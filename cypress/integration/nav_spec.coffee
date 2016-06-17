describe "Navigation", ->
  beforeEach ->
    cy
      .visit("/")
      .window().then (win) ->
        {@ipc, @App} = win

        @agents = cy.agents()

        @agents.spy(@App, "ipc")

        @ipc.handle("get:options", null, {})

  context "with a current user", ->
    describe "username in header", ->
      it "displays user name", ->
        cy
          .fixture("user").then (@user) ->
            @ipc.handle("get:current:user", null, @user)
            @ipc.handle("get:project:paths", null, [])
          .get("nav a").should ($a) ->
            expect($a).to.contain(@user.name)

      it "displays email instead of name", ->
        cy
          .fixture("user").then (@user) ->
            @user.name = null

            @ipc.handle("get:current:user", null, @user)
            @ipc.handle("get:project:paths", null, [])
          .get("nav a").should ($a) ->
            expect($a).to.contain(@user.email)

    describe "logout of user", ->
      beforeEach ->
        cy
          .fixture("user").then (@user) ->
            @ipc.handle("get:current:user", null, @user)
            @ipc.handle("get:project:paths", null, [])

      it "shows dropdown on click of user name", ->
        cy.contains("Jane Lane").click()
        cy.contains("Log Out").should("be.visible")

      it "triggers logout on click of logout", ->
        cy.contains("Jane Lane").click()
        cy.contains("a", "Log Out").click().then ->
          expect(@App.ipc).to.be.calledWith("log:out")

      it.skip "displays login screen on logout", ->
        cy.contains("Jane Lane").click()
        cy.contains("a", "Log Out").click()
        cy.contains(".btn", "Log In with GitHub")


  # context "update banner", ->
  #   it "does not display update banner when no update available", ->
  #     @ipc.handle("updater:check", null, false)

  #     cy
  #       .get("#updates-available").should("not.exist")
  #       .get("html").should("not.have.class", "has-updates")

  #   it "checks for update on show", ->
  #     expect(@App.ipc).to.be.calledWith("updater:check")

  #   it "displays banner if updater:check if new version", ->
  #     @ipc.handle("updater:check", null, "1.3.4")
  #     cy.get("#updates-available").should("be.visible")
  #     cy.contains("New updates are available")
  #     cy
  #       .get("html").should("have.class", "has-updates")
  #       .window().then (win) ->
  #         win.App.updater.updatesAvailable(false)
  #       .get("html").should("not.have.class", "has-updates")

  #   it "triggers open:window on click of Update link", ->
  #     @ipc.handle("updater:check", null, "1.3.4")
  #     cy.contains("Update").click().then ->
  #       expect(@App.ipc).to.be.calledWith("window:open", {
  #         position: "center"
  #         width: 300
  #         height: 210
  #         toolbar: false
  #         title: "Updates"
  #         type: "UPDATES"
  #       })

  #   it "gracefully handles error", ->
  #     @ipc.handle("updater:check", "Something bad happened", null)
  #     cy.contains("Log In with GitHub")
  #     cy.get("#footer").should("be.visible")
