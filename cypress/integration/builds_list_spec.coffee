_ = require("lodash")
moment = require("moment")

describe "Builds List", ->
  beforeEach ->
    @firstProjectName = "My-Fake-Project"

    cy
      .visit("/")
      .window().then (win) ->
        {@ipc, @App} = win
        @agents = cy.agents()
        @ipc.handle("get:options", null, {})
        @agents.spy(@App, "ipc")
      .fixture("builds").as("builds")

  context "displays page", ->
    beforeEach ->
      cy
        .fixture("user").then (@user) ->
          @ipc.handle("get:current:user", null, @user)
        .fixture("projects").then (@projects) ->
          @ipc.handle("get:projects", null, @projects)
        .get(".projects-list a")
          .contains("My-Fake-Project").click()
        .fixture("browsers").as("browsers")
        .fixture("config").then (@config) ->
          @ipc.handle("open:project", null, @config)
        .fixture("specs").as("specs").then ->
          @ipc.handle("get:specs", null, @specs)
        .get(".navbar-default")
        .find("a").contains("Builds").click()

    it "navigates to builds page", ->
      cy
        .location().its("hash").should("include", "builds")

    it "highlight build nav", ->
      cy
        .contains("a", "Build").should("have.class", "active")

  context "with a current user", ->
    beforeEach ->
      cy
        .fixture("browsers").as("browsers")
        .fixture("user").then (@user) ->
          @ipc.handle("get:current:user", null, @user)
        .fixture("projects").then (@projects) ->
          @ipc.handle("get:projects", null, @projects)
        .fixture("projects_statuses").then (@projects_statuses) =>
          @ipc.handle("get:project:statuses", null, @projects_statuses)

    describe "permissions error", ->
      beforeEach ->
        cy
          .get(".projects-list a")
            .contains("My-Fake-Project").click()
          .fixture("config").then (@config) ->
            @ipc.handle("open:project", null, @config)
          .fixture("specs").as("specs").then ->
            @ipc.handle("get:specs", null, @specs)
          .get(".nav a").contains("Builds").click()

      ## currently redirects to login
      ## enable after login requirement is removed
      context.skip "type: UNAUTHENTICATED", ->
        beforeEach ->
          @ipc.handle("get:builds", {name: "foo", message: "There's an error", type: "UNAUTHENTICATED"}, null)

        it "displays permissions message", ->
          cy.contains("Request Access")

      ## currently redirects to login
      ## enable after login requirement is removed
      context.skip "statusCode: 401", ->
        beforeEach ->
          @ipc.handle("get:builds", {name: "foo", message: "There's an error", statusCode: 401}, null)

        it "displays permissions message", ->
          cy.contains("Request Access")

      context "statusCode: 403", ->
        beforeEach ->
          @ipc.handle("get:builds", {name: "foo", message: "There's an error", statusCode: 403}, null)

        it "displays permissions message", ->
          cy.contains("Request Access")

      context "any case", ->
        beforeEach ->
          @ipc.handle("get:builds", {name: "foo", message: "There's an error", statusCode: 403}, null)

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
              @ipc.handle("request:access")

            it "shows success message", ->
              cy.contains("Request Sent")

            it "'persists' request state (until app is reloaded at least)", ->
              cy
                .contains("Back to Projects").click()
                .get(".projects-list a")
                  .contains("My-Fake-Project").click()
                .fixture("config").then (@config) ->
                  @ipc.handle("open:project", null, @config)
                .fixture("specs").as("specs").then ->
                  @ipc.handle("get:specs", null, @specs)
                .get(".navbar-default")
                  .find("a").contains("Builds").click()
                .then =>
                  @ipc.handle("get:builds", {name: "foo", message: "There's an error", statusCode: 403}, null)
                .end().contains("Request Sent")

          describe "when request succeeds and user is already a member", ->
            beforeEach ->
              @ipc.handle("request:access", {name: "foo", message: "There's an error", type: "ALREADY_MEMBER"})
              cy.wait(1)

            it "retries getting builds", ->
              expect(@App.ipc.withArgs("get:builds").callCount).to.equal(2)

            it "shows loading spinner", ->
              cy.get(".loader")

            it "shows builds when getting builds succeeds", ->
              @ipc.handle("get:builds", null, @builds).then =>
                cy
                  .get(".builds-container li")
                  .should("have.length", @builds.length)

          describe "when request fails", ->
            describe "for unknown reason", ->
              beforeEach ->
                @ipc.handle("request:access", {name: "foo", message: """
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
                @ipc.handle("request:access", {type: "DENIED", name: "foo", message: "There's an error"})

              it "shows 'success' message", ->
                cy.contains("Request Sent")

            describe "because request was already sent", ->
              beforeEach ->
                @ipc.handle("request:access", {type: "ALREADY_REQUESTED", name: "foo", message: "There's an error"})

              it "shows 'success' message", ->
                cy.contains("Request Sent")

    describe "timed out error", ->
      beforeEach ->
        cy
          .get(".projects-list a")
            .contains("My-Fake-Project").click()
          .fixture("config").then (@config) ->
            @ipc.handle("open:project", null, @config)
          .fixture("specs").as("specs").then ->
            @ipc.handle("get:specs", null, @specs)
          .get(".nav a").contains("Builds").click()
          .then =>
            @ipc.handle("get:builds", {name: "foo", message: "There's an error", type: "TIMED_OUT"}, null)

      it "displays timed out message", ->
        cy.contains("timed out")

    describe "not found error", ->
      beforeEach ->
        cy
          .get(".projects-list a")
            .contains("My-Fake-Project").click()
          .fixture("config").then (@config) ->
            @ipc.handle("open:project", null, @config)
          .fixture("specs").as("specs").then ->
            @ipc.handle("get:specs", null, @specs)
          .get(".nav a").contains("Builds").click()
          .then =>
            @ipc.handle("get:builds", {name: "foo", message: "There's an error", type: "NOT_FOUND"}, null)

      it "displays empty message", ->
        cy.contains("Builds Cannot Be Displayed")

    describe "no project id error", ->
      beforeEach ->
        cy
          .get(".projects-list a")
            .contains("My-Fake-Project").click()
          .fixture("config").then (@config) ->
            @ipc.handle("open:project", null, @config)
          .fixture("specs").as("specs").then ->
            @ipc.handle("get:specs", null, @specs)
          .get(".nav a").contains("Builds").click()
          .then =>
            @ipc.handle("get:builds", {name: "foo", message: "There's an error", type: "NO_PROJECT_ID"}, null)

      it "displays 'you have no builds'", ->
        cy.contains("You Have No Recorded Builds")

      it "clears message after setting up CI", ->
        cy
          .fixture("organizations").as("orgs").then ->
            @ipc.handle("get:orgs", null, @orgs)
          .get(".btn").contains("Setup Project").click()
          .get(".modal-body")
          .contains(".btn", "Setup Project").click()
          .then ->
            @ipc.handle("setup:ci:project", null, {
              id: "project-id-123"
              public: true
              orgId: "000"
            })
          .end().contains("You're ready to run")

    describe "unexpected error", ->
      beforeEach ->
        cy
          .get(".projects-list a")
            .contains("My-Fake-Project").click()
          .fixture("config").then (@config) ->
            @ipc.handle("open:project", null, @config)
          .fixture("specs").as("specs").then ->
            @ipc.handle("get:specs", null, @specs)
          .get(".nav a").contains("Builds").click()
          .then =>
            @ipc.handle("get:builds", {name: "foo", message: """
            {
              "no builds": "for you"
            }
            """, type: "UNKNOWN"}, null)

      it "displays unexpected error message", ->
        cy.contains("unexpected error")
        cy.contains('"no builds": "for you"')

    describe "unauthorized project", ->
      beforeEach ->
        cy
          .get(".projects-list a")
            .contains("project4").click()
          .fixture("config").then (@config) ->
            @config.projectId = null
            @ipc.handle("open:project", null, @config)
          .fixture("specs").as("specs").then ->
            @ipc.handle("get:specs", null, @specs)
          .then =>
            @ipc.handle("get:builds", null, [])

      it "displays permissions message", ->
        cy.contains("Request access")

    describe "invalid project", ->
      beforeEach ->
        cy
          .get(".projects-list a")
            .contains("project5").click()
          .fixture("config").then (@config) ->
            @config.projectId = null
            @ipc.handle("open:project", null, @config)
          .fixture("specs").as("specs").then ->
            @ipc.handle("get:specs", null, @specs)
          .then =>
            @ipc.handle("get:builds", null, [])

      it "displays empty message", ->
        cy.contains("Builds Cannot Be Displayed")

      it "clicking link opens setup project window", ->
        cy
          .fixture("organizations").as("orgs").then ->
            @ipc.handle("get:orgs", null, @orgs)
          .get(".btn").contains("Setup a New Project").click()
          .get(".modal").should("be.visible")

      it "clears message after setting up CI", ->
        cy
          .fixture("organizations").as("orgs").then ->
            @ipc.handle("get:orgs", null, @orgs)
          .get(".btn").contains("Setup a New Project").click()
          .get(".modal-body")
          .contains(".btn", "Setup Project").click()
          .then ->
            @ipc.handle("setup:ci:project", null, {
              id: "project-id-123"
              public: true
              orgId: "000"
            })
          .end().contains("You're ready to run")

    describe "no builds", ->
      context "having never setup CI", ->
        beforeEach ->
          cy
            .get(".projects-list a")
              .contains("My-Fake-Project").click()
            .fixture("ci_keys").as("ciKeys")
            .fixture("config").then (@config) ->
              @config.projectId = null
              @ipc.handle("open:project", null, @config)
            .fixture("specs").as("specs").then ->
              @ipc.handle("get:specs", null, @specs)
            .get(".nav a").contains("Builds").click()
            .then =>
              @ipc.handle("get:builds", null, [])

        it "displays empty message", ->
          cy.contains("You Have No Recorded Builds")

        describe "setup project window", ->
          beforeEach ->
            cy
              .fixture("organizations").as("orgs").then ->
                @ipc.handle("get:orgs", null, @orgs)
              .get(".btn").contains("Setup Project").click()

          it "clicking link opens setup project window", ->
            cy
              .get(".modal").should("be.visible")

          it "prefills Project Name", ->
            cy
              .get("#projectName").should("have.value", @firstProjectName)

          it "allows me to change Project Name value", ->
            @newProjectName = "New Project Here"

            cy
              .get("#projectName").clear().type(@newProjectName)
              .get("#projectName").should("have.value", @newProjectName)

          it "lists organizations to assign to project", ->
            cy
              .get("#organizations-select").find("option").should("have.length", @orgs.length)

          it "selects default org by default", ->
            cy
              .get("#organizations-select").should("have.value", "000")

          it "opens external link on click of manage", ->
            cy
              .contains("manage").click().then ->
                 expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/dashboard/settings")

          it "displays public and private radios w/ public preselected", ->
            cy
              .get(".modal-body").contains("Public")
                .find("input").should("be.checked")
              .get(".modal-body").contains("Private")
                .find("input").should("not.be.checked")

          describe "on submit", ->
            beforeEach ->
              cy
                .get(".modal-body")
                .contains(".btn", "Setup Project").click()

            it "disables button", ->
              cy
                .get(".modal-body")
                .contains(".btn", "Setup Project")
                .should("be.disabled")

            it "hides button text", ->
              cy
                .get(".modal-body")
                .contains(".btn", "Setup Project")
                .find("span")
                .should("not.be.visible")

            it "shows spinner", ->
              cy
                .get(".modal-body")
                .contains(".btn", "Setup Project")
                .find("i")
                .should("be.visible")

          describe "successfully submit form", ->
            beforeEach ->
              @ipc.handle("setup:ci:project", null, {
                id: "project-id-123"
                public: true
                orgId: "000"
              })
              @ipc.handle("get:ci:keys", null, @ciKeys)

              cy
                .get(".modal-body")
                .contains(".btn", "Setup Project").click()

            it "sends data from form to ipc event", ->
              expect(@App.ipc).to.be.calledWith("setup:ci:project", {
                projectName: "My-Fake-Project"
                orgId: "000"
                public: true
              })

            it "closes modal", ->
              cy.get(".modal").should("not.be.visible")

            it "updates localStorage projects cache", ->
              expect(JSON.parse(localStorage.projects || "[]")[0].orgName).to.equal("Jane Lane")

            it "displays empty builds page", ->
              cy.contains("You're ready to run")

            it "links CLI tools to npm package", ->
              cy.contains("CLI tools").click().then =>
                expect(@App.ipc).to.be.calledWith("external:open", "https://www.npmjs.com/package/cypress-cli")

            describe "welcome page", ->
              it "displays command to run with the ci key", ->
                cy.contains("cypress ci ci-key-123")

              it "displays link to CI docs", ->
                cy
                  .get(".first-build-instructions a").eq(1)
                  .should("have.text", " Learn more")

              it "does not display message about inviting users", ->
                cy.contains("Cypress Dashboard").should("not.exist")

              it "clicking link opens CI guide", ->
                cy
                  .get(".first-build-instructions a").eq(1)
                  .click()
                  .then =>
                    expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/guides/continuous-integration")

          describe "when project is private", ->
            beforeEach ->
              @id = "project-id-123"
              @ipc.handle("setup:ci:project", null, {id: @id, public: false})
              @ipc.handle("get:ci:keys", null, @ciKeys)
              cy
                .get("input[name=privacy-radio][value=false]")
                .click()
                .get(".modal-body")
                .contains(".btn", "Setup Project").click()

            it "displays message about inviting users", ->
              cy.contains("Cypress Dashboard")

            it "opens link to builds in dashboard", ->
              cy
                .contains("Cypress Dashboard").click().then =>
                  expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/dashboard/projects/#{@id}/builds")


          describe "errors on form submit", ->
            beforeEach ->
              cy
                .get("#projectName").clear()
                .get(".modal-body")
                .contains(".btn", "Setup Project").click()

            it "enables button", ->
              cy
                .get(".modal-body")
                .contains(".btn", "Setup Project")
                .should("not.be.disabled")

            it "shows button text", ->
              cy
                .get(".modal-body")
                .contains(".btn", "Setup Project")
                .find("span")
                .should("be.visible")

            it "hide spinner", ->
              cy
                .get(".modal-body")
                .contains(".btn", "Setup Project")
                .find("i")
                .should("not.be.visible")

            it "displays name missing error when empty", ->
              cy.contains("Please enter a project name").should("be.visible")

            it "clears validation error after inputing name", ->
              cy.get("#projectName").type("project name")
              cy.contains("Please enter a project name").should("not.be.visible")

          describe "errors from ipc event", ->
            beforeEach ->
              cy
                .get(".modal-body")
                .contains(".btn", "Setup Project").click()
                .then =>
                  @ipc.handle("setup:ci:project", {
                    name: "Fatal Error!"
                    message: """
                    {
                      "system": "down",
                      "toxicity": "of the city"
                    }
                    """
                  })

            it "displays error name and message", ->
              cy.contains('"system": "down"')

      context "having previously setup CI", ->
        beforeEach ->
          cy
            .get(".projects-list a")
              .contains("My-Fake-Project").click()
          @ipc.handle("get:builds", null, [])
          cy
            .fixture("config").then (@config) ->
              @ipc.handle("open:project", null, @config)
            .fixture("specs").as("specs").then ->
              @ipc.handle("get:specs", null, @specs)
            .get(".nav a").contains("Builds").click()

        it "displays empty message", ->
          cy.contains("You're ready to run")

    describe "list builds", ->
      beforeEach ->
        cy
          .window().then (win) =>
            timestamp = moment("2016-12-19 10:00:00").valueOf()
            @clock = win.sinon.useFakeTimers(timestamp)
          .get(".projects-list a").contains("My-Fake-Project").click()
          .fixture("config").then (@config) ->
            @config.projectId = @projects[0].id
            @ipc.handle("open:project", null, @config)
            @clock.tick(1000)
          .fixture("specs").as("specs").then ->
            @ipc.handle("get:specs", null, @specs)
            @clock.tick(1000)
          .get(".nav a").contains("Builds").click()
          .then =>
            @ipc.handle("get:builds", null, @builds)

      afterEach ->
        @clock.restore()

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
        cy.contains("Last updated: 10:00:02am")

      it "clicking build opens admin", ->
        cy
          .get(".builds-container li").first()
          .click()
          .then =>
            expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/dashboard/projects/#{@projects[0].id}/builds/#{@builds[0].id}")

    describe "polling builds", ->
      beforeEach ->
        cy
          .window().then (win) =>
            @clock = win.sinon.useFakeTimers()
          .get(".projects-list a")
            .contains("My-Fake-Project").click()
          .fixture("config").then (@config) ->
            @ipc.handle("open:project", null, @config)
            @clock.tick(1000)
          .fixture("specs").as("specs").then ->
            @ipc.handle("get:specs", null, @specs)
            @clock.tick(1000)
          .get(".nav a").contains("Builds").click()
          .then =>
            @ipc.handle("get:builds", null, @builds)
            @clock.tick(1000)
          .then =>
            @clock.tick(10000)

      afterEach ->
        @clock.restore()

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
          @ipc.handle("get:builds", null, @builds)

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
          @clock.tick(10000)
          @ipcError = (details) =>
            err = _.extend(details, {name: "foo", message: "There's an error"})
            @ipc.handle("get:builds", err, null)

        it "displays permissions error", ->
          @ipcError({statusCode: 403}).then ->
            cy.contains("Request access")

        it "displays missing project id error", ->
          @ipcError({type: "NO_PROJECT_ID"}).then ->
            cy.contains("You Have No Recorded Builds")

        it "displays old builds if another error", ->
          @ipcError({type: "TIMED_OUT"}).then ->
            cy.get(".builds-container li").should("have.length", 4)

    describe "manually refreshing builds", ->
      beforeEach ->
        cy
          .get(".projects-list a")
            .contains("My-Fake-Project").click()
          .fixture("config").then (@config) ->
            @ipc.handle("open:project", null, @config)
          .fixture("specs").as("specs").then ->
            @ipc.handle("get:specs", null, @specs)
          .get(".nav a").contains("Builds").click()
          .then =>
            @ipc.handle("get:builds", null, @builds)
          .get(".builds header button").click()

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
          @ipc.handle("get:builds", null, @builds)

        it "enables refresh button", ->
          cy.get(".builds header button").should("not.be.disabled")

        it "stops spinning the refresh button", ->
          cy.get(".builds header button i").should("not.have.class", "fa-spin")

  context.skip "without a current user", ->
    beforeEach ->
      cy
        .then () ->
          @ipc.handle("get:current:user", null, {})
        .fixture("projects").then (@projects) ->
          @ipc.handle("get:projects", null, @projects)
        .fixture("projects_statuses").then (@projects_statuses) =>
          @ipc.handle("get:project:statuses", null, @projects_statuses)
        .get(".projects-list a")
          .contains("My-Fake-Project").click()
        .fixture("browsers").as("browsers")

    context "having never setup CI", ->
      beforeEach ->
        cy
          .fixture("config").then (@config) ->
            @config.projectId = null
            @ipc.handle("open:project", null, @config)
          .fixture("specs").as("specs").then ->
            @ipc.handle("get:specs", null, @specs)
          .get(".navbar-default")
          .find("a").contains("Builds").click()

      it "shows login screen with CI message", ->
        cy.contains('Log in to Setup CI')

    context "having previously setup CI", ->
      beforeEach ->
        cy
          .fixture("config").then (@config) ->
            @ipc.handle("open:project", null, @config)
          .fixture("specs").as("specs").then ->
            @ipc.handle("get:specs", null, @specs)
          .get(".navbar-default")
          .find("a").contains("Builds").click()

      it "shows login screen with builds message", ->
        cy.contains('Log in to see Builds')
