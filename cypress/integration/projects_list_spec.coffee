describe "Projects List", ->
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

    it "hides projects dropdown", ->
      cy.get("projects-list").should("not.exist")

    it "opens tooltip on add button", ->
      cy.get(".rc-tooltip").contains("Add")

    it "displays empty view when no projects", ->
      cy.get(".empty").contains("Add your first project")

    it "displays help link", ->
      cy.contains("a", "Need help?")

    it "opens link to docs on click of help link", ->
      cy.contains("a", "Need help?").click().then ->
        expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/guides/installing-and-running/#section-adding-projects")

  describe "lists projects", ->
    beforeEach ->
      cy
        .fixture("user").then (@user) ->
          @ipc.handle("get:current:user", null, @user)
        .fixture("projects").then (@projects) ->
          @ipc.handle("get:project:paths", null, @projects)

    it "displays projects in list", ->
      cy
        .get(".empty").should("not.be.visible")
        .get(".projects-list .dropdown-menu a:not(.add-project)").should("have.length", @projects.length)

    it "each project shows it's project path", ->
      cy
        .get(".projects-list .dropdown-menu a").first()
          .should("contain", "/My-Fake-Project")

    it "each project has it's folder name", ->
      cy.get(".projects-list .dropdown-menu a")
        .contains("", " My-Fake-Project")

    it "trigger 'open:project' on click of project", ->
      cy
        .contains("Projects").click()
        .get(".projects-list .dropdown-menu a").first().click().should ->
          expect(@App.ipc).to.be.calledWith("open:project")

    it "add project within list", ->

  describe "add project", ->
    beforeEach ->
      cy
        .fixture("user").then (@user) ->
          @ipc.handle("get:current:user", null, @user)
          @ipc.handle("get:project:paths", null, [])
        .get(".empty")

    it.skip "add button displays tooltip on hover", ->
      cy
        .get("nav").find(".fa-plus")
          .should("have.attr", "data-original-title")

    it "triggers ipc 'show:directory:dialog on nav +", ->
      cy.get("nav").find(".fa-plus").click().then ->
        expect(@App.ipc).to.be.calledWith("show:directory:dialog")

    describe "error thrown", ->
      beforeEach ->
        cy
          .get("nav").find(".fa-plus").click().then ->
            @ipc.handle("show:directory:dialog", {message: "something bad happened"}, null)

      it "displays error", ->
        cy
          .get(".error")
            .should("be.visible")
            .and("contain", "something bad happened")

    describe "directory dialog dismissed", ->
      beforeEach ->
        cy.get("nav").find(".fa-plus").click()

      it "does no action", ->
        @ipc.handle("show:directory:dialog", null, null)

        cy.get(".empty").should("exist").then ->
            expect(@App.ipc).to.not.be.calledWith("add:project")

    describe "directory chosen", ->
      beforeEach ->
        cy.get("nav").find(".fa-plus").click()

      it "triggers ipc 'add:project' with directory", ->
        cy
          .then ->
            @ipc.handle("show:directory:dialog", null, "/Users/Jane/Projects/My-Fake-Project")
          .then ->
            expect(@App.ipc).to.be.calledWith("add:project")

      it "displays new project as chosen in dropdown", ->
        cy
          .then ->
            @ipc.handle("show:directory:dialog", null, "/Users/Jane/Projects/My-Fake-Project")
          .then ->
            expect(@App.ipc).to.be.calledWith("add:project")
          .get(".projects-list a:first").should("contain", "My-Fake-Project")

      it "no longer shows empty projects view", ->
        cy
          .then ->
            @ipc.handle("show:directory:dialog", null, "/Users/Jane/Projects/My-Fake-Project")
          .then ->
            expect(@App.ipc).to.be.calledWith("add:project")
          .get(".empty").should("not.exist")

      it.skip "displays project loading with spinner", ->
        @ipc.handle("show:directory:dialog", null, "/Users/Jane/Projects/My-Fake-Project")

        cy.get(".project.loading").find(".fa-spin").should("be.visible")
