describe "Projects List", ->
  beforeEach ->
    cy
      .visit("/#/projects")
      .window().then (win) ->
        {@ipc, @App} = win

        @agents = cy.agents()
        @agents.spy(@App, "ipc")

        @ipc.handle("get:options", null, {})

  context "with a current user", ->
    beforeEach ->
      cy
        .fixture("user").then (@user) ->
          @ipc.handle("get:current:user", null, @user)

    describe "no projects", ->
      beforeEach ->
        cy.then ->
          @ipc.handle("get:projects", null, [])

      it "does not display projects list", ->
        cy.get("projects-list").should("not.exist")

      it "displays empty view when no projects", ->
        cy.get(".empty").contains("Add your first project")

      it "displays help link", ->
        cy.contains("a", "Need help?")

      it "opens link to docs on click of help link", ->
        cy.contains("a", "Need help?").click().then ->
          expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/guides/installing-and-running/#section-adding-projects")

    describe "project statuses from localStorage load", ->
      beforeEach ->
        cy
          .fixture("projects_statuses").then (@projects_statuses) ->
            localStorage.setItem("projects", JSON.stringify(@projects_statuses))
          .fixture("projects").then (@projects) ->
            @ipc.handle("get:projects", null, @projects)

      afterEach ->
        cy.clearLocalStorage()

      it "has status in projects list", ->
        cy
          .get(".projects-list>li").first()
          .contains("Passed")

    describe "lists projects", ->
      beforeEach ->
        cy
          .fixture("projects").then (@projects) ->
            @ipc.handle("get:projects", null, @projects)

      describe "projects listed", ->
        it "displays projects in list", ->
          cy
            .get(".empty").should("not.be.visible")
            .get(".projects-list>li")
              .should("have.length", @projects.length)

        it "project shows it's project path", ->
          cy
            .get(".projects-list a").first()
              .should("contain", "/My-Fake-Project")

        it "project has it's folder name", ->
          cy.get(".projects-list a")
            .contains("", " My-Fake-Project")

        it "project displays chevron icon", ->
          cy
            .get(".projects-list a").first()
              .find(".fa-chevron-right")

        context "click on project", ->
          beforeEach ->
            @firstProjectName = "My-Fake-Project"

            cy
              .get(".projects-list a")
                .contains(@firstProjectName).as("firstProject")

          it "navigates to project page", ->
            cy.get("@firstProject").click()
            cy.contains("Back to Projects")

        context "right click on project", ->
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
            cy.get(".react-context-menu").should("be.visible")

          describe "clicking remove", ->
            beforeEach ->
              cy
                .get(".react-context-menu:visible")
                  .contains("Remove project").click()

            it "removes project", ->
              cy.get("@firstProject").should("not.exist")

            it "calls remove:project to ipc", ->
              expect(@App.ipc).to.be.calledWith("remove:project", "/Users/Jane/Projects/My-Fake-Project")

            it "updates localStorage cache", ->
              @ipc.handle("remove:project").then ->
                expect(JSON.parse(localStorage.projects || "[]").length).to.equal(7)

      describe "project statuses in list", ->
        beforeEach ->
          cy
            .fixture("projects_statuses").then (@projects_statuses) =>
              @ipc.handle("get:project:statuses", null, @projects_statuses)

        it "displays projects in list", ->
          cy
            .get(".empty").should("not.be.visible")
            .get(".projects-list>li")
              .should("have.length", @projects.length)

        it "displays public label", ->
          cy
            .get(".projects-list>li").first()
            .contains("Public")

        it.skip "displays owner", ->
          cy
            .get(".projects-list>li").first()
            .contains(@projects_statuses[0].orgName)

        it "displays status", ->
          cy
            .get(".projects-list>li").first()
            .contains("Passed")

        it "displays invalid status if invalid", ->
          cy
            .get(".projects-list>li").last()
            .contains("Invalid")

    describe "polling project statuses", ->
      beforeEach ->
        cy
          .window().then (win) =>
            @clock = win.sinon.useFakeTimers()
          .fixture("projects").then (@projects) ->
            @ipc.handle("get:projects", null, @projects)
            @clock.tick(1000)
          .fixture("projects_statuses").then (@projects_statuses) ->
            @ipc.handle("get:project:statuses", null, @projects_statuses)
            @clock.tick(1000)

      afterEach ->
        @clock.restore()

      it "updates project paths and ids every 5 seconds", ->
        @clock.tick(5000)
        expect(@App.ipc.withArgs("get:projects")).to.be.calledTwice

        @projects[0].path = "/new/path"
        @ipc.handle("get:projects", null, @projects)

        cy
          .get(".projects-list>li").first()
          .contains("/new/path")

      it "updates project statuses every 5 seconds", ->
        @clock.tick(5000)
        @ipc.handle("get:projects", null, @projects).then =>
          expect(@App.ipc.withArgs("get:project:statuses")).to.be.calledTwice

          @projects_statuses[0].lastBuildStatus = "failed"
          @ipc.handle("get:project:statuses", null, @projects_statuses)

          cy
            .get(".projects-list>li").first()
            .contains("Failed")

    describe "add project", ->
      beforeEach ->
        cy
          .fixture("projects").then (@projects) ->
            @ipc.handle("get:projects", null, @projects)

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

        it "hides error on dismiss click", ->
          cy
            .get(".error")
              .should("be.visible")
              .find(".close").click({force: true})
            .get(".error")
              .should("not.be.visible")

      describe "directory dialog dismissed", ->
        beforeEach ->
          cy.get("nav").find(".fa-plus").click()

        it "does no action", ->
          @ipc.handle("show:directory:dialog", null, null)

          cy.get(".projects-list").should("exist").then ->
              expect(@App.ipc).to.not.be.calledWith("add:project")

      describe "directory chosen", ->
        beforeEach ->
          cy
            .get("nav").find(".fa-plus").click()
            .then ->
              @ipc.handle("show:directory:dialog", null, "/Users/Jane/Projects/My-New-Project")

        it "triggers ipc 'add:project' with directory", ->
          expect(@App.ipc).to.be.calledWith("add:project")

        it "displays new project in list", ->
          cy.get(".projects-list a:last").should("contain", "My-New-Project")

        it "no longer shows empty projects view", ->
          cy.get(".empty").should("not.exist")

        it "disables clicking onto project while loading", ->
          cy.get(".project.loading").should("have.css", "pointer-events", "none")

        it "displays project loading icon", ->
          cy
            .get(".project.loading").find(".fa")
            .should("have.class", "fa-spinner")

        it "updates localStorage cache", ->
          expect(JSON.parse(localStorage.projects || "[]").length).to.equal(9)

        it "does not call ipc 'get:project:status'", ->
          cy.wait(1000).then =>
            expect(@App.ipc).not.to.be.calledWith("get:project:status")

    describe "add project that has id", ->
      beforeEach ->
        @ipc.handle("get:projects", null, [])

        cy.get("nav").find(".fa-plus").click()
        .then ->
          @ipc.handle("show:directory:dialog", null, "/Users/Jane/Projects/My-New-Project")
        .then ->
          @ipc.handle("add:project", null, {
            id: "id-123"
            path: "/Users/Jane/Projects/My-New-Project"
          })
        .wait(1000)

      it "calls ipc 'get:project:status'", ->
        expect(@App.ipc).to.be.calledWith("get:project:status", {
          id: "id-123"
          path: "/Users/Jane/Projects/My-New-Project"
        })

      describe "when 'get:project:status' returns project details", ->
        beforeEach ->
          @ipc.handle("get:project:status", null, {
            id: "id-123"
            path: "/Users/Jane/Projects/My-New-Project"
            lastBuildStatus: "passed"
            public: true
          })

        it "displays public label", ->
          cy
            .get(".projects-list>li").first()
            .contains("Public")

        it "displays status", ->
          cy
            .get(".projects-list>li").first()
            .contains("Passed")
