moment = require("moment")

describe "Runs List", ->
  beforeEach ->
    cy.fixture("user").as("user")
    cy.fixture("config").as("config")
    cy.fixture("projects").as("projects")
    cy.fixture("specs").as("specs")
    cy.fixture("runs").as("runs")
    cy.fixture("organizations").as("orgs")

    @goToRuns = ->
      cy.get(".navbar-default a")
        .contains("Runs").click()

    @validCiProject = {
      id: "project-id-123"
      public: true
      orgId: "000"
    }

    cy.visitIndex().then (win) ->
      { start, @ipc } = win.App

      cy.stub(@ipc, "getOptions").resolves({projectRoot: "/foo/bar"})
      cy.stub(@ipc, "updaterCheck").resolves(false)
      cy.stub(@ipc, "closeBrowser").resolves(null)
      cy.stub(@ipc, "getSpecs").yields(null, @specs)
      cy.stub(@ipc, "getOrgs").resolves(@orgs)
      cy.stub(@ipc, "requestAccess")
      cy.stub(@ipc, "setupDashboardProject")
      cy.stub(@ipc, "externalOpen")
      cy.stub(@ipc, "windowOpen").resolves()

      @openProject = @util.deferred()
      cy.stub(@ipc, "openProject").returns(@openProject.promise)

      @getCurrentUser = @util.deferred()
      cy.stub(@ipc, "getCurrentUser").returns(@getCurrentUser.promise)

      @pingApiServer = @util.deferred()
      cy.stub(@ipc, "pingApiServer").returns(@pingApiServer.promise)

      @getProjectStatus = @util.deferred()
      cy.stub(@ipc, "getProjectStatus").returns(@getProjectStatus.promise)

      @getRuns = @util.deferred()
      cy.stub(@ipc, "getRuns").returns(@getRuns.promise)

      start()

  context "page display", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)
      @openProject.resolve(@config)
      @getRuns.resolve(@runs)
      @goToRuns()

    it "highlights run nav", ->
      cy.get(".navbar-default a")
        .contains("Runs").should("have.class", "active")

  context "api server connection", ->
    beforeEach ->
      timestamp = moment("2016-12-19T10:00:00").valueOf()
      cy.clock(timestamp)
      @getCurrentUser.resolve(@user)
      @openProject.resolve(@config)
      @getRuns.resolve(@runs)
      @goToRuns()

    it "pings api server", ->
      expect(@ipc.pingApiServer).to.be.called
      cy.get(".loader")

    describe "success", ->
      beforeEach ->
        @pingApiServer.resolve()

      it "shows runs", ->
        cy.contains("h5", "Runs")

      context "displays each run's data", ->
        beforeEach ->
          cy.get(".runs-container li").first().as("firstRunRow")
          cy.get(".runs-container li").eq(1).as("runRow")

        it "displays build num", ->
          cy.get("@runRow").contains("#" + @runs[1].buildNumber)

        it "displays commit info", ->
          cy.get("@firstRunRow").contains(@runs[0].commit.branch)
          cy.get("@firstRunRow").contains(@runs[0].commit.message)

        it "display no info msg & doesn't display avatar", ->
          cy.get("@runRow").within ->
            cy.get("img").should("not.exist")
            cy.contains("No commit info found")

        it "displays platform info", ->
          cy.get("@runRow").within ->
            cy.contains(@runs[1].instances[0].platform.osVersionFormatted)
            cy.contains(@runs[1].instances[0].platform.browserName)
            cy.get(".fa-apple")
            cy.get(".fa-chrome")

        it "does not display browser when null", ->
          cy.get("@firstRunRow").within ->
            cy.contains(@runs[0].instances[0].platform.osVersionFormatted)
            cy.get(".fa-chrome").should('not.exist')

        it "displays totals", ->
          cy.get("@runRow").contains(@runs[1].totalFailed)
          cy.get("@runRow").contains(@runs[1].totalPassed)

        it "displays times", ->
          cy.get("@runRow").contains("a few secs ago")
          cy.get("@runRow").contains("00:16")

        it "displays separate timers for incomplete runs", ->
          cy.get("@firstRunRow").contains("24:47")
          cy.get(".runs-container li").eq(3).contains("45:47")
            .then -> cy.tick(1000)
          cy.get("@firstRunRow").contains("24:48")
          cy.get(".runs-container li").eq(3).contains("45:48")

        context "spec display", ->
          it "displays spec if defined when 1 instance", ->
            cy.get("@firstRunRow").contains(@runs[1].instances[0].spec)

          it "does not display spec if null", ->
            cy.get(".runs-container li").eq(2).contains("spec").should("not.exist")

          it "does not display spec if multiple instances", ->
            cy.get(".runs-container li").eq(2).contains("spec").should("not.exist")

        context "parallelization disabled", ->
          it "adds a warning indicator to the run list item", ->
            cy.get(".env-duration .fa-exclamation-triangle")
              .should("exist")
              .trigger("mouseover")

            cy.get(".cy-tooltip").contains("Parallelization was disabled for this run")

    describe "failure", ->
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

        it "shows runs", ->
          @pingApiServerAgain.resolve()
          cy.contains("h5", "Runs")

      describe "api help link", ->
        it "goes to external api help link", ->
          cy.contains("Learn more").click().then ->
            expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/help-connect-to-api")

  context "with a current user", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)
      @config.projectId = @projects[0].id
      @openProject.resolve(@config)
      @pingApiServer.resolve()

      timestamp = new Date(2016, 11, 19, 10, 0, 0).valueOf()

      cy.clock(timestamp)
        .then =>
          @goToRuns()
        .then =>
          @getRuns.resolve(@runs)

    it "fetches runs", ->
      expect(@ipc.getRuns).to.be.called

    it "lists runs", ->
      cy.get(".runs-container li")
        .should("have.length", @runs.length)

    it "displays link to dashboard that goes to admin project runs", ->
      cy.contains("See all").click()
        .then ->
          expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/dashboard/projects/#{@projects[0].id}/runs")

    it "displays run status icon", ->
      cy.get(".runs-container li").first().find("> div")
        .should("have.class", "running")

    it "displays last updated", ->
      cy.contains("Last updated: 10:00:00am")

    it "clicking run opens admin", ->
      cy.get(".runs-container li").first()
        .click()
        .then =>
          expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/dashboard/projects/#{@projects[0].id}/runs/#{@runs[0].buildNumber}")

  context "without a current user", ->
    beforeEach ->
      @getCurrentUser.resolve(null)
      @openProject.resolve(@config)
      @pingApiServer.resolve()

      @goToRuns()

    it "does not fetch runs", ->
      expect(@ipc.getRuns).not.to.be.called

  context "without a project id", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)
      @config.projectId = undefined
      @openProject.resolve(@config)
      @pingApiServer.resolve()
      @goToRuns()

    it "displays 'need to set up' message", ->
      cy.contains("You have no recorded runs")

  context "without a current user and without project id", ->
    beforeEach ->
      @getCurrentUser.resolve(null)
      @config.projectId = undefined
      @openProject.resolve(@config)
      @pingApiServer.resolve()
      @goToRuns()

    it "displays 'need to set up' message", ->
      cy.contains("You have no recorded runs")

    describe "click setup project", ->
      beforeEach ->
        cy.contains("Set up project").click()

      it "shows login message", ->
        cy.get(".login h1").should("contain", "Log in")

      it "clicking 'Log In with GitHub' opens login", ->
        cy.contains("button", "Log In with GitHub").click().then ->
          expect(@ipc.windowOpen).to.be.called
          expect(@ipc.windowOpen.lastCall.args[0].type).to.equal("GITHUB_LOGIN")

  describe "polling runs", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)
      @openProject.resolve(@config)
      @pingApiServer.resolve()
      @getRunsAgain = @util.deferred()
      @ipc.getRuns.onCall(1).returns(@getRunsAgain.promise)

      cy.clock()
        .then =>
          @goToRuns()
        .then =>
          @getRuns.resolve(@runs)
      cy.get(".runs-container") ## wait for original runs to show
      cy.clock().then (clock) =>
          @getRunsAgain = @util.deferred()
          @ipc.getRuns.onCall(1).returns(@getRunsAgain.promise)
      cy.tick(10000)

    it "has original state of runs", ->
      cy.get(".runs-container li").first().find("> div")
        .should("have.class", "running")

    it "sends get:runs ipc event", ->
      expect(@ipc.getRuns).to.be.calledTwice

    it "disables refresh button", ->
      cy.get(".runs header button").should("be.disabled")

    it "spins the refresh button", ->
      cy.get(".runs header button i").should("have.class", "fa-spin")

    context "success", ->
      beforeEach ->
        @runs[0].status = "passed"
        @getRunsAgain.resolve(@runs)

      it "updates the runs", ->
        cy.get(".runs-container li").first().find("> div")
          .should("have.class", "passed")

      it "enables refresh button", ->
        cy.get(".runs header button").should("not.be.disabled")

      it "stops spinning the refresh button", ->
        cy.get(".runs header button i").should("not.have.class", "fa-spin")

    context "errors", ->
      beforeEach ->
        @ipcError = (details) =>
          err = Object.assign(details, {name: "foo", message: "There's an error"})
          @getRunsAgain.reject(err)

      it "displays permissions error", ->
        @ipcError({statusCode: 403})
        cy.contains("Request access")

      it "displays 'need to set up' message", ->
        @ipcError({type: "NO_PROJECT_ID"})
        cy.contains("You have no recorded runs")

      it "displays old runs if another error", ->
        @ipcError({type: "TIMED_OUT"})
        cy.get(".runs-container li").should("have.length", @runs.length)

  describe "manually refreshing runs", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)
      @openProject.resolve(@config)
      @pingApiServer.resolve()
      @getRunsAgain = @util.deferred()
      @ipc.getRuns.onCall(1).returns(@getRunsAgain.promise)

      @getRuns.resolve(@runs)
      @goToRuns().then ->
        cy.get(".runs header button").click()

    it "sends get:runs ipc event", ->
      expect(@ipc.getRuns).to.be.calledTwice

    it "still shows list of runs", ->
      cy.get(".runs-container li").should("have.length", @runs.length)

    it "disables refresh button", ->
      cy.get(".runs header button").should("be.disabled")

    it "spins the refresh button", ->
      cy.get(".runs header button i").should("have.class", "fa-spin")

    describe "when runs have loaded", ->
      beforeEach ->
        @getRunsAgain.resolve(@runs)

      it "enables refresh button", ->
        cy.get(".runs header button").should("not.be.disabled")

      it "stops spinning the refresh button", ->
        cy.get(".runs header button i").should("not.have.class", "fa-spin")

  context "error states", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)
      @pingApiServer.resolve()

    describe "permissions error", ->
      beforeEach ->
        @openProject.resolve(@config)
        @goToRuns()

      context "statusCode: 403", ->
        beforeEach ->
          @getRuns.reject({name: "foo", message: "There's an error", statusCode: 403})

        it "displays permissions message", ->
          cy.contains("Request access")

      context "any case", ->
        beforeEach ->
          @requestAccess = @util.deferred()
          @ipc.requestAccess.returns(@requestAccess.promise)
          @getRuns.reject({name: "foo", message: "There's an error", statusCode: 403})

        context "request access", ->
          beforeEach ->
            cy.contains("button", "Request access").as("requestAccessBtn").click()

          it "sends requests access with project id", ->
            expect(@ipc.requestAccess).to.be.calledWith(@config.projectId)

          it "disables button", ->
            cy.get("@requestAccessBtn").should("be.disabled")

          it "hides 'Request access' text", ->
            cy.get("@requestAccessBtn").find("span").should("not.be.visible")

          it "shows spinner", ->
            cy.get("@requestAccessBtn").find("> i").should("be.visible")

          describe "when request succeeds", ->
            beforeEach ->
              @requestAccess.resolve()

            it "shows success message", ->
              cy.contains("Request sent")

            it "'persists' request state (until app is reloaded at least)", ->
              @ipc.getRuns.onCall(1).rejects({name: "foo", message: "There's an error", statusCode: 403})

              cy.get(".navbar-default a").contains("Tests").click()
              cy.get(".navbar-default a").contains("Runs").click()
              cy.contains("Request sent")

          describe "when request succeeds and user is already a member", ->
            beforeEach ->
              @requestAccess.reject({name: "foo", message: "There's an error", type: "ALREADY_MEMBER"})
              @getRuns = @util.deferred()
              @ipc.getRuns.onCall(1).returns(@getRuns.promise)
              @ipc.getRuns.onCall(2).returns(@getRuns.promise)

            it "retries getting runs", ->
              cy.wrap(@ipc.getRuns).its("callCount").should("be.above", 1)

            it "shows loading spinner", ->
              cy.get(".loader")

            it "shows runs when getting runs succeeds", ->
              @getRuns.resolve(@runs)
              cy.get(".runs-container li")
                .should("have.length", @runs.length)

          describe "when request fails", ->
            describe "for unknown reason", ->
              beforeEach ->
                @requestAccess.reject({name: "foo", message: """
                {
                  "cheese": "off the cracker"
                }
                """})

                ## block the subsequent tests until
                ## this is displayed in the DOM
                cy.contains("Request Failed")
                cy.contains("off the cracker")
                cy.contains("button", "Request access").as("requestAccessBtn")

              it "enables button", ->
                cy.get("@requestAccessBtn").should("not.be.disabled")

              it "shows 'Request access' text", ->
                cy.get("@requestAccessBtn").find("span").should("be.visible")

              it "hides spinner", ->
                cy.get("@requestAccessBtn").find("> i").should("not.be.visible")

            describe "because requested was denied", ->
              beforeEach ->
                @requestAccess.reject({type: "DENIED", name: "foo", message: "There's an error"})

              it "shows 'success' message", ->
                cy.contains("Request sent")

            describe "because request was already sent", ->
              beforeEach ->
                @requestAccess.reject({type: "ALREADY_REQUESTED", name: "foo", message: "There's an error"})

              it "shows 'success' message", ->
                cy.contains("Request sent")

            describe "because user became unauthenticated", ->
              beforeEach ->
                @requestAccess.reject({name: "", message: "", statusCode: 401})

              it "logs user out", ->
                cy.shouldBeLoggedOut()

              it "shows login message", ->
                cy.get(".empty h4").should("contain", "Log in")

              it "clicking 'Log In with GitHub' opens login", ->
                cy.contains("button", "Log In with GitHub").click().then ->
                  expect(@ipc.windowOpen).to.be.called
                  expect(@ipc.windowOpen.lastCall.args[0].type).to.equal("GITHUB_LOGIN")

    describe "timed out error", ->
      beforeEach ->
        @openProject.resolve(@config)
        @goToRuns().then =>
          @getRuns.reject({name: "foo", message: "There's an error", type: "TIMED_OUT"})

      it "displays timed out message", ->
        cy.contains("timed out")

    describe "not found error", ->
      beforeEach ->
        @openProject.resolve(@config)
        @goToRuns().then =>
          @getRuns.reject({name: "foo", message: "There's an error", type: "NOT_FOUND"})

      it "displays empty message", ->
        cy.contains("Runs cannot be displayed")

    describe "unauthenticated error", ->
      beforeEach ->
        @openProject.resolve(@config)
        @goToRuns().then =>
          @getRuns.reject({name: "", message: "", statusCode: 401})

      it "logs user out", ->
        cy.shouldBeLoggedOut()

      it "shows login message", ->
        cy.get(".empty h4").should("contain", "Log in")

    describe "no project id error", ->
      beforeEach ->
        @openProject.resolve(@config)
        @ipc.setupDashboardProject.resolves(@validCiProject)
        @ipc.getRuns.onCall(1).resolves([])
        @goToRuns().then =>
          @getRuns.reject({name: "foo", message: "There's an error", type: "NO_PROJECT_ID"})

      it "displays 'need to set up' message", ->
        cy.contains("You have no recorded runs")

      it "clears message after setting up to record", ->
        cy.contains(".btn", "Set up project").click()
        cy.get(".modal-body")
          .contains(".btn", "Me").click()
        cy.get(".privacy-radio").find("input").last().check()
        cy.get(".modal-body")
          .contains(".btn", "Set up project").click()
        cy.contains("To record your first")

    describe "unexpected error", ->
      beforeEach ->
        @openProject.resolve(@config)
        @goToRuns().then =>
          @getRuns.reject({name: "foo", message: """
          {
            "no runs": "for you"
          }
          """, type: "UNKNOWN"})

      it "displays unexpected error message", ->
        cy.contains("unexpected error")
        cy.contains('"no runs": "for you"')

    describe "unauthorized project", ->
      beforeEach ->
        @openProject.resolve(@config)
        @getProjectStatus.resolve({
          state: "UNAUTHORIZED"
        })

        @goToRuns()

      it "displays permissions message", ->
        cy.contains("Request access")

    describe "invalid project", ->
      beforeEach ->
        @openProject.resolve(@config)
        @ipc.setupDashboardProject.resolves(@validCiProject)

        @getProjectStatus.resolve({
          state: "INVALID"
        })

        @goToRuns()

      it "displays empty message", ->
        cy.contains("Runs cannot be displayed")

      it "clicking link opens setup project window", ->
        cy.contains(".btn", "Set up a new project").click()
        cy.get(".modal").should("be.visible")

      it "clears message after setting up CI", ->
        cy.contains(".btn", "Set up a new project").click()
        cy.get(".modal-body")
          .contains(".btn", "Me").click()
        cy.get(".privacy-radio").find("input").last().check()
        cy.get(".modal-body")
          .contains(".btn", "Set up project").click()
        cy.contains("To record your first")

    describe "no runs", ->
      context "having never setup CI", ->
        beforeEach ->
          @config.projectId = null
          @openProject.resolve(@config)

          @goToRuns().then =>
            @getRuns.resolve([])

        it "displays 'need to set up' message", ->
          cy.contains("You have no recorded runs")

    context "having previously set up CI", ->
      beforeEach ->
        @openProject.resolve(@config)
        @goToRuns().then =>
          @getRuns.resolve([])

      it "displays empty message", ->
        cy.contains("To record your first")

      it "opens project id guide on clicking 'Why?'", ->
        cy.contains("Why?").click()
          .then ->
            expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/what-is-a-project-id")

      it "opens dashboard on clicking 'Cypress Dashboard'", ->
        cy.contains("Cypress Dashboard").click()
          .then ->
            expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/dashboard/projects/#{@config.projectId}/runs")
