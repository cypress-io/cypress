describe "Runs List", ->
  beforeEach ->
    cy.fixture("user").as("user")
    cy.fixture("config").as("config")
    cy.fixture("projects").as("projects")
    cy.fixture("specs").as("specs")
    cy.fixture("runs").as("runs")
    cy.fixture("organizations").as("orgs")

    @goToRuns = ->
      cy
        .get(".navbar-default a")
          .contains("Runs").click()

    @validCiProject = {
      id: "project-id-123"
      public: true
      orgId: "000"
    }

    cy.visitIndex().then (win) ->
      { start, @ipc } = win.App

      cy.stub(@ipc, "getOptions").resolves({projectPath: "/foo/bar"})
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

      @getProjectStatus = @util.deferred()
      cy.stub(@ipc, "getProjectStatus").returns(@getProjectStatus.promise)

      @getRuns = @util.deferred()
      cy.stub(@ipc, "getRuns").returns(@getRuns.promise)

      start()

  context "displays page", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)
      @openProject.resolve(@config)
      @getRuns.resolve(@runs)
      @goToRuns()

    it "navigates to runs page", ->
      cy.contains("h5", "Runs")

    it "highlight run nav", ->
      cy
        .get(".navbar-default a")
          .contains("Runs").should("have.class", "active")

  context "with a current user", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)
      @config.projectId = @projects[0].id
      @openProject.resolve(@config)

      timestamp = new Date(2016, 11, 19, 10, 0, 0).valueOf()

      cy
        .clock(timestamp)
        .then =>
          @goToRuns()
        .then =>
          @getRuns.resolve(@runs)

    it "lists runs", ->
      cy
        .get(".runs-container li")
        .should("have.length", @runs.length)

    it "displays link to dashboard that goes to admin project runs", ->
      cy
        .contains("See All").click()
        .then ->
          expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/dashboard/projects/#{@projects[0].id}/runs")

    it "displays run status icon", ->
      cy
        .get(".runs-container li").first().find("> div")
        .should("have.class", "running")

    it "displays last updated", ->
      cy.contains("Last updated: 10:00:00am")

    it "clicking run opens admin", ->
      cy
        .get(".runs-container li").first()
        .click()
        .then =>
          expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/dashboard/projects/#{@projects[0].id}/runs/#{@runs[0].id}")

  context "without a project id", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)
      @config.projectId = undefined
      @openProject.resolve(@config)
      @goToRuns()

    it "displays 'need to set up' message", ->
      cy.contains("You Have No Recorded Runs")

  describe "polling runs", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)
      @openProject.resolve(@config)
      @getRunsAgain = @util.deferred()
      @ipc.getRuns.onCall(1).returns(@getRunsAgain.promise)

      cy
        .clock()
        .then =>
          @goToRuns()
        .then =>
          @getRuns.resolve(@runs)
        .get(".runs-container") ## wait for original runs to show
        .clock().then (clock) =>
          @getRunsAgain = @util.deferred()
          @ipc.getRuns.onCall(1).returns(@getRunsAgain.promise)
        .tick(10000)

    it "has original state of runs", ->
      cy
        .get(".runs-container li").first().find("> div")
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
        cy
          .get(".runs-container li").first().find("> div")
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
        cy.contains("You Have No Recorded Runs")

      it "displays old runs if another error", ->
        @ipcError({type: "TIMED_OUT"})
        cy.get(".runs-container li").should("have.length", 4)

  describe "manually refreshing runs", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)
      @openProject.resolve(@config)
      @getRunsAgain = @util.deferred()
      @ipc.getRuns.onCall(1).returns(@getRunsAgain.promise)

      @getRuns.resolve(@runs)
      @goToRuns().then ->
        cy.get(".runs header button").click()

    it "sends get:runs ipc event", ->
      expect(@ipc.getRuns).to.be.calledTwice

    it "still shows list of runs", ->
      cy.get(".runs-container li").should("have.length", 4)

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

    describe "permissions error", ->
      beforeEach ->
        @openProject.resolve(@config)
        @goToRuns()

      context "statusCode: 403", ->
        beforeEach ->
          @getRuns.reject({name: "foo", message: "There's an error", statusCode: 403})

        it "displays permissions message", ->
          cy.contains("Request Access")

      context "any case", ->
        beforeEach ->
          @requestAccess = @util.deferred()
          @ipc.requestAccess.returns(@requestAccess.promise)
          @getRuns.reject({name: "foo", message: "There's an error", statusCode: 403})

        context "request access", ->
          beforeEach ->
            cy.contains("Request Access").click()

          it "sends requests access with org id", ->
            expect(@ipc.requestAccess).to.be.calledWith("d8104707-a348-4653-baea-7da9c7d52448")

          it "disables button", ->
            cy.contains("Request Access").should("be.disabled")

          it "hides 'Request Access' text", ->
            cy.contains("Request Access").find("span").should("not.be.visible")

          it "shows spinner", ->
            cy.contains("Request Access").find("> i").should("be.visible")

          describe "when request succeeds", ->
            beforeEach ->
              @requestAccess.resolve()

            it "shows success message", ->
              cy.contains("Request Sent")

            it "'persists' request state (until app is reloaded at least)", ->
              @ipc.getRuns.onCall(1).rejects({name: "foo", message: "There's an error", statusCode: 403})

              cy.get(".navbar-default a").contains("Tests").click()
              cy.get(".navbar-default a").contains("Runs").click()
              cy.contains("Request Sent")

          describe "when request succeeds and user is already a member", ->
            beforeEach ->
              @requestAccess.reject({name: "foo", message: "There's an error", type: "ALREADY_MEMBER"})
              @getRuns = @util.deferred()
              @ipc.getRuns.onCall(1).returns(@getRuns.promise)
              cy.wait(1)

            it "retries getting runs", ->
              expect(@ipc.getRuns.callCount).to.equal(2)

            it "shows loading spinner", ->
              cy.get(".loader")

            it "shows runs when getting runs succeeds", ->
              @getRuns.resolve(@runs)
              cy
                .get(".runs-container li")
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

              it "enables button", ->
                cy.contains("Request Access").should("not.be.disabled")

              it "shows 'Request Access' text", ->
                cy.contains("Request Access").find("span").should("be.visible")

              it "hides spinner", ->
                cy.contains("Request Access").find("> i").should("not.be.visible")

            describe "because requested was denied", ->
              beforeEach ->
                @requestAccess.reject({type: "DENIED", name: "foo", message: "There's an error"})

              it "shows 'success' message", ->
                cy.contains("Request Sent")

            describe "because request was already sent", ->
              beforeEach ->
                @requestAccess.reject({type: "ALREADY_REQUESTED", name: "foo", message: "There's an error"})

              it "shows 'success' message", ->
                cy.contains("Request Sent")

            describe "because user became unauthenticated", ->
              beforeEach ->
                @requestAccess.reject({name: "", message: "", statusCode: 401})

              it "logs user out", ->
                cy.shouldBeLoggedOut()

              it "shows login message", ->
                cy.get(".empty h4").should("contain", "Please Log In")

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
        cy.contains("Runs Cannot Be Displayed")

    describe "unauthenticated error", ->
      beforeEach ->
        @openProject.resolve(@config)
        @goToRuns().then =>
          @getRuns.reject({name: "", message: "", statusCode: 401})

      it "logs user out", ->
        cy.shouldBeLoggedOut()

      it "shows login message", ->
        cy.get(".empty h4").should("contain", "Please Log In")

    describe "no project id error", ->
      beforeEach ->
        @openProject.resolve(@config)
        @ipc.setupDashboardProject.resolves(@validCiProject)
        @goToRuns().then =>
          @getRuns.reject({name: "foo", message: "There's an error", type: "NO_PROJECT_ID"})

      it "displays 'need to set up' message", ->
        cy.contains("You Have No Recorded Runs")

      it "clears message after setting up to record", ->
        cy
          .get(".btn").contains("Set Up Project").click()
          .get(".modal-body")
            .contains(".btn", "Me").click()
          .get(".privacy-radio").find("input").last().check()
          .get(".modal-body")
            .contains(".btn", "Set Up Project").click()
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
        cy.contains("Runs Cannot Be Displayed")

      it "clicking link opens setup project window", ->
        cy
          .get(".btn").contains("Set Up a New Project").click()
          .get(".modal").should("be.visible")

      it "clears message after setting up CI", ->
        cy
          .get(".btn").contains("Set Up a New Project").click()
          .get(".modal-body")
            .contains(".btn", "Me").click()
          .get(".privacy-radio").find("input").last().check()
          .get(".modal-body")
            .contains(".btn", "Set Up Project").click()
        cy.contains("To record your first")

    describe "no runs", ->
      context "having never setup CI", ->
        beforeEach ->
          @config.projectId = null
          @openProject.resolve(@config)

          @goToRuns().then =>
            @getRuns.resolve([])

        it "displays 'need to set up' message", ->
          cy.contains("You Have No Recorded Runs")

    context "having previously set up CI", ->
      beforeEach ->
        @openProject.resolve(@config)
        @goToRuns().then =>
          @getRuns.resolve([])

      it "displays empty message", ->
        cy.contains("To record your first")

      it "opens project id guide on clicking 'Why?'", ->
        cy
          .contains("Why?").click()
          .then ->
            expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/what-is-a-project-id")

      it "opens dashboard on clicking 'Cypress Dashboard'", ->
        cy
          .contains("Cypress Dashboard").click()
          .then ->
            expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/dashboard/projects/#{@config.projectId}/runs")
