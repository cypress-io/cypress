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
        @ipc.handle("get:builds", {name: "foo", message: "There's an error", type: "UNAUTHENTICATED"}, null)
        cy
          .fixture("config").then (@config) ->
            @ipc.handle("open:project", null, @config)
          .fixture("specs").as("specs").then ->
            @ipc.handle("get:specs", null, @specs)
          .get(".nav a").contains("Builds").click()

      it "displays permissions message", ->
        cy.contains("Request access")

      context "request access", ->
        beforeEach ->
          cy
            .get(".btn").contains("Request Access").click()

        it "opens modal on click of request access", ->
          cy
            .get(".modal").should("be.visible")

    describe "timed out error", ->
      beforeEach ->
        cy
          .get(".projects-list a")
            .contains("My-Fake-Project").click()
        @ipc.handle("get:builds", {name: "foo", message: "There's an error", type: "TIMED_OUT"}, null)
        cy
          .fixture("config").then (@config) ->
            @ipc.handle("open:project", null, @config)
          .fixture("specs").as("specs").then ->
            @ipc.handle("get:specs", null, @specs)
          .get(".nav a").contains("Builds").click()

      it "displays timed out message", ->
        cy.contains("timed out")

    describe "no project id error", ->
      beforeEach ->
        cy
          .get(".projects-list a")
            .contains("My-Fake-Project").click()
        @ipc.handle("get:builds", {name: "foo", message: "There's an error", type: "NO_PROJECT_ID"}, null)
        cy
          .fixture("config").then (@config) ->
            @ipc.handle("open:project", null, @config)
          .fixture("specs").as("specs").then ->
            @ipc.handle("get:specs", null, @specs)
          .get(".nav a").contains("Builds").click()

      it "displays getting started message", ->
        cy.contains("Getting Started with CI")

    describe "unexpected error", ->
      beforeEach ->
        cy
          .get(".projects-list a")
            .contains("My-Fake-Project").click()
        @ipc.handle("get:builds", {name: "foo", stack: "There's an error", type: "UNKNOWN"}, null)
        cy
          .fixture("config").then (@config) ->
            @ipc.handle("open:project", null, @config)
          .fixture("specs").as("specs").then ->
            @ipc.handle("get:specs", null, @specs)
          .get(".nav a").contains("Builds").click()

      it "displays unexpected error message", ->
        cy.contains("unexpected error")
        cy.contains("There's an error")

    describe "invalid project", ->
      beforeEach ->
        cy
          .get(".projects-list a")
            .contains("project5").click()
        @ipc.handle("get:builds", null, [])
        cy
          .fixture("config").then (@config) ->
            @config.projectId = null
            @ipc.handle("open:project", null, @config)
          .fixture("specs").as("specs").then ->
            @ipc.handle("get:specs", null, @specs)
          .get(".nav a").contains("Builds").click()

      it "displays empty message", ->
        cy.contains("Builds Cannot Be Displayed")

      it "clicking link opens setup project window", ->
        cy
          .fixture("organizations").as("orgs").then ->
            @ipc.handle("get:orgs", null, @orgs)
          .get(".btn").contains("Setup a New Project for CI").click()
          .get(".modal").should("be.visible")

    describe "no builds", ->
      context "having never setup CI", ->
        beforeEach ->
          cy
            .get(".projects-list a")
              .contains("My-Fake-Project").click()
          @ipc.handle("get:builds", null, [])
          cy
            .fixture("config").then (@config) ->
              @config.projectId = null
              @ipc.handle("open:project", null, @config)
            .fixture("specs").as("specs").then ->
              @ipc.handle("get:specs", null, @specs)
            .get(".nav a").contains("Builds").click()

        it "displays empty message", ->
          cy.contains("Getting Started with CI")

        describe "setup project window", ->
          beforeEach ->
            cy
              .fixture("organizations").as("orgs").then ->
                @ipc.handle("get:orgs", null, @orgs)
              .get(".btn").contains("Setup Project for CI").click()

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
                 expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/admin/manage-orgs")

          it "displays public and private radios", ->
            cy
              .get(".modal-body").contains("Public")
              .get(".modal-body").contains("Private")

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
              @ipc.handle("get:ci:keys", null, [{id: "ci-key-123"}])

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
              cy.contains("Run Your First Build in CI")

            describe "welcome page", ->
              it "displays command to run with the ci key", ->
                cy.contains("cypress ci ci-key-123")

              it "displays link to CI docs", ->
                cy
                  .get("#builds-list-page a")
                  .should("have.text", " Learn more about Continuous Integration")

              it "does not display message about inviting users", ->
                cy.contains("invite other users").should("not.exist")

              it "clicking link opens CI guide", ->
                cy
                  .get("#builds-list-page a")
                  .click()
                  .then =>
                    expect(@App.ipc).to.be.calledWith("external:open", "http://on.cypress.io/guides/continuous-integration")

          describe "when project is private", ->
            beforeEach ->
              @ipc.handle("setup:ci:project", null, {id: "project-id-123", public: false})
              @ipc.handle("get:ci:keys", null, [{id: "ci-key-123"}])
              cy
                .get("input[name=privacy-radio][value=false]")
                .click()

              cy
                .get(".modal-body")
                .contains(".btn", "Setup Project").click()

            it "displays message about inviting users", ->
              cy.contains("invite other users")

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


              it "clears validation error after inputing name", ->
                cy.get("#projectName").type("project name")
                cy.contains("Please enter a project name").should("not.be.visible")

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
          cy.contains("Run Your First Build in CI")

    describe "list builds", ->
      beforeEach ->
        cy
          .window().then (win) =>
            timestamp = moment("2016-12-19 10:00:00").valueOf()
            @clock = win.sinon.useFakeTimers(timestamp)
          .get(".projects-list a").contains("My-Fake-Project").click()
          .fixture("config").then (@config) ->
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
          .get(".builds-list li")
          .should("have.length", 4)

      it "displays build status icon", ->
        cy
          .get(".builds-list li").first().find("> div")
          .should("have.class", "running")

      it "displays last updated", ->
        cy.contains("Last updated: 10:00:02am")

    describe "pagination", ->
      beforeEach ->
        @thirtyBuilds = _.range(30).map =>
          _.extend({}, @builds[0], {id: _.uniqueId()})

        @tenBuilds = _.take(@thirtyBuilds, 10)

        cy
          .get(".projects-list a").contains("My-Fake-Project").click()
          .fixture("config").then (@config) ->
            @ipc.handle("open:project", null, @config)
          .fixture("specs").as("specs").then ->
            @ipc.handle("get:specs", null, @specs)

      describe "buttons", ->
        beforeEach ->
          cy.get(".nav a").contains("Builds").click()

        describe "when on the first page", ->
          beforeEach ->
            @ipc.handle("get:builds", null, @builds)

          it "hides the newer button", ->
            cy.contains("Newer builds").should("not.be.visible")

        describe "when not on the first page", ->
          beforeEach ->
            @ipc.handle("get:builds", null, @thirtyBuilds)
            .then ->
              cy.contains("Older builds").click()
            .then =>
              @ipc.handle("get:builds", null, @tenBuilds)

          it "shows the newer button", ->
            cy.contains("Newer builds").should("be.visible")

          it "sets the newer button href to previous page", ->
            cy.contains("Newer builds").invoke("attr", "href").should("include", "?page=1")

        describe "when less than 30 builds", ->
          beforeEach ->
            @ipc.handle("get:builds", null, @builds)

          it "hides the older button", ->
            cy.contains("Older builds").should("not.be.visible")

        describe "when exactly 30 builds", ->
          beforeEach ->
            @ipc.handle("get:builds", null, @thirtyBuilds)

          it "shows the older button", ->
            cy.contains("Older builds").should("be.visible")

          it "sets the older button href to next page", ->
            cy.contains("Older builds").invoke("attr", "href").should("include", "?page=2")

      describe "going from page 1 to page 2", ->
        beforeEach ->
          cy
            .window().then (win) =>
              @clock = win.sinon.useFakeTimers()
            .get(".nav a").contains("Builds").click()
            .then =>
              @ipc.handle("get:builds", null, @thirtyBuilds)
            .then ->
              cy.contains("Older builds").click()
            .then ->
              @clock.tick(1000)

        afterEach ->
          @clock.restore()

        it "loads the builds for page 2", ->
          expect(@App.ipc.withArgs("get:builds")).to.be.calledTwice
          expect(@App.ipc.withArgs("get:builds").lastCall.args[1]).to.eql({page: 2})

        it "does not poll for builds", ->
          @clock.tick(10000)
          expect(@App.ipc.withArgs("get:builds")).to.be.calledTwice

        it "displays the 2nd page of builds", ->
          @ipc.handle("get:builds", null, @tenBuilds).then ->
            cy
              .get(".builds-list li")
              .should("have.length", 10)

        describe "then going back to page 1", ->
          beforeEach ->
            cy.contains("Newer builds").click()

          it "loads the builds for page 1", ->
            expect(@App.ipc.withArgs("get:builds")).to.be.calledThrice
            expect(@App.ipc.withArgs("get:builds").lastCall.args[1]).to.eql({page: 1})

          it "polls again", ->
            @clock.tick(10000)
            expect(@App.ipc.withArgs("get:builds").callCount).to.equal(4)

      describe "refreshing page 2", ->
        beforeEach ->
          cy
            .visit("/#/projects/e40991dc055454a2f3598752dec39abc/builds?page=2")
            .window().then (win) =>
              @clock = win.sinon.useFakeTimers()

        afterEach ->
          @clock.restore()

        it "loads the builds for page 2", ->
          expect(@App.ipc.withArgs("get:builds")).to.be.calledOnce
          expect(@App.ipc.withArgs("get:builds").lastCall.args[1]).to.eql({page: 2})

        it "does not poll for builds", ->
          @clock.tick(10000)
          expect(@App.ipc.withArgs("get:builds")).to.be.calledOnce

        it "displays the 2nd page of builds", ->
          @ipc.handle("get:builds", null, @tenBuilds).then ->
            cy
              .get(".builds-list li")
              .should("have.length", 10)

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
          .get(".builds-list li").first().find("> div")
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
            .get(".builds-list li").first().find("> div")
            .should("have.class", "passed")

        it "enables refresh button", ->
          cy.get(".builds header button").should("not.be.disabled")

        it "stops spinning the refresh button", ->
          cy.get(".builds header button i").should("not.have.class", "fa-spin")

      context "errors", ->
        beforeEach ->
          @clock.tick(10000)
          @ipcError = (type) =>
            @ipc.handle("get:builds", {name: "foo", message: "There's an error", type: type}, null)

        it "displays permissions error", ->
          @ipcError("UNAUTHENTICATED").then ->
            cy.contains("Request access")

        it "displays missing project id error", ->
          @ipcError("NO_PROJECT_ID").then ->
            cy.contains("Getting Started with CI")

        it "displays old builds if another error", ->
          @ipcError("TIMED_OUT").then ->
            cy.get(".builds-list li").should("have.length", 4)

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
        cy.get(".builds-list li").should("have.length", 4)

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

  context "without a current user", ->
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
