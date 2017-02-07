_ = require("lodash")
moment = require("moment")
{deferred, stubIpc} = require("../support/util")

describe "Builds List", ->
  beforeEach ->
    @goToBuilds = (projectName = "My-Fake-Project") =>
      cy
        .get(".projects-list a")
          .contains(projectName).click()
        .get(".navbar-default a")
          .contains("Builds").click()

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
      .fixture("builds").as("builds")
      .fixture("organizations").as("orgs")
      .fixture("ci_keys").as("ciKeys")
      .visit("/")
      .window().then (win) ->
        {@App} = win
        cy.stub(@App, "ipc").as("ipc")

        @getCurrentUser = deferred()
        @getBuilds = deferred()

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
          "get:builds": (stub) => stub.returns(@getBuilds.promise)
          "get:orgs": (stub) => stub.resolves(@orgs)
        })

        @App.start()

  context "displays page", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)
      @getBuilds.resolve(@builds)
      @goToBuilds()

    it "navigates to builds page", ->
      cy
        .location().its("hash").should("include", "builds")

    it "highlight build nav", ->
      cy
        .get(".navbar-default a")
          .contains("Builds").should("have.class", "active")

  context "error states", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)

    describe "permissions error", ->
      beforeEach ->
        @goToBuilds()

      context "statusCode: 403", ->
        beforeEach ->
          @getBuilds.reject({name: "foo", message: "There's an error", statusCode: 403})

        it "displays permissions message", ->
          cy.contains("Request Access")

      context "any case", ->
        beforeEach ->
          @requestAccess = deferred()
          stubIpc(@App.ipc, {
            "request:access": (stub) => stub.returns(@requestAccess.promise)
          })
          @getBuilds.reject({name: "foo", message: "There's an error", statusCode: 403})

        context "request access", ->
          beforeEach ->
            cy.contains("Request Access").click()

          it "sends request:access ipc event with org id", ->
            expect(@App.ipc).to.be.calledWith("request:access", 829)

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
                  .find("a").contains("Builds").click()
                .end().contains("Request Sent")

          describe "when request succeeds and user is already a member", ->
            beforeEach ->
              @requestAccess.reject({name: "foo", message: "There's an error", type: "ALREADY_MEMBER"})
              @getBuilds = deferred()
              @App.ipc.withArgs("get:builds").onCall(1).returns(@getBuilds.promise)
              cy.wait(1)

            it "retries getting builds", ->
              expect(@App.ipc.withArgs("get:builds").callCount).to.equal(2)

            it "shows loading spinner", ->
              cy.get(".loader")

            it "shows builds when getting builds succeeds", ->
              @getBuilds.resolve(@builds)
              cy
                .get(".builds-container li")
                .should("have.length", @builds.length)

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

    describe "timed out error", ->
      beforeEach ->
        @goToBuilds().then =>
          @getBuilds.reject({name: "foo", message: "There's an error", type: "TIMED_OUT"})

      it "displays timed out message", ->
        cy.contains("timed out")

    describe "not found error", ->
      beforeEach ->
        @goToBuilds().then =>
          @getBuilds.reject({name: "foo", message: "There's an error", type: "NOT_FOUND"})

      it "displays empty message", ->
        cy.contains("Builds Cannot Be Displayed")

    describe "no project id error", ->
      beforeEach ->
        stubIpc(@App.ipc, {
          "setup:ci:project": (stub) => stub.resolves(@validCiProject)
        })
        @goToBuilds().then =>
          @getBuilds.reject({name: "foo", message: "There's an error", type: "NO_PROJECT_ID"})

      it "displays 'you have no builds'", ->
        cy.contains("You Have No Recorded Builds")

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
        @goToBuilds().then =>
          @getBuilds.reject({name: "foo", message: """
          {
            "no builds": "for you"
          }
          """, type: "UNKNOWN"})

      it "displays unexpected error message", ->
        cy.contains("unexpected error")
        cy.contains('"no builds": "for you"')

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
          "setup:ci:project": (stub) => stub.resolves(@validCiProject)
        })

        @goToBuilds("project5").then =>
          @getBuilds.resolve([])

      it "displays empty message", ->
        cy.contains("Builds Cannot Be Displayed")

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

    describe "no builds", ->
      context "having never setup CI", ->
        beforeEach ->
          @config.projectId = null
          @App.ipc.withArgs("open:project").resolves(@config)

          @goToBuilds().then =>
            @getBuilds.resolve([])

        it "displays empty message", ->
          cy.contains("You Have No Recorded Builds")

    context "having previously setup CI", ->
      beforeEach ->
        @goToBuilds().then =>
          @getBuilds.resolve([])

      it "displays empty message", ->
        cy.contains("To record your first")

      it "opens project id guide on clicking 'Why?'", ->
        cy
          .contains("Why?").click()
          .then ->
            expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/guides/projects#section-what-is-a-projectid-")

      it "opens dashboard on clicking 'Cypress Dashboard'", ->
        cy
          .contains("Cypress Dashboard").click()
          .then ->
            expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/dashboard/projects/#{@config.projectId}/builds")

  describe "list builds", ->
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
          .contains("Builds").click()
        .then =>
          @getBuilds.resolve(@builds)

    it "lists builds", ->
      cy
        .get(".builds-container li")
        .should("have.length", @builds.length)

    it "displays link to dashboard that goes to admin project builds", ->
      cy
        .contains("See All").click()
        .then ->
          expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/dashboard/projects/#{@projects[0].id}/builds")

    it "displays build status icon", ->
      cy
        .get(".builds-container li").first().find("> div")
        .should("have.class", "running")

    it "displays last updated", ->
      cy.contains("Last updated: 10:00:01am")

    it "clicking build opens admin", ->
      cy
        .get(".builds-container li").first()
        .click()
        .then =>
          expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/dashboard/projects/#{@projects[0].id}/builds/#{@builds[0].id}")

  describe "polling builds", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)
      @getBuildsAgain = deferred()
      @App.ipc.withArgs("get:builds").onCall(1).returns(@getBuildsAgain.promise)

      cy
        .clock()
        .get(".projects-list a")
          .contains("My-Fake-Project").click()
        .tick(1000) ## allow promises from get:specs, etc to resolve
        .get(".navbar-default a")
          .contains("Builds").click()
        .then =>
          @getBuilds.resolve(@builds)
        .get(".builds-container") ## wait for original builds to show
        .clock().then (clock) =>
          @getBuildsAgain = deferred()
          @App.ipc.withArgs("get:builds").onCall(1).returns(@getBuildsAgain.promise)
        .tick(10000)

    it "has original state of builds", ->
      cy
        .get(".builds-container li").first().find("> div")
        .should("have.class", "running")

    it "sends get:builds ipc event", ->
      expect(@App.ipc.withArgs("get:builds")).to.be.calledTwice

    it "disables refresh button", ->
      cy.get(".builds header button").should("be.disabled")

    it "spins the refresh button", ->
      cy.get(".builds header button i").should("have.class", "fa-spin")

    context "success", ->
      beforeEach ->
        @builds[0].status = "passed"
        @getBuildsAgain.resolve(@builds)

      it "updates the builds", ->
        cy
          .get(".builds-container li").first().find("> div")
          .should("have.class", "passed")

      it "enables refresh button", ->
        cy.get(".builds header button").should("not.be.disabled")

      it "stops spinning the refresh button", ->
        cy.get(".builds header button i").should("not.have.class", "fa-spin")

    context "errors", ->
      beforeEach ->
        @ipcError = (details) =>
          err = _.extend(details, {name: "foo", message: "There's an error"})
          @getBuildsAgain.reject(err)

      it "displays permissions error", ->
        @ipcError({statusCode: 403})
        cy.contains("Request access")

      it "displays missing project id error", ->
        @ipcError({type: "NO_PROJECT_ID"})
        cy.contains("You Have No Recorded Builds")

      it "displays old builds if another error", ->
        @ipcError({type: "TIMED_OUT"})
        cy.get(".builds-container li").should("have.length", 4)

  describe "manually refreshing builds", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)
      @getBuildsAgain = deferred()
      @App.ipc.withArgs("get:builds").onCall(1).returns(@getBuildsAgain.promise)

      @getBuilds.resolve(@builds)
      @goToBuilds().then ->
        cy.get(".builds header button").click()

    it "sends get:builds ipc event", ->
      expect(@App.ipc.withArgs("get:builds")).to.be.calledTwice

    it "still shows list of builds", ->
      cy.get(".builds-container li").should("have.length", 4)

    it "disables refresh button", ->
      cy.get(".builds header button").should("be.disabled")

    it "spins the refresh button", ->
      cy.get(".builds header button i").should("have.class", "fa-spin")

    describe "when builds have loaded", ->
      beforeEach ->
        @getBuildsAgain.resolve(@builds)

      it "enables refresh button", ->
        cy.get(".builds header button").should("not.be.disabled")

      it "stops spinning the refresh button", ->
        cy.get(".builds header button i").should("not.have.class", "fa-spin")
