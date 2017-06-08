describe "Global Mode", ->
  beforeEach ->
    cy.fixture("user").as("user")
    cy.fixture("projects").as("projects")
    cy.fixture("projects_statuses").as("projectStatuses")
    cy.fixture("config").as("config")
    cy.fixture("specs").as("specs")

    cy.visit("/").then (win) ->
      { start, @ipc } = win.App

      cy.stub(@ipc, "getOptions").resolves({})
      cy.stub(@ipc, "updaterCheck").resolves(false)
      cy.stub(@ipc, "logOut").resolves({})
      cy.stub(@ipc, "addProject").resolves(null, @projects[0])
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

      start()

  describe "with a current user", ->
    beforeEach ->
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
      beforeEach ->
        @dropEvent = {
          dataTransfer: {
            files: [{path: "/foo/bar"}]
          }
        }

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

      it "adds project and opens it when dropped", ->
        cy.get(".project-drop").ttrigger("drop", @dropEvent)
        cy.shouldBeOnProjectSpecs()

    describe "selecting project", ->
      it "adds project and opens it when selected", ->
        cy.stub(@ipc, "showDirectoryDialog").resolves("/foo/bar")
        cy.get(".project-drop button").click().then =>
          expect(@ipc.showDirectoryDialog).to.be.called
          cy.shouldBeOnProjectSpecs()

      it "does nothing when user cancels", ->
        cy.stub(@ipc, "showDirectoryDialog").resolves()
        cy.get(".project-drop button").click()
        cy.shouldBeOnIntro()

    describe "recent projects", ->
      it "loads projects", ->
        cy.wrap({}).should =>
          expect(@ipc.getProjects).to.be.called

      it "shows loader when loading projects", ->
        cy.get(".projects-list .loader")

      describe "when loaded", ->
        beforeEach ->
          @getProjects.resolve(@projects)

        it "displays projects", ->
          cy.get(".projects-list li").should("have.length", @projects.length)

        it.only "displays project name and path", ->
          cy.get(".projects-list li:first .project-name").should("have.text", "My-Fake-Project")
          cy.get(".projects-list li:first .project-path").should("have.text", "/Users/Jane/Projects/My-Fake-Project")

        it "goes to project when clicked", ->
          cy.get(".projects-list a:first").click()
          cy.shouldBeOnProjectSpecs()

        describe "removing project", ->
          beforeEach ->
            cy.get(".projects-list li:first button").click()

          it "removes project from DOM", ->
            cy.get(".projects-list li").should("have.length", 4)
            cy.contains(@projects[0].path).should("not.exist")

          it "removes project through ipc", ->
            expect(@ipc.removeProject).to.be.calledWith(@projects[0].path)

          it "removes project from local storage", ->
            localStorageProjects = JSON.parse(localStorage.projects || "[]")
            expect(localStorageProjects.length).to.equal(4)
            expect(localStorageProjects[0].path).not.to.equal(@projects[0].path)

      describe "when there are none", ->
        beforeEach ->
          @getProjects.resolve([])

        it "shows nothing", ->
          cy.get(".projects-list").should("not.exist")

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

    describe.skip "if user becomes unauthenticated", ->
      beforeEach ->
        @unauthError = {name: "", message: "", statusCode: 401}

      it "redirects to login when get:projects returns 401", ->
        @getProjects.reject(@unauthError)
        cy.shouldBeOnLogin()

      it "redirects to login when get:project:statuses returns 401", ->
        @getProjects.resolve([])
        @getProjectStatuses.reject(@unauthError)
        cy.shouldBeOnLogin()

      it "redirects to login when get:project:status returns 401", ->
        cy.stub(@ipc, "showDirectoryDialog").resolves("/foo/bar")
        cy.stub(@ipc, "addProject").resolves({ id: "id-123" })
        cy.stub(@ipc, "getProjectStatus").rejects(@unauthError)

        @getProjects.resolve([])
        @getProjectStatuses.resolve([])

        cy.get("nav").find(".fa-plus").click().wait(1000)

        cy.shouldBeOnLogin()

  describe "without a current user", ->
    beforeEach ->
      @getCurrentUser.resolve(null)

    it "goes to login", ->
      cy.shouldBeOnLogin()
