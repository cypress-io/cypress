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
        .get(".navbar-default")
        .get("a").contains("Build").click()

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
        .fixture("config").then (@config) ->
          @ipc.handle("open:project", null, @config)
        .fixture("specs").as("specs").then ->
          @ipc.handle("get:specs", null, @specs)
        .get(".navbar-default")
        .get("a").contains("Build").click()

    describe "no builds", ->
      beforeEach ->
        cy
          .then ->
            @ipc.handle("get:builds", null, [])

      it "displays empty message", ->
        cy.contains("Run your first")

    describe "permissions error", ->
      beforeEach ->
        cy
          .then ->
            @ipc.handle("get:builds", {name: "foo", message: "There's an error", statusCode: 401}, null)

      it "displays permissions message", ->
        cy.contains("have permission")

    describe "list builds", ->
      beforeEach ->
        cy
          .fixture("builds").then (@builds) ->
            @ipc.handle("get:builds", null, @builds)

      it "lists builds", ->
        cy
          .get(".builds-list a")

  context "without a current user", ->
    context "links", ->
      beforeEach ->
        cy
          .then () ->
            @ipc.handle("get:current:user", null, {})
          .fixture("projects").then (@projects) ->
            @ipc.handle("get:projects", null, @projects)
          .get(".projects-list a")
            .contains("My-Fake-Project").click()
          .fixture("browsers").as("browsers")
          .fixture("config").then (@config) ->
            @ipc.handle("open:project", null, @config)
          .get(".navbar-default")
          .get("a").contains("Build").click()

      it "shows login screen", ->
        cy.contains('You Need to Login')

