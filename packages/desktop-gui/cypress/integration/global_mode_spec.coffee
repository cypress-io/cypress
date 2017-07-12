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

    cy.visitIndex().then (win) ->
      { @start, @ipc } = win.App

      cy.stub(@ipc, "getOptions").resolves({})
      cy.stub(@ipc, "updaterCheck").resolves(false)
      cy.stub(@ipc, "logOut").resolves({})
      cy.stub(@ipc, "addProject").resolves(@projects[0])
      cy.stub(@ipc, "openProject").resolves(@config)
      cy.stub(@ipc, "getSpecs").yields(null, @specs)
      cy.stub(@ipc, "offOpenProject")
      cy.stub(@ipc, "offGetSpecs")
      cy.stub(@ipc, "offOnFocusTests")
      cy.stub(@ipc, "closeProject")
      cy.stub(@ipc, "externalOpen")

      @getProjects = @util.deferred()
      cy.stub(@ipc, "getProjects").returns(@getProjects.promise)

      @getProjectStatuses = @util.deferred()
      cy.stub(@ipc, "getProjectStatuses").returns(@getProjectStatuses.promise)

      @start()

  it "shows cypress logo in nav", ->
    cy.get(".nav .logo img").should("have.attr", "src", "img/cypress-inverse.png")

  it "shows message about using Cypress locally", ->
    cy.contains("Run this command")

  it "displays help link", ->
    cy.contains("a", "Need help?")

  it "opens link to docs on click of help link", ->
    cy.contains("a", "Need help?").click().then ->
      expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/adding-new-project")

  it "shows project drop area with button to select project", ->
    cy.get(".project-drop p:first").should("contain", "Drag your project here")
    cy.get(".project-drop a").should("have.text", "select manually")

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

    it "adds project and opens it when dropped", ->
      cy.get(".project-drop").ttrigger("drop", @dropEvent)
      cy.shouldBeOnProjectSpecs()

  describe "selecting project", ->
    it "adds project and opens it when selected", ->
      cy.stub(@ipc, "showDirectoryDialog").resolves("/foo/bar")
      cy.get(".project-drop a").click().then =>
        expect(@ipc.showDirectoryDialog).to.be.called
        cy.shouldBeOnProjectSpecs()

    it "updates local storage", ->
      cy.stub(@ipc, "showDirectoryDialog").resolves("/foo/bar")
      cy.get(".project-drop a").click().should =>
        expect(@getLocalStorageProjects()[0].id).to.equal(@projects[0].id)

    it "does nothing when user cancels", ->
      cy.stub(@ipc, "showDirectoryDialog").resolves()
      cy.get(".project-drop a").click()
      cy.shouldBeOnIntro()

  describe "going to project", ->
    beforeEach ->
      cy.get(".project-drop").ttrigger("drop", @dropEvent)

    it "displays Back button", ->
      cy.get('.left-nav a').invoke("text").should("include", "Back")

    it "sets title to project name", ->
        cy.title().should("equal", "bar")

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
