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

    describe "projects listed", ->
      it "displays projects in list", ->
        cy
          .get(".empty").should("not.be.visible")
          .get(".projects-list>li")
            .should("have.length", @projects.length)

      it "each project shows it's project path", ->
        cy
          .get(".projects-list a").first()
            .should("contain", "/My-Fake-Project")

      it "each project has it's folder name", ->
        cy.get(".projects-list a")
          .contains("", " My-Fake-Project")

      describe "click on project", ->
        beforeEach ->
          @firstProjectName = "My-Fake-Project"

          cy
            .get(".projects-list a")
              .contains(@firstProjectName).as("firstProject")

        it "navigates to project page", ->
          cy
            .get("@firstProject").click()
            .location().its("hash").should("include", "123")

      describe "right click on project", ->
        beforeEach ->
          @firstProjectName = "My-Fake-Project"
          e = new Event('contextmenu', {bubbles: true, cancelable: true})
          e.clientX = 451
          e.clientY = 68

          cy
            .get(".projects-list li")
              .contains(".react-context-menu-wrapper", @firstProjectName).as("firstProject")
            .get("@firstProject").then ($el) ->
              $el[0].dispatchEvent(e)

        it "displays 'remove project' dropdown", ->
          cy
            .get(".react-context-menu").should("be.visible")

        it.only "removes project on click of remove project", ->
          cy
            .get(".react-context-menu:visible")
              .contains("Remove project").click({force: true})


  describe "add project", ->
    beforeEach ->
      cy
        .fixture("user").then (@user) ->
          @ipc.handle("get:current:user", null, @user)
        .fixture("projects").then (@projects) ->
          @ipc.handle("get:project:paths", null, @projects)

    it "triggers ipc 'show:directory:dialog on nav +", ->
      cy.get("nav").find(".fa-plus").click().then ->
        expect(@App.ipc).to.be.calledWith("show:directory:dialog")

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

        cy.get(".projects-list").should("exist").then ->
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



