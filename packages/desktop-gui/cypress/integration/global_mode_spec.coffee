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

    @setup = (win) =>
      { @start, @ipc } = win.App

      cy.stub(@ipc, "getOptions").resolves({})
      cy.stub(@ipc, "getCurrentUser").resolves(@user)
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

    cy.visitIndex().then(@setup)

  it "shows cypress logo in nav", ->
    cy.get(".nav .logo img").should("have.attr", "src", "./img/cypress-inverse.png")

  it "shows notice about using Cypress locally", ->
    cy.contains("versioning Cypress per project")

  it "opens link to docs on click 'installing...'", ->
    cy.contains("a", "installing it via").click().then ->
      expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/installing-via-npm")

  it "dismisses notice when close is clicked", ->
    cy.get(".local-install-notice .close").click()
    cy.get(".local-install-notice").should("not.exist")

  it "stores the dismissal state in local storage", ->
    cy.get(".local-install-notice .close").click().then ->
      expect(localStorage["local-install-notice-dimissed"]).to.equal("true")

  it "does not show notice when dismissed state stored in local storage", ->
    cy.get(".local-install-notice .close").click()
    cy.reload().then(@setup)
    cy.contains("To get started...")
    cy.get(".local-install-notice").should("not.exist")

  it "shows project drop area with button to select project", ->
    cy.get(".project-drop p:first").should("contain", "Drag your project here")
    cy.get(".project-drop a").should("have.text", "select manually")

  describe "dragging and dropping project", ->
    it "highlights/unhighlights drop area when dragging over it/leaving it", ->
      cy
        .get(".project-drop")
          .trigger("dragover")
            .should("have.class", "is-dragging-over")
          .trigger("dragleave")
            .should("not.have.class", "is-dragging-over")

    it "handles drops of non-files gracefully", (done) ->
      cy.window().then (win) ->
        win.onerror = (message) ->
          done("Should not cause error but threw: #{message}")
      ## user could drag and drop a link or text, not a file
      @dropEvent.dataTransfer.files = []
      cy.get(".project-drop").trigger("drop", @dropEvent)
      cy.wait(300).then ->
        done()

    it "unhighlights drop area when dropping a project on it", ->
      cy
        .get(".project-drop")
          .trigger("dragover")
            .should("have.class", "is-dragging-over")
          .trigger("drop", @dropEvent)
            .should("not.have.class", "is-dragging-over")


    it "adds project and opens it when dropped", ->
      cy.get(".project-drop").trigger("drop", @dropEvent)
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
      cy.get(".project-drop").trigger("drop", @dropEvent)

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
