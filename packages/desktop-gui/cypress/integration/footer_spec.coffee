describe "Footer", ->
  beforeEach ->
    cy.fixture("user").as("user")

    cy.visitIndex().then (win) ->
      { start, @ipc } = win.App

      @version = "1.0.0"

      cy.stub(@ipc, "getOptions").resolves({version: @version})
      cy.stub(@ipc, "updaterCheck").resolves(false)
      cy.stub(@ipc, "getProjects").resolves([])
      cy.stub(@ipc, "getProjectStatuses").resolves([])
      cy.stub(@ipc, "externalOpen")

      @getUser = @util.deferred()
      cy.stub(@ipc, "getCurrentUser").resolves(@getUser.promise)

      start()

  describe "when logged out", ->
    beforeEach ->
      @getUser.resolve(null)

    it "hides footer", ->
      cy.get("footer").should("not.be.visible")

  describe "when logged in", ->
    beforeEach ->
      @getUser.resolve(@user)

    it "shows footer", ->
      cy.get("footer").should("be.visible")

    it "displays version sent from get:options", ->
      cy.get("footer").contains(@version)

    it "opens link to changelog on click of changelog", ->
      cy
        .get("a").contains("Changelog").click().then ->
          expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/changelog")
