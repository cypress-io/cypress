describe "Update Banner", ->
  beforeEach ->
    cy.fixture("user").as("user")
    cy.fixture("projects").as("projects")
    cy.fixture("projects_statuses").as("projectStatuses")
    cy.fixture("config").as("config")
    cy.fixture("specs").as("specs")

    cy.visit("/").then (win) ->
      { @start, @ipc } = win.App

      cy.stub(@ipc, "getCurrentUser").resolves(@user)
      cy.stub(@ipc, "windowOpen")
      cy.stub(@ipc, "externalOpen")

      @updaterCheck = @util.deferred()
      cy.stub(@ipc, "updaterCheck").returns(@updaterCheck.promise)

  describe "general behavior", ->
    beforeEach ->
      cy.stub(@ipc, "getOptions").resolves({})
      @start()

    it "does not display update banner when no update available", ->
      @updaterCheck.resolve(false)

      cy
        .get("#updates-available").should("not.exist")
        .get("html").should("not.have.class", "has-updates")

    it "checks for update on show", ->
      cy.then ->
        expect(@ipc.updaterCheck).to.be.called

    it "displays banner if new version is available", ->
      @updaterCheck.resolve("1.3.4")
      cy.get("#updates-available").should("be.visible")
      cy.contains("New updates are available")
      cy.get("html").should("have.class", "has-updates")

    it "gracefully handles error", ->
      @updaterCheck.reject({name: "foo", message: "Something bad happened"})
      cy.get(".footer").should("be.visible")

  describe "in global mode", ->
    beforeEach ->
      cy.stub(@ipc, "getOptions").resolves({})
      @start()

    it "opens updates window on click of Update link", ->
      @updaterCheck.resolve("1.3.4")
      cy.contains("Update").click().then ->
        expect(@ipc.windowOpen).to.be.calledWith({
          position: "center"
          width: 300
          height: 240
          toolbar: false
          title: "Updates"
          type: "UPDATES"
        })

  describe "in project mode", ->
    beforeEach ->
      cy.stub(@ipc, "getOptions").resolves({projectPath: "/foo/bar"})
      @start()
      @updaterCheck.resolve("1.3.4")

    it "opens modal with info on click of Update link", ->
      cy.contains("Update").click()
      cy.get(".modal").should("be.visible")

    describe "update modal", ->
      beforeEach ->
        cy.contains("Update").click()

      it.only "opens changelog when Changelog is clicked", ->
        cy.get(".modal").contains("Changelog").click().then =>
          expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/changelog")

      it "closes modal when X is clicked", ->
        cy.get(".close").click()
        cy.get(".modal").should("not.be.visible")
