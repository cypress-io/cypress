describe "Project", ->
  beforeEach ->
    cy.fixture("user").as("user")
    cy.fixture("config").as("config")
    cy.fixture("specs").as("specs")
    cy.fixture("projects_statuses").as("projectStatuses")

    cy.visitIndex().then (win) =>
      { @start, @ipc } = win.App

      cy.stub(@ipc, "getOptions").resolves({projectRoot: "/foo/bar"})
      cy.stub(@ipc, "getCurrentUser").resolves(@user)
      cy.stub(@ipc, "openProject").resolves(@config)
      cy.stub(@ipc, "getSpecs").yields(null, @specs)
      cy.stub(@ipc, "closeProject").resolves()
      cy.stub(@ipc, "onConfigChanged")

      @getProjectStatus = @util.deferred()
      cy.stub(@ipc, "getProjectStatus").returns(@getProjectStatus.promise)

      @updaterCheck = @util.deferred()
      cy.stub(@ipc, "updaterCheck").resolves(@updaterCheck.promise)

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

    it "logs out user when getting project status returns 401", ->
      cy.shouldBeOnProjectSpecs().then =>
        @getProjectStatus.reject({name: "", message: "", statusCode: 401})
      cy.shouldBeLoggedOut()

    it "re-opens project if config changes", ->
      cy.shouldBeOnProjectSpecs().then =>
        @ipc.onConfigChanged.yield()
        expect(@ipc.closeProject).to.be.called
        expect(@ipc.openProject).to.be.called
        cy.shouldBeOnProjectSpecs()

  describe "polling", ->
    beforeEach ->
      @ipc.getProjectStatus.resolves(@projectStatuses[0])
      cy.clock().then =>
        @start()

    it "gets project status every 10 seconds", ->
      cy.tick(10000).then =>
        expect(@ipc.getProjectStatus).to.be.calledTwice
