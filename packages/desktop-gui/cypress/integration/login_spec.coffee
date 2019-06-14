describe "Login", ->
  beforeEach ->
    cy.fixture("user").as("user")

    cy.visitIndex().then (win) ->
      { start, @ipc } = win.App

      cy.stub(@ipc, "onMenuClicked")
      cy.stub(@ipc, "getOptions").resolves({})
      cy.stub(@ipc, "getCurrentUser").resolves(null)
      cy.stub(@ipc, "updaterCheck").resolves(false)
      cy.stub(@ipc, "getProjects").resolves([])
      cy.stub(@ipc, "getProjectStatuses").resolves([])
      cy.stub(@ipc, "openProject").resolves(@config)
      cy.stub(@ipc, "getSpecs").yields(null, @specs)
      cy.stub(@ipc, "externalOpen")
      cy.stub(@ipc, "clearGithubCookies")
      cy.stub(@ipc, "logOut").resolves()

      cy.stub(@ipc, "onAuthMessage").callsFake (cb) =>
        @onAuthMessageCb = cb

      @pingApiServer = @util.deferred()
      cy.stub(@ipc, "pingApiServer").returns(@pingApiServer.promise)

      @beginAuth = @util.deferred()
      cy.stub(@ipc, "beginAuth").returns(@beginAuth.promise)

      start()
      cy.contains("Log In").click()

  it "pings api server", ->
    expect(@ipc.pingApiServer).to.be.called
    cy.get(".loader")

  describe "when connected to api server", ->
    beforeEach ->
      @pingApiServer.resolve()

    it "has dashboard login button", ->
      cy.get(".login").contains("button", "Log In to Dashboard")

    it "opens dashboard on clicking 'Cypress Dashboard'", ->
      cy.contains("Cypress Dashboard").click().then ->
        expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/dashboard")

    describe "click 'Log In to Dashboard'", ->
      beforeEach ->
        cy
          .get(".login")
            .contains("button", "Log In to Dashboard").as("loginBtn")
            .click()

      it "triggers ipc 'begin:auth' on click", ->
        cy
          .then ->
            expect(@ipc.beginAuth).to.be.calledOnce

      it "disables login button", ->
        cy.get("@loginBtn").should("be.disabled")

      it "shows spinner with 'Logging In'", ->
        cy.get("@loginBtn").invoke("text").should("contain", "Logging in...")

      context "on 'begin:auth'", ->
        beforeEach ->
          cy.get("@loginBtn")

        it "displays spinner with 'Logging in...' and disables button", ->
          cy.contains("Logging in...").should("be.disabled")

        describe "on ipc begin:auth success", ->
          beforeEach ->
            @beginAuth.resolve(@user)

          it "goes to previous view", ->
            cy.shouldBeOnIntro()

          it "displays username in UI", ->
            cy
              .get("nav a").should ($a) ->
                expect($a).to.contain(@user.name)

          it "closes modal", ->
            cy.get(".modal").should("not.be.visible")

          context "log out", ->
            it "displays login button on logout", ->
              cy
                .get("nav a").contains("Jane").click()
              cy
                .contains("Log Out").click()
                .get(".nav").contains("Log In")

            it "calls clear:github:cookies", ->
              cy
                .get("nav a").contains("Jane").click()
              cy
                .contains("Log Out").click().then ->
                  expect(@ipc.clearGithubCookies).to.be.called

            it "calls log:out", ->
              cy
                .get("nav a").contains("Jane").click()
              cy
                .contains("Log Out").click().then ->
                  expect(@ipc.logOut).to.be.called

            it "has login button enabled when returning to login after logout", ->
              cy.get("nav a").contains("Jane").click()
              cy.contains("Log Out").click()
              cy.contains("Log In").click()
              cy.get(".login button").eq(1)
                .should("not.be.disabled")
                .invoke("text")
                .should("include", "Log In to Dashboard")

        describe "on ipc 'begin:auth' error", ->
          beforeEach ->
            @beginAuth.reject({name: "foo", message: "There's an error"})

          it "displays error in ui", ->
            cy
              .get(".alert-danger")
                .should("be.visible")
                .contains("There's an error")

          it "login button should be enabled", ->
            cy
              .get("@loginBtn").should("not.be.disabled")

        describe "on ipc 'on:auth:message'", ->
          beforeEach ->
            @onAuthMessageCb(null, {
              message: "some warning here"
              type: "warning"
            })

          it "displays warning in ui", ->
            cy
              .get(".warning")
                .should("be.visible")
                .contains("some warning here")

          it "login button should be disabled", ->
            cy
              .get("@loginBtn").should("be.disabled")

    describe "Dashboard link in message", ->
      it "opens link to Dashboard Service on click", ->
        cy.contains("a", "Cypress Dashboard Service").click().then ->
          expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/dashboard")

    describe "terms and privacy message", ->
      it "opens links to terms and privacy on click", ->
        cy.contains("a", "Terms of Use").click().then ->
          expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/terms-of-use")
        cy.contains("a", "Privacy Policy").click().then ->
          expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/privacy-policy")

  describe "when not connected to api server", ->
    beforeEach ->
      @pingApiServerAgain = @util.deferred()
      @ipc.pingApiServer.onCall(1).returns(@pingApiServerAgain.promise)

      @pingApiServer.reject({
        apiUrl: "http://api.server"
        message: "ECONNREFUSED"
      })

    it "shows 'cannot connect to api server' message", ->
      cy.contains("Cannot connect to API server")
      cy.contains("http://api.server")
      cy.contains("ECONNREFUSED")

    describe "trying again", ->
      beforeEach ->
        cy.contains("Try again").click()

      it "pings again", ->
        cy.get(".loader").then ->
          expect(@ipc.pingApiServer).to.be.calledTwice

      it "shows new error on failure", ->
        @pingApiServerAgain.reject({
          apiUrl: "http://api.server"
          message: "WHADJAEXPECT"
        })

        cy.contains("Cannot connect to API server")
        cy.contains("http://api.server")
        cy.contains("WHADJAEXPECT")

      it "shows login on success", ->
        @pingApiServerAgain.resolve()
        cy.get(".login").contains("button", "Log In to Dashboard")

    describe "api help link", ->
      it "goes to external api help link", ->
        cy.contains("Learn more").click().then ->
          expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/help-connect-to-api")

    describe "closing login", ->
      beforeEach ->
        cy.get(".login .close").click()

      it "shows log in if connected and opened again", ->
        @pingApiServerAgain.resolve()
        cy.contains("Log In").click()
        cy.get(".login").contains("button", "Log In to Dashboard")
