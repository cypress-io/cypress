human = require("human-interval")

OLD_VERSION = "1.3.3"
NEW_VERSION = "1.3.4"

describe "Update Banner", ->
  beforeEach ->
    cy.fixture("user").as("user")
    cy.fixture("projects").as("projects")
    cy.fixture("projects_statuses").as("projectStatuses")
    cy.fixture("config").as("config")
    cy.fixture("specs").as("specs")

    cy.visitIndex({
      onBeforeLoad: (win) ->
        cy.spy(win, "setInterval")
    }).then (win) ->
      { @start, @ipc } = win.App

      cy.stub(@ipc, "getCurrentUser").resolves(@user)
      cy.stub(@ipc, "windowOpen")
      cy.stub(@ipc, "externalOpen")

      @updaterCheck = @util.deferred()
      cy.stub(@ipc, "updaterCheck").returns(@updaterCheck.promise)

  describe "general behavior", ->
    beforeEach ->
      cy.stub(@ipc, "getOptions").resolves({version: OLD_VERSION})
      @start()

    it "checks for updates every 60 minutes", ->
      cy.window().then (win) ->
        expect(win.setInterval.firstCall.args[1]).to.eq(human("60 minutes"))

    it "does not display update banner when no update available", ->
      @updaterCheck.resolve(false)

      cy.get("#updates-available").should("not.exist")
      cy.get("html").should("not.have.class", "has-updates")

    it "checks for update on show", ->
      cy.wrap(@ipc.updaterCheck).should("be.called")

    it "displays banner if new version is available", ->
      @updaterCheck.resolve(NEW_VERSION)
      cy.get("#updates-available").should("be.visible")
      cy.contains("New updates are available")
      cy.get("html").should("have.class", "has-updates")

    it "gracefully handles error", ->
      @updaterCheck.reject({name: "foo", message: "Something bad happened"})
      cy.get(".footer").should("be.visible")

    it "opens modal on click of Update link", ->
      @updaterCheck.resolve(NEW_VERSION)
      cy.contains("Update").click()
      cy.get(".modal").should("be.visible")

    it "closes modal when X is clicked", ->
      @updaterCheck.resolve(NEW_VERSION)
      cy.contains("Update").click()
      cy.get(".modal").find(".close").click()
      cy.get(".modal").should("not.be.visible")

  describe "in global mode", ->
    beforeEach ->
      cy.stub(@ipc, "getOptions").resolves({version: OLD_VERSION, os: "linux"})
      @start()
      @updaterCheck.resolve(NEW_VERSION)
      cy.contains("Update").click()

    it "modal has info about downloading new version", ->
      cy.get(".modal").contains("Download the new version")

    it "opens download link when Download is clicked", ->
      cy.contains("Download the new version").click().then =>
        expect(@ipc.externalOpen).to.be.calledWith("https://download.cypress.io/desktop")

  describe "in project mode", ->
    beforeEach ->
      cy.stub(@ipc, "getOptions").resolves({version: OLD_VERSION, projectRoot: "/foo/bar"})
      @start()
      @updaterCheck.resolve(NEW_VERSION)
      cy.contains("Update").click()

    it "modal has info about updating package.json", ->
      cy.get(".modal").contains("npm install --save-dev cypress@#{NEW_VERSION}")

    it "links to 'open' doc on click of open command", ->
      cy.get(".modal").contains("cypress open").click().then =>
        expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/how-to-open-cypress")

    it "opens changelog when new version is clicked", ->
      cy.get(".modal").contains(NEW_VERSION).click().then =>
        expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/changelog")

  describe "in specs list", ->
    beforeEach ->
      cy.stub(@ipc, "getOptions").resolves({version: OLD_VERSION, projectRoot: "/foo/bar"})
      cy.stub(@ipc, "openProject").resolves(@config)
      cy.stub(@ipc, "getSpecs").yields(null, @specs)
      @start()
      @updaterCheck.resolve(NEW_VERSION)
      cy.get("#updates-available")

    it "displays all folders/specs within visible area", ->
      cy.get(".folder-display-name")
        .last()
        .scrollIntoView()
        .should("be.visible")
