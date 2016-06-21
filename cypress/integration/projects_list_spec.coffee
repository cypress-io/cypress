describe "Projects List", ->
  beforeEach ->
    cy
      .visit("/#/projects")
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
      cy.get(".rc-tooltip").contains("Choose a folder to begin testing")

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

    describe "projects listed in dropdown", ->
      it "displays projects in list", ->
        cy
          .get(".empty").should("not.be.visible")
          .get(".projects-list")
            .should("have.length", @projects.length)

      it "each project shows it's project path", ->
        cy
          .get(".projects-list .dropdown-menu a").first()
            .should("contain", "/My-Fake-Project")

      it "each project has it's folder name", ->
        cy.get(".projects-list .dropdown-menu a")
          .contains("", " My-Fake-Project")

    it "opens projects dropdown by default", ->
      cy
        .get(".projects-list .dropdown-menu")
          .should("be.visible")

    it "displays message about choosing project", ->
      cy.get("h4").contains("Choose a Project")

    it "add project within list", ->
      cy
        .contains("Projects")
        .get(".add-project").click().then ->
          expect(@App.ipc).to.be.calledWith("show:directory:dialog")

    it.skip "add button displays tooltip on hover", ->
      cy
        .get("nav a").not(".add-project").find(".fa-plus").parent().invoke("hover")
        .get(".rc-tooltip").contains("Add Project").should("be.visible")

  describe "click on project", ->
    beforeEach ->
      @firstProjectName = "My-Fake-Project"
      @lastProjectName = "project5"

      cy
        .fixture("user").then (@user) ->
          @ipc.handle("get:current:user", null, @user)
        .fixture("projects").then (@projects) ->
          @ipc.handle("get:project:paths", null, @projects)
        .get(".projects-list .dropdown-menu a")
          .contains(@firstProjectName).as("firstProject")
        .get(".projects-list .dropdown-menu a")
          .contains(@lastProjectName).as("lastProject")

    it "displays project in dropdown on click", ->
      cy
        .get("@firstProject").click()
        .get(".projects-list>a").first()
          .should("contain", @firstProjectName)

    it "trigger 'open:project' on click of project", ->
      cy
        .get("@firstProject").click().should ->
          expect(@App.ipc).to.be.calledWith("open:project")

    it "doesn't trigger 'close:project' on first project select", ->
      cy
        .get("@firstProject").click().should ->
          expect(@App.ipc).to.not.be.calledWith("close:project")

    describe "switch project", ->
      beforeEach ->
        cy
          .get("@firstProject").click().should ->
            expect(@App.ipc).to.be.calledWith("open:project")
          .root().contains(@firstProjectName).click()

      it "displays new project in dropdown", ->
        cy
          .get("@lastProject").click().then ->
            @ipc.handle("close:project", null, {})
            @ipc.handle("open:project", null, {browsers: []})
          .get(".projects-list>a").first()
            .should("contain", @lastProjectName)

      it "closes previously chosen project", ->
        cy
          .get("@lastProject").click().should ->
            expect(@App.ipc).to.be.calledWith("close:project")
            expect(@App.ipc).to.be.calledWith("open:project")

      it "opens new project", ->
        cy
          .get("@lastProject").click().should ->
            expect(@App.ipc).to.be.calledWith("open:project")

  describe "add project", ->
    beforeEach ->
      cy
        .fixture("user").then (@user) ->
          @ipc.handle("get:current:user", null, @user)
          @ipc.handle("get:project:paths", null, [])
        .get(".empty")

    it "triggers ipc 'show:directory:dialog on nav +", ->
      cy.get("nav").find(".fa-plus").click().then ->
        expect(@App.ipc).to.be.calledWith("show:directory:dialog")

    it "closes dropdown", ->
      cy.get(".dropdown-menu").should("not.be.visible")

    describe "error thrown", ->
      beforeEach ->
        cy
          .get("nav").find(".fa-plus").click().then ->
            @ipc.handle("show:directory:dialog", {name: "error", message: "something bad happened"}, null)

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



