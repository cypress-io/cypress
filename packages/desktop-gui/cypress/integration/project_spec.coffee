describe "Project Mode", ->
  beforeEach ->
    cy.fixture("user").as("user")
    cy.fixture("config").as("config")
    cy.fixture("specs").as("specs")
    cy.fixture("projects_statuses").as("projectStatuses")

    cy.visit("/").then (win) =>
      { @start, @ipc } = win.App

      cy.stub(@ipc, "onMenuClicked")
      cy.stub(@ipc, "onFocusTests")
      cy.stub(@ipc, "getOptions").resolves({projectPath: "/foo/bar"})
      cy.stub(@ipc, "getCurrentUser").resolves(@user)
      cy.stub(@ipc, "updaterCheck").resolves(false)
      cy.stub(@ipc, "openProject").yields(null, @config)
      cy.stub(@ipc, "getSpecs").yields(null, @specs)

      @getProjectStatus = @util.deferred()
      cy.stub(@ipc, "getProjectStatus").returns(@getProjectStatus.promise)

  describe "general behavior", ->
    beforeEach ->
      @start()

    it "shows project specs", ->
      cy.shouldBeOnProjectSpecs()

    it "opens project", ->
      cy.shouldBeOnProjectSpecs().then =>
        expect(@ipc.openProject).to.be.calledWith("/foo/bar")

    it "gets project status", ->
      cy.shouldBeOnProjectSpecs().then =>
        expect(@ipc.getProjectStatus).to.be.calledWith({id: @config.projectId, path: "/foo/bar"})

    it "redirects to login when getting project status returns 401", ->
      cy.shouldBeOnProjectSpecs().then =>
        @getProjectStatus.reject({name: "", message: "", statusCode: 401})
        cy.shouldBeOnLogin()

  describe "polling", ->
    beforeEach ->
      @ipc.getProjectStatus.resolves(@projectStatuses[0])
      cy.clock().then =>
        @start()

    it "gets project status every 10 seconds", ->
      cy.tick(10000).then =>
        expect(@ipc.getProjectStatus).to.be.calledTwice
