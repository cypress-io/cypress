describe "Update Banner", ->
  beforeEach ->
    cy.fixture("user").as("user")
    cy.fixture("projects").as("projects")
    cy.fixture("projects_statuses").as("projectStatuses")
    cy.fixture("config").as("config")
    cy.fixture("specs").as("specs")

    cy.visitIndex().then (win) ->
      { @start, @ipc } = win.App

      cy.stub(@ipc, "getCurrentUser").resolves(@user)
      cy.stub(@ipc, "windowOpen")
      cy.stub(@ipc, "externalOpen")

      @updaterCheck = @util.deferred()
      cy.stub(@ipc, "updaterCheck").returns(@updaterCheck.promise)

  describe "general behavior", ->
    beforeEach ->
      cy.stub(@ipc, "getOptions").resolves({version: "1.3.3"})
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

    it "opens modal on click of Update link", ->
      @updaterCheck.resolve("1.3.4")
      cy.contains("Update").click()
      cy.get(".modal").should("be.visible")

    it "closes modal when X is clicked", ->
      @updaterCheck.resolve("1.3.4")
      cy.contains("Update").click()
      cy.get(".close").click()
      cy.get(".modal").should("not.be.visible")

  describe "in global mode", ->
    beforeEach ->
      cy.stub(@ipc, "getOptions").resolves({version: "1.3.3", os: "linux"})
      @start()
      @updaterCheck.resolve("1.3.4")
      cy.contains("Update").click()

    it "modal has info about downloading new version", ->
      cy.get(".modal").contains("Download the new version")

    it "opens download link when Download is clicked", ->
      cy.contains("Download the new version").click().then =>
        expect(@ipc.externalOpen).to.be.calledWith("https://download.cypress.io/desktop?os=linux64")

  describe "in project mode", ->
    beforeEach ->
      cy.stub(@ipc, "getOptions").resolves({version: "1.3.3", projectPath: "/foo/bar"})
      @start()
      @updaterCheck.resolve("1.3.4")
      cy.contains("Update").click()

    it "modal has info about updating package.json", ->
      cy.get(".modal").contains("npm install -D cypress@1.3.4")

    it "opens changelog when Changelog is clicked", ->
      cy.get(".modal").contains("Changelog").click().then =>
        expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/changelog")
