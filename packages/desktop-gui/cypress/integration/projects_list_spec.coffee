describe "Projects List", ->
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

    cy.visitIndex().then (win) ->
      { @start, @ipc } = win.App

      cy.stub(@ipc, "getOptions").resolves({})
      cy.stub(@ipc, "updaterCheck").resolves(false)
      cy.stub(@ipc, "getCurrentUser").resolves(@user)
      cy.stub(@ipc, "logOut").resolves({})
      cy.stub(@ipc, "addProject").resolves(@projects[0])
      cy.stub(@ipc, "openProject").resolves(@config)
      cy.stub(@ipc, "getSpecs").yields(null, @specs)
      cy.stub(@ipc, "removeProject")

      @getProjects = @util.deferred()
      cy.stub(@ipc, "getProjects").returns(@getProjects.promise)

      @getProjectStatuses = @util.deferred()
      cy.stub(@ipc, "getProjectStatuses").returns(@getProjectStatuses.promise)

  describe "general behavior", ->
    beforeEach ->
      @start()

    it "loads projects and shows loader", ->
      cy.get(".projects-list .loader")
      .should("have.text", "Loading projects...")
      .then =>
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

          ## ensures projects have loaded
          cy.get(".projects-list li").should("have.length", 5)

        it "updates local storage with projects", ->
          localStorageProjects = @getLocalStorageProjects()
          expect(localStorageProjects.length).to.equal(5)

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
        cy.get(".project-drop").trigger("drop", @dropEvent).should =>
          @assertOrder(["id-bar", "id-a", "id-b"])

      it "puts project at start when dropped and it already exists", ->
        @dropEvent.dataTransfer.files[0].path = "/project/b"
        cy.get(".project-drop").trigger("drop", @dropEvent).then =>
          @assertOrder(["id-b", "id-a"])

      it "puts project at start when selected", ->
        cy.stub(@ipc, "showDirectoryDialog").resolves("/foo/bar")
        cy.get(".project-drop a").click().then =>
          @assertOrder(["id-bar", "id-a", "id-b"])

      it "puts project at start when selected and it already exists", ->
        cy.stub(@ipc, "showDirectoryDialog").resolves("/project/b")
        cy.get(".project-drop a").click().then =>
          @assertOrder(["id-b", "id-a"])

      it "puts project at start when clicked on in list", ->
        cy.get(".projects-list a").eq(1).click().then =>
          @assertOrder(["id-b", "id-a"])

    describe "errors", ->
      beforeEach ->
        @getProjects.resolve(@projects)
        @error = {
          name: ""
          message: "Failed to get project statuses"
        }

      it "displays error above list", ->
        @getProjectStatuses.reject(@error)
        cy.get(".alert").should("contain", "Failed to get project statuses")
        cy.get(".projects-list li").should("have.length", @projects.length)

      it "does not display api errors", ->
        @error.isApiError = true
        @getProjectStatuses.reject(@error)
        cy.contains("Failed to get project statuses").should("not.exist")

  describe "if user becomes unauthenticated", ->
    beforeEach ->
      @unauthError = {name: "", message: "", statusCode: 401}
      ## error is being caught here for some reason, so nullify it
      window.onunhandledrejection = ->

      @start()

    afterEach ->
      window.onunhandledrejection = undefined

    it "logs user out when get:projects returns 401", ->
      @getProjects.reject(@unauthError)
      cy.shouldBeLoggedOut()

    it "logs user out when get:project:statuses returns 401", ->
      @getProjects.resolve([])
      @getProjectStatuses.reject(@unauthError)
      cy.shouldBeLoggedOut()

  describe "when there are projects in local storage that no longer exist", ->
    beforeEach ->
      localStorageProjects = @util.deepClone(@projects)
      localStorageProjects[0].path = "has/been/moved"
      @setLocalStorageProjects(localStorageProjects)

      @projects.shift()
      @getProjects.resolve(@projects)

      @start()

    it "does not display them", ->
      cy.get(".project-name:first").should("have.text", "My-Other-Fake-Project")
