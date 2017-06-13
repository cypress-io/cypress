describe "Global Mode", ->
  beforeEach ->
    cy.fixture("user").as("user")
    cy.fixture("projects").as("projects")
    cy.fixture("projects_statuses").as("projectStatuses")
    cy.fixture("config").as("config")
    cy.fixture("specs").as("specs")

    @dropEvent = {
      dataTransfer: {
        files: [{path: "/foo/bar"}]
      }
    }

    @getLocalStorageProjects = ->
      JSON.parse(localStorage.projects || "[]")

    @setLocalStorageProjects = (projects) ->
      localStorage.projects = JSON.stringify(projects)

    cy.visit("/").then (win) ->
      { @start, @ipc } = win.App

      cy.stub(@ipc, "getOptions").resolves({})
      cy.stub(@ipc, "updaterCheck").resolves(false)
      cy.stub(@ipc, "logOut").resolves({})
      cy.stub(@ipc, "addProject").resolves(@projects[0])
      cy.stub(@ipc, "openProject").yields(null, @config)
      cy.stub(@ipc, "getSpecs").yields(null, @specs)
      cy.stub(@ipc, "offOpenProject")
      cy.stub(@ipc, "offGetSpecs")
      cy.stub(@ipc, "offOnFocusTests")
      cy.stub(@ipc, "closeProject")
      cy.stub(@ipc, "removeProject")
      cy.stub(@ipc, "externalOpen")

      @getCurrentUser = @util.deferred()
      cy.stub(@ipc, "getCurrentUser").returns(@getCurrentUser.promise)

      @getProjects = @util.deferred()
      cy.stub(@ipc, "getProjects").returns(@getProjects.promise)

      @getProjectStatus = @util.deferred()
      cy.stub(@ipc, "getProjectStatus").returns(@getProjectStatus.promise)

      @getProjectStatuses = @util.deferred()
      cy.stub(@ipc, "getProjectStatuses").returns(@getProjectStatuses.promise)

  describe "with a current user", ->
    beforeEach ->
      @start()
      @getCurrentUser.resolve(@user)

    it "shows cypress logo in nav", ->
      cy.get(".nav .logo img").should("have.attr", "src", "img/cypress-inverse.png")

    it "shows message about using Cypress locally", ->
      cy.contains("Verbiage about local Cypress usage")

    it "displays help link", ->
      cy.contains("a", "Need help?")

    it "opens link to docs on click of help link", ->
      cy.contains("a", "Need help?").click().then ->
        expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/adding-new-project")

    it "shows project drop area with button to select project", ->
      cy.get(".project-drop p:first").should("have.text", "Drag your project here")
      cy.get(".project-drop button").should("have.text", "Select Project")

    describe "dragging and dropping project", ->
      it "highlights/unhighlights drop area when dragging over it/leaving it", ->
        cy
          .get(".project-drop")
            .ttrigger("dragover")
              .should("have.class", "is-dragging-over")
            .ttrigger("dragleave")
              .should("not.have.class", "is-dragging-over")

      it "unhighlights drop area when dropping a project on it", ->
        cy
          .get(".project-drop")
            .ttrigger("dragover")
              .should("have.class", "is-dragging-over")
            .ttrigger("drop", @dropEvent)
              .should("not.have.class", "is-dragging-over")

      it "gets project status when dropped", ->
        cy.get(".project-drop").ttrigger("drop", @dropEvent).then =>
          expect(@ipc.getProjectStatus).to.be.calledWith({id: @projects[0].id, path: "/foo/bar"})

      it "adds project and opens it when dropped", ->
        cy.get(".project-drop").ttrigger("drop", @dropEvent)
        cy.shouldBeOnProjectSpecs()

    describe "selecting project", ->
      it "adds project and opens it when selected", ->
        cy.stub(@ipc, "showDirectoryDialog").resolves("/foo/bar")
        cy.get(".project-drop button").click().then =>
          expect(@ipc.showDirectoryDialog).to.be.called
          cy.shouldBeOnProjectSpecs()

      it "updates local storage", ->
        cy.stub(@ipc, "showDirectoryDialog").resolves("/foo/bar")
        cy.get(".project-drop button").click().should =>
          expect(@getLocalStorageProjects()[0].id).to.equal(@projects[0].id)

      it "does nothing when user cancels", ->
        cy.stub(@ipc, "showDirectoryDialog").resolves()
        cy.get(".project-drop button").click()
        cy.shouldBeOnIntro()

    describe "recent projects", ->
      it "loads projects and shows loader", ->
        cy.get(".projects-list .loader").then =>
          expect(@ipc.getProjects).to.be.called

      describe "when loaded", ->
        beforeEach ->
          @getProjects.resolve(@projects)

        it "displays projects", ->
          cy.get(".projects-list li").should("have.length", @projects.length)

        it "displays project name and path", ->
          cy.get(".projects-list li:first .project-name").should("have.text", "My-Fake-Project")
          cy.get(".projects-list li:first .project-path").should("have.text", "/Users/Jane/Projects/My-Fake-Project")

        it "goes to project when clicked", ->
          cy.get(".projects-list a:first").click()
          cy.shouldBeOnProjectSpecs()

        it "gets project statuses", ->
          cy.get(".projects-list li").then => ## ensures projects have loaded
            expect(@ipc.getProjectStatuses).to.be.called

        describe "when project statuses have loaded", ->
          beforeEach ->
            @getProjectStatuses.resolve(@projectStatuses)
            cy.get(".projects-list li") ## ensures projects have loaded

          it "updates local storage with project statuses", ->
            localStorageProjects = @getLocalStorageProjects()
            expect(localStorageProjects.length).to.equal(5)
            expect(localStorageProjects[0].orgId).to.equal(@projectStatuses[0].orgId)

          it "updates project names", ->
            cy.get(".projects-list li .project-name").eq(3).should("have.text", "Client Work")

        describe "removing project", ->
          beforeEach ->
            cy.get(".projects-list li:first button").click()

          it "removes project from DOM", ->
            cy.get(".projects-list li").should("have.length", 4)
            cy.contains(@projects[0].path).should("not.exist")

          it "removes project through ipc", ->
            expect(@ipc.removeProject).to.be.calledWith(@projects[0].path)

          it "removes project from local storage", ->
            localStorageProjects = @getLocalStorageProjects()
            expect(localStorageProjects.length).to.equal(4)
            expect(localStorageProjects[0].path).not.to.equal(@projects[0].path)

      describe "when projects statuses are cached in local storage", ->
        beforeEach ->
          @setLocalStorageProjects([
            {id: @projectStatuses[0].id, name: "Cached name", path: @projects[0].path}
          ])
          @getProjects.resolve(@projects)

        it "displays cached name", ->
          cy.get(".project-name:first").should("have.text", "Cached name")

        it "updates name displayed and in local storage when project statuses load", ->
          @getProjectStatuses.resolve(@projectStatuses)
          cy
            .get(".project-name:first")
            .should("have.text", @projectStatuses[0].name)
            .then =>
              localStorageProjects = @getLocalStorageProjects()
              expect(localStorageProjects[0].name).to.equal(@projectStatuses[0].name)

      describe "when there are none", ->
        beforeEach ->
          @getProjects.resolve([])

        it "shows nothing", ->
          cy.get(".projects-list").should("not.exist")

      describe "order", ->
        beforeEach ->
          @aCoupleProjects = [
            {id: "id-a", path: "/project/a"},
            {id: "id-b", path: "/project/b"},
          ]
          @ipc.addProject.withArgs("/project/b").resolves({id: "id-b", path: "/project/b"})
          @ipc.addProject.withArgs("/foo/bar").resolves({id: "id-bar", path: "/foo/bar"})

          @assertOrder = (expected) =>
            actual = @getLocalStorageProjects().map (project) -> project.id
            expect(actual).to.eql(expected)

          @getProjects.resolve(@aCoupleProjects)

        it "puts project at start when dropped", ->
          cy.get(".project-drop").ttrigger("drop", @dropEvent).should =>
            @assertOrder(["id-bar", "id-a", "id-b"])

        it "puts project at start when dropped and it already exists", ->
          @dropEvent.dataTransfer.files[0].path = "/project/b"
          cy.get(".project-drop").ttrigger("drop", @dropEvent).then =>
            @assertOrder(["id-b", "id-a"])

        it "puts project at start when selected", ->
          cy.stub(@ipc, "showDirectoryDialog").resolves("/foo/bar")
          cy.get(".project-drop button").click().then =>
            @assertOrder(["id-bar", "id-a", "id-b"])

        it "puts project at start when selected and it already exists", ->
          cy.stub(@ipc, "showDirectoryDialog").resolves("/project/b")
          cy.get(".project-drop button").click().then =>
            @assertOrder(["id-b", "id-a"])

        it "puts project at start when clicked on in list", ->
          cy.get(".projects-list a").eq(1).click().then =>
            @assertOrder(["id-b", "id-a"])

      describe "limit", ->
        beforeEach ->
          @getProjects.resolve(@projects)

        it "limits to 5 when dropped", ->
          cy.get(".project-drop").ttrigger("drop", @dropEvent).then =>
            expect(@getLocalStorageProjects().length).to.equal(5)

        it "limits to 5 when selected", ->
          cy.stub(@ipc, "showDirectoryDialog").resolves("/foo/bar")
          cy.get(".project-drop button").click().then =>
            expect(@getLocalStorageProjects().length).to.equal(5)

    describe "going to project", ->
      beforeEach ->
        @getProjects.resolve(@projects)
        cy.get(".projects-list a:first").click()

      it "displays Back button", ->
        cy.get('.left-nav a').invoke("text").should("include", "Back")

      it "sets title to project name", ->
          cy.title().should("equal", "My-Fake-Project")

      describe "going back", ->
        beforeEach ->
          cy.contains("Back").click()

        it "returns to intro on click of back button", ->
          cy.shouldBeOnIntro()

        it "removes project name from title", ->
          cy.title().should("equal", "Cypress")

        it "removes ipc listeners", ->
          expect(@ipc.offOpenProject).to.be.called
          expect(@ipc.offGetSpecs).to.be.called
          expect(@ipc.offOnFocusTests).to.be.called

        it "closes project", ->
          expect(@ipc.closeProject).to.be.called

    describe "if user becomes unauthenticated", ->
      beforeEach ->
        @unauthError = {name: "", message: "", statusCode: 401}
        ## error is being caught here for some reason, so nullify it
        window.onunhandledrejection = ->

      afterEach ->
        window.onunhandledrejection = undefined

      it "redirects to login when get:projects returns 401", ->
        @getProjects.reject(@unauthError)
        cy.shouldBeOnLogin()

      it "redirects to login when get:project:statuses returns 401", ->
        @getProjects.resolve([])
        @getProjectStatuses.reject(@unauthError)
        cy.shouldBeOnLogin()

      it "redirects to login when get:project:status returns 401", ->
        @ipc.getProjectStatus.rejects(@unauthError)
        cy.get(".project-drop").ttrigger("drop", @dropEvent)
        cy.shouldBeOnLogin()

  describe "when there are projects in local storage that no longer exist", ->
    beforeEach ->
      localStorageProjects = @util.deepClone(@projects)
      localStorageProjects[0].path = "has/been/moved"
      @setLocalStorageProjects(localStorageProjects)

      @getCurrentUser.resolve(@user)
      @projects.shift()
      @getProjects.resolve(@projects)

      @start()

    it "does not display them", ->
      cy.get(".project-name:first").should("have.text", "My-Other-Fake-Project")

  describe "without a current user", ->
    beforeEach ->
      @start()
      @getCurrentUser.resolve(null)

    it "goes to login", ->
      cy.shouldBeOnLogin()
