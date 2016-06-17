describe "Projects Nav", ->
  beforeEach ->
    cy
      .visit("/")
      .window().then (win) ->
        {@ipc, @App} = win

        @agents = cy.agents()

        @agents.spy(@App, "ipc")

        @ipc.handle("get:options", null, {})

  describe "no projects", ->
    beforeEach ->
      cy
        .fixture("user").then (@user) ->
          @ipc.handle("get:current:user", null, @user)
          @ipc.handle("get:project:paths", null, [])

    it "hides projects nav", ->
      cy.get(".navbar-default").should("not.exist")

  describe "selected project", ->
    beforeEach ->
      @firstProjectName = "My-Fake-Project"
      @lastProjectName = "project5"

      cy
        .fixture("user").then (@user) ->
          @ipc.handle("get:current:user", null, @user)
        .fixture("projects").then (@projects) ->
          @ipc.handle("get:project:paths", null, @projects)

      cy
        .contains("Projects").click()
        .get(".projects-list .dropdown-menu a")
          .contains(@firstProjectName).as("firstProject").click()

    context "project nav", ->
      it "displays projects nav", ->
        cy
          .get(".empty").should("not.be.visible")
          .get(".navbar-default")

      describe.skip "default page", ->
        it "displays 'tests' nav as active", ->
          cy
            .get(".navbar-default").contains("Tests")
              .should("have.class", "active")

        it "displays 'tests' page", ->
          cy
            .contains("Integration")

      describe.skip "builds page", ->
        beforeEach ->
          cy
            .get(".navbar-default")
              .contains("Builds").as("buildsNav").click()

        it "highlights builds on click", ->
          cy
            .get("@buildsNav")
              .should("have.class", "active")

        it "displays builds page", ->
          cy
            .contains("h4", "Builds")

      describe.skip "config page", ->
        beforeEach ->
          cy
            .get(".navbar-default")
              .contains("Config").as("configNav").click()

        it "highlights builds on click", ->
          cy
            .get("@configNav")
              .should("have.class", "active")

        it "displays builds page", ->
          cy
            .contains("h4", "Config")

    context "browsers dropdown", ->
      beforeEach ->
        @config = {
          clientUrl: "http://localhost:2020",
          clientUrlDisplay: "http://localhost:2020"
        }

        cy
          .fixture("browsers").then (@browsers) ->
            @config.browsers = @browsers
            @ipc.handle("open:project", null, @config)

      it "lists browsers", ->
        cy.get(".browsers-list")

      it.skip "displays default browser name in chosen", ->
        cy
          .get(".browsers-list>a").first()
            .should("contain", "Chrome")

      it "displays default browser icon in chosen", ->
        cy
          .get(".browsers-list>a").first()
            .find(".fa-chrome")

      it.skip "switch chosen browser", ->
        cy
          .get(".browsers-list>a").first().click()
          .root().contains("Canary").click()
          .get(".browsers-list>a").first()
            .should("contains", "Canary")

    context "server running status", ->
      it "displays as Running on project open", ->
        cy
          .get(".server-status>a").contains("Running")

      it.skip "displays Stopped on stop click", ->
        cy
          .get(".server-status").click()
          .find(".dropdown-menu").contains("Stop").click()
          .get(".server-status>a").contains("Stopped")

    context "switch project", ->
      beforeEach ->
        cy
          .contains(@firstProjectName).click()
          .get(".projects-list .dropdown-menu a")
            .contains(@lastProjectName).as("lastProject").click()

      it "displays projects nav", ->
        cy
          .get(".empty").should("not.be.visible")
          .get(".navbar-default")

      context "browsers dropdown", ->
        beforeEach ->
          @config = {
            clientUrl: "http://localhost:2020",
            clientUrlDisplay: "http://localhost:2020"
          }

          cy
            .fixture("browsers").then (@browsers) ->
              @config.browsers = @browsers
              @ipc.handle("close:project", null, {})
              @ipc.handle("open:project", null, @config)

        it "lists browsers", ->
          cy.get(".browsers-list")
