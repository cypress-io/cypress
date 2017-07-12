describe "Navigation", ->
  beforeEach ->
    cy.fixture("user").as("user")

    cy.visitIndex().then (win) ->
      { start, @ipc } = win.App

      cy.stub(@ipc, "getOptions").resolves({})
      cy.stub(@ipc, "updaterCheck").resolves(false)
      cy.stub(@ipc, "getProjects").resolves([])
      cy.stub(@ipc, "getProjectStatuses").resolves([])
      cy.stub(@ipc, "logOut").resolves({})
      cy.stub(@ipc, "externalOpen")

      @getCurrentUser = @util.deferred()
      cy.stub(@ipc, "getCurrentUser").returns(@getCurrentUser.promise)

      start()

  context "any case", ->
    it "displays link to docs", ->
      cy.get("nav").contains("Docs")

    it "opens link to docs on click", ->
      cy
        .get("nav").contains("Docs").click().then ->
          expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io")

    it "displays link to chat", ->
      cy.get("nav").contains("Chat")

    it "opens link to chat on click", ->
      cy
        .get("nav").contains("Chat").click().then ->
          expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/chat")

  context "without a current user", ->
    beforeEach ->
      @getCurrentUser.resolve({})

    it "displays login button", ->
      cy.contains("nav a", "Log In")

    it "displays login modal when clicking login button", ->
      cy.contains("Log In").click()
      cy.contains(".btn", "Log In with GitHub")

  context "with a current user", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)

    it "displays user name", ->
      cy
        .get("nav a").should ($a) ->
          expect($a).to.contain(@user.name)

    it "shows dropdown on click of user name", ->
      cy.contains("Jane Lane").click()
      cy.contains("Log Out").should("be.visible")

    describe "logging out", ->
      beforeEach ->
        cy.contains("Jane Lane").click()
        cy.contains("Log Out").click()

      it "triggers logout on click of logout", ->
        expect(@ipc.logOut).to.be.called

      it "displays login button", ->
        cy.contains("nav a", "Log In")

  context "when current user has no name", ->
    beforeEach ->
      @user.name = null
      @getCurrentUser.resolve(@user)

    it "displays email instead of name", ->
      cy
        .get("nav a").should ($a) ->
          expect($a).to.contain(@user.email)
