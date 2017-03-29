_ = require("lodash")
moment = require("moment")
{deferred, stubIpc} = require("../support/util")

describe "Runs List", ->
  beforeEach ->
    @goToRuns = (projectName = "My-Fake-Project") =>
      cy
        .get(".projects-list a")
          .contains(projectName).click()
        .get(".navbar-default a")
          .contains("Runs").click()

    @validCiProject = {
      id: "project-id-123"
      public: true
      orgId: "000"
    }

    cy
      .fixture("user").as("user")
      .fixture("projects").as("projects")
      .fixture("projects_statuses").as("projectStatuses")
      .fixture("config").as("config")
      .fixture("specs").as("specs")
      .fixture("runs").as("runs")
      .fixture("organizations").as("orgs")
      .fixture("keys").as("keys")
      .visit("/")
      .window().then (win) ->
        {@App} = win
        cy.stub(@App, "ipc").as("ipc")

        @getCurrentUser = deferred()
        @getRuns = deferred()

        stubIpc(@App.ipc, {
          "get:options": (stub) => stub.resolves({})
          "get:current:user": (stub) => stub.returns(@getCurrentUser.promise)
          "on:menu:clicked": ->
          "close:browser": ->
          "close:project": ->
          "on:focus:tests": ->
          "updater:check": (stub) => stub.resolves(false)
          "get:projects": (stub) => stub.resolves(@projects)
          "get:project:statuses": (stub) => stub.resolves(@projectStatuses)
          "open:project": (stub) => stub.yields(null, @config)
          "get:specs": (stub) => stub.resolves(@specs)
          "get:builds": (stub) => stub.returns(@getRuns.promise)
          "get:orgs": (stub) => stub.resolves(@orgs)
        })

        @App.start()

  context "displays page", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)
      @getRuns.resolve(@runs)
      @goToRuns()

    it "navigates to runs page", ->
      cy
        .location().its("hash").should("include", "runs")

    it "highlight run nav", ->
      cy
        .get(".navbar-default a")
          .contains("Runs").should("have.class", "active")

  context "error states", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)

    describe "permissions error", ->
      beforeEach ->
        @goToRuns()

      context "statusCode: 403", ->
        beforeEach ->
          @getRuns.reject({name: "foo", message: "There's an error", statusCode: 403})

        it "displays permissions message", ->
          cy.contains("Request Access")

      context "any case", ->
        beforeEach ->
          @requestAccess = deferred()
          stubIpc(@App.ipc, {
            "request:access": (stub) => stub.returns(@requestAccess.promise)
          })
          @getRuns.reject({name: "foo", message: "There's an error", statusCode: 403})

        context "request access", ->
          beforeEach ->
            cy.contains("Request Access").click()

          it "sends request:access ipc event with org id", ->
            expect(@App.ipc).to.be.calledWith("request:access", "d8104707-a348-4653-baea-7da9c7d52448")

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
              @App.ipc.withArgs("get:builds").onCall(1).rejects({name: "foo", message: "There's an error", statusCode: 403})

              cy
                .contains("Back to Projects").click()
                .get(".projects-list a")
                  .contains("My-Fake-Project").click()
                .get(".navbar-default")
                  .find("a").contains("Runs").click()
                .end().contains("Request Sent")

          describe "when request succeeds and user is already a member", ->
            beforeEach ->
              @requestAccess.reject({name: "foo", message: "There's an error", type: "ALREADY_MEMBER"})
              @getRuns = deferred()
              @App.ipc.withArgs("get:builds").onCall(1).returns(@getRuns.promise)
              cy.wait(1)

            it "retries getting runs", ->
              expect(@App.ipc.withArgs("get:builds").callCount).to.equal(2)

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

              it "shows failure message", ->
                cy.contains("Request Failed")
                cy.contains('"cheese": "off the cracker"')

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

              it "redirects to login", ->
                cy.shouldBeOnLogin()

    describe "timed out error", ->
      beforeEach ->
        @goToRuns().then =>
          @getRuns.reject({name: "foo", message: "There's an error", type: "TIMED_OUT"})

      it "displays timed out message", ->
        cy.contains("timed out")

    describe "not found error", ->
      beforeEach ->
        @goToRuns().then =>
          @getRuns.reject({name: "foo", message: "There's an error", type: "NOT_FOUND"})

      it "displays empty message", ->
        cy.contains("Runs Cannot Be Displayed")

    describe "unauthenticated error", ->
      beforeEach ->
        @goToRuns().then =>
          @getRuns.reject({name: "", message: "", statusCode: 401})

      it "redirects to login", ->
        cy.shouldBeOnLogin()

    describe "no project id error", ->
      beforeEach ->
        stubIpc(@App.ipc, {
          "setup:dashboard:project": (stub) => stub.resolves(@validCiProject)
        })
        @goToRuns().then =>
          @getRuns.reject({name: "foo", message: "There's an error", type: "NO_PROJECT_ID"})

      it "displays 'you have no runs'", ->
        cy.contains("You Have No Recorded Runs")

      it "clears message after setting up CI", ->
        cy
          .get(".btn").contains("Setup Project").click()
          .get(".modal-body")
            .contains(".btn", "Me").click()
          .get(".privacy-radio").find("input").last().check()
          .get(".modal-body")
          .contains(".btn", "Setup Project").click()
          .end()
          .contains("To record your first")

    describe "unexpected error", ->
      beforeEach ->
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
        cy
          .get(".projects-list a")
            .contains("project4").click()

      it "displays permissions message", ->
        cy.contains("Request access")

    describe "invalid project", ->
      beforeEach ->
        @config.projectId = null
        @App.ipc.withArgs("open:project").resolves(@config)
        stubIpc(@App.ipc, {
          "setup:dashboard:project": (stub) => stub.resolves(@validCiProject)
        })

        @goToRuns("project5").then =>
          @getRuns.resolve([])

      it "displays empty message", ->
        cy.contains("Runs Cannot Be Displayed")

      it "clicking link opens setup project window", ->
        cy
          .get(".btn").contains("Setup a New Project").click()
          .get(".modal").should("be.visible")

      it "clears message after setting up CI", ->
        cy
          .get(".btn").contains("Setup a New Project").click()
          .get(".modal-body")
            .contains(".btn", "Me").click()
          .get(".privacy-radio").find("input").last().check()
          .get(".modal-body")
          .contains(".btn", "Setup Project").click()
          .end()
          .contains("To record your first")

    describe "no runs", ->
      context "having never setup CI", ->
        beforeEach ->
          @config.projectId = null
          @App.ipc.withArgs("open:project").resolves(@config)

          @goToRuns().then =>
            @getRuns.resolve([])

        it "displays empty message", ->
          cy.contains("You Have No Recorded Runs")

    context "having previously setup CI", ->
      beforeEach ->
        @goToRuns().then =>
          @getRuns.resolve([])

      it "displays empty message", ->
        cy.contains("To record your first")

      it "opens project id guide on clicking 'Why?'", ->
        cy
          .contains("Why?").click()
          .then ->
            expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/what-is-a-project-id")

      it "opens dashboard on clicking 'Cypress Dashboard'", ->
        cy
          .contains("Cypress Dashboard").click()
          .then ->
            expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/dashboard/projects/#{@config.projectId}/runs")

  describe "list runs", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)
      @config.projectId = @projects[0].id
      @App.ipc.withArgs("open:project").resolves(@config)

      timestamp = moment("2016-12-19 10:00:00").valueOf()

      cy
        .clock(timestamp)
        .get(".projects-list a")
          .contains("My-Fake-Project").click()
        .tick(1000) ## allow promises from get:specs, etc to resolve
        .get(".navbar-default a")
          .contains("Runs").click()
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
          expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/dashboard/projects/#{@projects[0].id}/runs")

    it "displays run status icon", ->
      cy
        .get(".runs-container li").first().find("> div")
        .should("have.class", "running")

    it "displays last updated", ->
      cy.contains("Last updated: 10:00:01am")

    it "clicking run opens admin", ->
      cy
        .get(".runs-container li").first()
        .click()
        .then =>
          expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/dashboard/projects/#{@projects[0].id}/runs/#{@runs[0].id}")

  describe "polling runs", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)
      @getRunsAgain = deferred()
      @App.ipc.withArgs("get:builds").onCall(1).returns(@getRunsAgain.promise)

      cy
        .clock()
        .get(".projects-list a")
          .contains("My-Fake-Project").click()
        .tick(1000) ## allow promises from get:specs, etc to resolve
        .get(".navbar-default a")
          .contains("Runs").click()
        .then =>
          @getRuns.resolve(@runs)
        .get(".runs-container") ## wait for original runs to show
        .clock().then (clock) =>
          @getRunsAgain = deferred()
          @App.ipc.withArgs("get:builds").onCall(1).returns(@getRunsAgain.promise)
        .tick(10000)

    it "has original state of runs", ->
      cy
        .get(".runs-container li").first().find("> div")
        .should("have.class", "running")

    it "sends get:runs ipc event", ->
      expect(@App.ipc.withArgs("get:builds")).to.be.calledTwice

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
          err = _.extend(details, {name: "foo", message: "There's an error"})
          @getRunsAgain.reject(err)

      it "displays permissions error", ->
        @ipcError({statusCode: 403})
        cy.contains("Request access")

      it "displays missing project id error", ->
        @ipcError({type: "NO_PROJECT_ID"})
        cy.contains("You Have No Recorded Runs")

      it "displays old runs if another error", ->
        @ipcError({type: "TIMED_OUT"})
        cy.get(".runs-container li").should("have.length", 4)

  describe "manually refreshing runs", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)
      @getRunsAgain = deferred()
      @App.ipc.withArgs("get:builds").onCall(1).returns(@getRunsAgain.promise)

      @getRuns.resolve(@runs)
      @goToRuns().then ->
        cy.get(".runs header button").click()

    it "sends get:runs ipc event", ->
      expect(@App.ipc.withArgs("get:builds")).to.be.calledTwice

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
