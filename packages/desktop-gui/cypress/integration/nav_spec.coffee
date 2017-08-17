describe "Navigation", ->
  beforeEach ->
    cy.fixture("user").as("user")

    cy.visitIndex().then (win) ->
      { start, @ipc } = win.App

      cy.stub(@ipc, "getOptions").resolves({})
      cy.stub(@ipc, "updaterCheck").resolves(false)
      cy.stub(@ipc, "getProjects").resolves([])
      cy.stub(@ipc, "getProjectStatuses").resolves([])
      cy.stub(@ipc, "logOut").resolves({})
      cy.stub(@ipc, "externalOpen")

      @getCurrentUser = @util.deferred()
      cy.stub(@ipc, "getCurrentUser").returns(@getCurrentUser.promise)

      start()

  context.skip "without a current user", ->
    beforeEach ->
      @getCurrentUser.resolve({})

    context "links", ->
      it "opens link to docs on click", ->
        cy.get("nav").find(".fa-graduation-cap").click().then ->
          expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io")

      it "opens link to support on click", ->
        cy.get("nav").find(".fa-question-circle").click().then ->
          expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/support")

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
      it "opens link to docs on click", ->
        cy.get("nav").find(".fa-graduation-cap").click().then ->
          expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io")

      it "opens link to support on click", ->
        cy.get("nav").find(".fa-question-circle").click().then ->
          expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/support")

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
          cy.contains("Log Out").click().then ->
            expect(@ipc.logOut).to.be.called

        it.skip "displays login button", ->
          cy.contains("Jane Lane").click()
          cy.contains("Log Out").click()
          cy
            .get("nav a").should ($a) ->
              expect($a).to.contain("Log In")

        it "displays login screen", ->
          cy.contains("Jane Lane").click()
          cy.contains("Log Out").click()
          cy.shouldBeOnLogin()

  context "when current user has no name", ->
    beforeEach ->
      @user.name = null
      @getCurrentUser.resolve(@user)

    it "displays email instead of name", ->
      cy
        .get("nav a").should ($a) ->
          expect($a).to.contain(@user.email)
