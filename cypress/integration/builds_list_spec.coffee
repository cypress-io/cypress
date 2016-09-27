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
          cy.contains("Run your first")

        it "opens setup project window", ->
          cy
            .get(".btn").contains("Setup Project for CI").click()
            .get(".modal").should("be.visible")

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
          cy.contains("No builds found")

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
          .get(".builds-list a")

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

