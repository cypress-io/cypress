describe "Local Mode", ->
  beforeEach ->
    cy.fixture("user").as("user")
    cy.fixture("config").as("config")
    cy.fixture("specs").as("specs")

    cy.visit("/?projectPath=/foo/bar").then (win) =>
      { @start, @ipc } = win.App

      cy.stub(@ipc, "onMenuClicked")
      cy.stub(@ipc, "onFocusTests")
      cy.stub(@ipc, "getOptions").resolves({})
      cy.stub(@ipc, "updaterCheck").resolves(false)
      cy.stub(@ipc, "openProject").yields(null, @config)
      cy.stub(@ipc, "getSpecs").yields(null, @specs)

  describe "with a current user", ->
    beforeEach ->
      cy.stub(@ipc, "getCurrentUser").resolves(@user)

      @start()

    it "goes straight to project specs list", ->
      cy.contains(".folder", "integration")
      cy.contains(".folder", "unit")

  describe "without a current user", ->
    beforeEach ->
      cy.stub(@ipc, "getCurrentUser").resolves(null)

      @start()

    it "goes to login", ->
      cy.shouldBeOnLogin()
