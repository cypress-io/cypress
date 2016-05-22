describe "Projects List", ->
  beforeEach ->
    cy
      .visit("/")
      .window().then (win) ->
        {@ipc, @App} = win

        @agents = cy.agents()

        @agents.spy(@App, "ipc")

        @ipc.handle("get:options", null, {})

  context "with a current user", ->
    describe "username in header", ->
      it "displays user name", ->
        cy
          .fixture("user").then (@user) ->
            @ipc.handle("get:current:user", null, @user)
            @ipc.handle("get:project:paths", null, [])
          .get("header a").should ($a) ->
            expect($a).to.contain(@user.name)

      it "displays email instead of name", ->
        cy
          .fixture("user").then (@user) ->
            @user.name = null

            @ipc.handle("get:current:user", null, @user)
            @ipc.handle("get:project:paths", null, [])
          .get("header a").should ($a) ->
            expect($a).to.contain(@user.email)

    describe "logout of user", ->
      beforeEach ->
        cy
          .fixture("user").then (@user) ->
            @ipc.handle("get:current:user", null, @user)
            @ipc.handle("get:project:paths", null, [])

      it "shows dropdown on click of user name", ->
        cy.contains("Jane Lane").click()
        cy.contains("Logout").should("be.visible")

      it.skip "triggers logout on click of logout", ->
        cy.contains("Jane Lane").click()
        cy.contains("a", "Logout").click().then ->
          expect(@App.ipc).to.be.calledWith("log:out")

      it.skip "displays login screen on logout", ->
        cy.contains("Jane Lane").click()
        cy.contains("a", "Logout").click()
        cy.contains(".btn", "Log In with GitHub")

    describe "no projects", ->
      beforeEach ->
        cy
          .fixture("user").then (@user) ->
            @ipc.handle("get:current:user", null, @user)
            @ipc.handle("get:project:paths", null, [])

      it "displays empty view when no projects", ->
        cy.get(".empty").contains("Add Project")

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
          .get("#projects-container>li").should("have.length", @projects.length)

      it "each project shows it's project path", ->
        cy
          .get("#projects-container>li").first()
            .should("contain", @projects[0])

      it "each project has it's folder name", ->
        cy.contains("h4", "My-Fake-Project")

      it "trigger 'open:project' on click of project", ->
        cy
          .get("#projects-container>li").first().click().should ->
            expect(@App.ipc).to.be.calledWith("open:project")

    describe "add project", ->
      beforeEach ->
        cy
          .fixture("user").then (@user) ->
            @ipc.handle("get:current:user", null, @user)
            @ipc.handle("get:project:paths", null, [])
          .get(".empty").contains("Add Project")

      it "add button has tooltip attrs", ->
        cy
          .get("header").find("[data-js='add-project']")
            .should("have.attr", "data-original-title")

      it "triggers ipc 'show:directory:dialog on header +", ->
        cy.get("header").find("[data-js='add-project']").click().then ->
          expect(@App.ipc).to.be.calledWith("show:directory:dialog")

      it "triggers ipc 'show:directory:dialog on empty view +", ->
        cy.get(".empty").find(".btn[data-js='add-project']").click().then ->
          expect(@App.ipc).to.be.calledWith("show:directory:dialog")

      describe "error thrown", ->
        beforeEach ->
          cy
            .get("header").find("[data-js='add-project']").click().then ->
              @ipc.handle("show:directory:dialog", {message: "something bad happened"}, null)

        it "displays error", ->
          cy
            .get(".error")
              .should("be.visible")
              .and("contain", "something bad happened")

        it "goes back to projects view on dismiss", ->
          cy
            .contains(".btn", "Dismiss").click().then ->
              @ipc.handle("get:project:paths", null, [])
            .get(".empty").should("be.visible")

      describe "directory dialog dismissed", ->
        beforeEach ->
          cy.get("header").find("[data-js='add-project']").click()

        it "does no action", ->
          @ipc.handle("show:directory:dialog", null, null)

          cy.get(".empty").should("exist").then ->
              expect(@App.ipc).to.not.be.calledWith("add:project")

      describe "directory chosen", ->
        beforeEach ->
          cy.get("header").find("[data-js='add-project']").click()

        it "triggers ipc 'add:project' with directory", ->
          @ipc.handle("show:directory:dialog", null, "/Users/Jane/Projects/My-Fake-Project")

          cy.get("#projects-container>li:not(.empty)").should("have.length", 1).then ->
            expect(@App.ipc).to.be.calledWith("add:project")

        it "displays project row with spinner", ->
          @ipc.handle("show:directory:dialog", null, "/Users/Jane/Projects/My-Fake-Project")

          cy.get(".project.loading").find(".fa-spin").should("be.visible")


    describe "remove project", ->
      beforeEach ->
        cy
          .fixture("user").then (@user) ->
            @ipc.handle("get:current:user", null, @user)
          .fixture("projects").then (@projects) ->
            @ipc.handle("get:project:paths", null, @projects)
          .get("#projects-container>li").first()
            .invoke("trigger", "contextmenu")

      it "displays 'remove' link on right click", ->
        cy
          .get("a").contains("Remove project").should("be.visible")

      it "triggers remove:project with path on right click", ->
        cy
          .get("a").contains("Remove project").click().then ->
            expect(@App.ipc).to.be.calledWith("remove:project", @projects[0])

      it "removes the project from the list", ->
        cy
          .get("#projects-container>li").should("have.length", @projects.length)
          .get("a").contains("Remove project").click()
          .get("#projects-container>li").should("have.length", @projects.length - 1)
