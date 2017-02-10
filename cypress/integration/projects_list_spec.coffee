{deferred, stubIpc} = require("../support/util")

describe "Projects List", ->
  beforeEach ->
    cy
      .fixture("user").as("user")
      .fixture("projects").as("projects")
      .fixture("projects_statuses").as("projectStatuses")
      .fixture("config").as("config")
      .fixture("specs").as("specs")
      .visit("/#/projects")
      .window().then (win) ->
        {@App} = win
        cy.stub(@App, "ipc").as("ipc")

        @getCurrentUser = deferred()
        @getProjects = deferred()
        @getProjectStatuses = deferred()

        stubIpc(@App.ipc, {
          "on:menu:clicked": ->
          "close:browser": ->
          "close:project": ->
          "on:focus:tests": ->
          "updater:check": (stub) => stub.resolves(false)
          "get:options": (stub) => stub.resolves({})
          "get:current:user": (stub) => stub.returns(@getCurrentUser.promise)
          "get:projects": (stub) => stub.returns(@getProjects.promise)
          "get:project:statuses": (stub) => stub.returns(@getProjectStatuses.promise)
          "remove:project": (stub) -> stub.resolves()
          "open:project": (stub) => stub.yields(null, @config)
          "get:specs": (stub) => stub.resolves(@specs)
        })

        @App.start()

  context "with a current user", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)

    describe "no projects", ->
      beforeEach ->
        @getProjects.resolve([])
        @getProjectStatuses.resolve([])

      it "does not display projects list", ->
        cy.get("projects-list").should("not.exist")

      it "displays empty view when no projects", ->
        cy.get(".empty").contains("Add your first project")

      it "displays help link", ->
        cy.contains("a", "Need help?")

      it "opens link to docs on click of help link", ->
        cy.contains("a", "Need help?").click().then ->
          expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/guides/installing-and-running#section-adding-projects")

    describe "project statuses from localStorage load", ->
      beforeEach ->
        localStorage.setItem("projects", JSON.stringify(@projectStatuses))
        @getProjects.resolve(@projects)

      afterEach ->
        cy.clearLocalStorage()

      it "has status in projects list", ->
        cy
          .get(".projects-list>li").first()
          .contains("Passed")

    describe "lists projects", ->
      beforeEach ->
        @getProjects.resolve(@projects)

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
              expect(JSON.parse(localStorage.projects || "[]").length).to.equal(7)

      describe "project statuses in list", ->
        beforeEach ->
          @getProjectStatuses.resolve(@projectStatuses)

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
            .contains(@projectStatuses[0].orgName)

        it "displays status", ->
          cy
            .get(".projects-list>li").first()
            .contains("Passed")

        describe "returning from project", ->
          beforeEach ->
            cy
              .get(".projects-list a")
                .contains("My-Fake-Project").click()
              .end()
              .contains("Back to Projects").click()

          it "loads projects", ->
            ## in reality, both will get called 3 times, but since we don't
            ## handle the second call to get:projects, get:project:statuses
            ## only gets called 2 times in this test
            expect(@App.ipc.withArgs("get:projects")).to.be.calledThrice
            expect(@App.ipc.withArgs("get:project:statuses")).to.be.calledThrice

        describe "when user is unauthorized for project", ->

          it "displays unauthorized status", ->
            cy
              .get(".projects-list>li").last().prev()
              .contains("Unauthorized")

          it "opens runs tab when clicked", ->
            cy
              .get(".projects-list>li a").last().click()
              .location().its("hash")
                .should("include", "runs")

        describe "when project is invalid", ->

          it "displays invalid status", ->
            cy
              .get(".projects-list>li").last()
              .contains("Invalid")

          it "opens runs tab when clicked", ->
            cy
              .get(".projects-list>li a").last().click()
              .location().its("hash")
                .should("include", "runs")

    describe "polling projects", ->
      beforeEach ->
        @projects[0].path = "/new/path"
        @["get:projects"].onCall(2).resolves(@projects)

        @projectStatuses[0].lastBuildStatus = "failed"
        @["get:project:statuses"].onCall(2).resolves(@projectStatuses)

        cy
          .clock()
          .then =>
            @getProjects.resolve(@projects)
            @getProjectStatuses.resolve(@projectStatuses)
          .tick(10000)

      it "updates project paths and ids every 10 seconds", ->
        ## once by application on load
        ## once by projects-list on load
        ## once by polling
        expect(@["get:projects"]).to.be.calledThrice

        cy
          .get(".projects-list>li").first()
          .contains("/new/path")

      it "updates project statuses every 10 seconds", ->
        expect(@["get:project:statuses"]).to.be.calledThrice

        cy
          .get(".projects-list>li").first()
          .contains("Failed")

      it "redirects to login if api returns 401", ->
        cy
          .window().then (win) =>
            foo = deferred(win.Promise)
            # @["get:project:statuses"].onCall(3).rejects({name: "", message: "", statusCode: 401})
            @["get:project:statuses"].onCall(3).returns(foo.promise)
            foo.reject({name: "", message: "", statusCode: 401})
          .tick(10000)
          .location().its("hash")
            .should("contain", "login")

    describe "add project", ->
      beforeEach ->
        @selectDirectory = deferred()
        @addProject = deferred()

        stubIpc(@App.ipc, {
          "show:directory:dialog": (stub) => stub.returns(@selectDirectory.promise)
          "add:project": (stub) => stub.returns(@addProject.promise)
          "get:project:status": (stub) -> stub.resolves({
            id: "id-123"
            path: "/Users/Jane/Projects/My-New-Project"
            lastBuildStatus: "passed"
            public: true
          })
        })

        @getProjects.resolve(@projects)
        @getProjectStatuses.resolve(@projectStatuses)

        cy.get("nav").find(".fa-plus").click()

      describe "any case / no project id", ->
        it "triggers ipc 'show:directory:dialog on nav +", ->
          expect(@App.ipc).to.be.calledWith("show:directory:dialog")

        describe "error thrown", ->
          beforeEach ->
            @selectDirectory.reject({name: "error", message: "something bad happened"})

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
            @selectDirectory.resolve()

          it "does no action", ->
            cy.get(".projects-list").should("exist").then ->
                expect(@App.ipc).to.not.be.calledWith("add:project")

        describe "directory chosen", ->
          beforeEach ->
            @projectPath = "/Users/Jane/Projects/My-New-Project"
            @selectDirectory.resolve(@projectPath)
            cy.wait(1000)

          it "triggers ipc 'add:project' with directory", ->
            expect(@App.ipc).to.be.calledWith("add:project", @projectPath)

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
            expect(@App.ipc).not.to.be.calledWith("get:project:status")

      describe "with pre-existing project id", ->
        beforeEach ->
          @selectDirectory.resolve("/Users/Jane/Projects/My-New-Project")
          @addProject.resolve({
            id: "id-123"
            path: "/Users/Jane/Projects/My-New-Project"
          })
          cy.wait(1000)

        it "calls ipc 'get:project:status'", ->
          expect(@App.ipc).to.be.calledWith("get:project:status", {
            id: "id-123"
            path: "/Users/Jane/Projects/My-New-Project"
          })

        it "displays public label", ->
          cy
            .get(".projects-list>li").first()
            .contains("Public")

        it "displays status", ->
          cy
            .get(".projects-list>li").first()
            .contains("Passed")
