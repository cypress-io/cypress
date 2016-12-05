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
        .fixture("user").then (@user) ->
          @ipc.handle("get:current:user", null, @user)
        .fixture("projects").then (@projects) ->
          @ipc.handle("get:projects", null, @projects)
        .get(".projects-list a")
          .contains("My-Fake-Project").click()
        .fixture("browsers").as("browsers")

    describe "permissions error", ->
      beforeEach ->
        @ipc.handle("get:builds", {name: "foo", message: "There's an error", statusCode: 401}, null)
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

    describe "no builds", ->
      context "having never setup CI", ->
        beforeEach ->
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

          describe "project name", ->
            it "prefills Project Name", ->
              cy
                .get("#projectName").should("have.value", @firstProjectName)

            it "allows me to change Project Name value", ->
              @newProjectName = "New Project Here"

              cy
                .get("#projectName").clear().type(@newProjectName)
                .get("#projectName").should("have.value", @newProjectName)

          describe "lists organizations", ->
            it "lists organizations to assign to project", ->
              cy
                .get("#organizations-select").find("option").should("have.length", @orgs.length)

            it "selects default org by default", ->
              cy
                .get("#organizations-select").should("have.value", "000")

            it "opens external link on click of manage", ->
              cy
                .contains("manage").click().then ->
                   expect(@App.ipc).to.be.calledWith("external:open", "https://app.cypress.io")

          describe "public v private", ->
            it "displays public and private radios", ->
              cy
                .get(".modal-body").contains("Public")
                .get(".modal-body").contains("Private")

          describe "successfully submit form", ->
            beforeEach ->
              cy
                .get(".modal-body")
                .contains(".btn", "Setup Project").click()

            it "calls ipc event"

            it "sends data from form to ipc event"

            it "closes modal"

            it "displays new page"

          describe "errors on form submit", ->
            beforeEach ->
              cy
                .get(".modal-body")
                .contains(".btn", "Setup Project").click()

            it "displays errors"

            it "does not close modal"

      context "having previously setup CI", ->
        beforeEach ->
          @ipc.handle("get:builds", null, [])
          cy
            .fixture("config").then (@config) ->
              @ipc.handle("open:project", null, @config)
            .fixture("specs").as("specs").then ->
              @ipc.handle("get:specs", null, @specs)
            .get(".nav a").contains("Builds").click()

        it "displays empty message", ->
          cy.contains("No Builds Found")

    describe "list builds", ->
      beforeEach ->
        @ipc.handle("get:builds", null, @builds)
        cy
          .fixture("config").then (@config) ->
            @ipc.handle("open:project", null, @config)
          .fixture("specs").as("specs").then ->
            @ipc.handle("get:specs", null, @specs)
          .get(".nav a").contains("Builds").click()

      it "lists builds", ->
        cy
          .get(".builds-list li")
          .should("have.length", 4)

  context "without a current user", ->
    beforeEach ->
      cy
        .then () ->
          @ipc.handle("get:current:user", null, {})
        .fixture("projects").then (@projects) ->
          @ipc.handle("get:projects", null, @projects)
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
