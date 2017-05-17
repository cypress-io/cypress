{deferred, stubIpc} = require("../support/util")

describe "Updates", ->
  beforeEach ->
    cy
      .viewport(300, 240)
      .visit("/updates.html")
      .then (win) ->
        {@App} = win
        cy.stub(@App, "ipc").as("ipc")

        @version = "1.78"

        stubIpc(@App.ipc, {
          "get:options": (stub) => stub.resolves({version: @version})
          "updater:run": ->
        })

        @App.startUpdateApp()

  it "updates title", ->
    cy.title().should("include", "Updates")

  it "displays loading spinner before updater:run is called", ->
    cy.get(".loader").should("exist")

  it "triggers updater:run", ->
    expect(@App.ipc).to.be.calledWith("updater:run")

  it "links to Changelog", ->
    @["updater:run"].yield(null, {event: "none"})

    cy.contains("a", "View Changelog").click().then ->
      expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/changelog")

  it "displays current version", ->
    @["updater:run"].yield(null, {event: "none"})

    cy.get(".version").contains(@version)

  describe "updater:run start", ->
    it "displays check for updates msg", ->
      @["updater:run"].yield(null, {event: "start"})
      cy.contains("Checking for updates...")

  describe "updater:run apply", ->
    it "displays applying updates msg", ->
      @["updater:run"].yield(null, {event: "apply"})
      cy.contains("Applying updates...")

  describe "updater:run error", ->
    it "displays error msg", ->
      @["updater:run"].yield(null, {event: "error"})
      cy.contains("An error occurred updating")
      cy.contains("You can manually update Cypress by running 'cypress install' from your terminal or by downloading it again.")

    it "triggers window:close on click of close btn", ->
      @["updater:run"].yield(null, {event: "error"})
      cy.contains(".btn", "Done").click().then ->
        expect(@App.ipc).to.be.calledWith("window:close")

  describe "updater:run none", ->
    it "displays none msg", ->
      @["updater:run"].yield(null, {event: "none"})
      cy.contains("No updates available")

    it "triggers window:close on click of close btn", ->
      @["updater:run"].yield(null, {event: "none"})
      cy.contains(".btn", "Done").click().then ->
        expect(@App.ipc).to.be.calledWith("window:close")

  describe "updater:run download", ->
    it "displays download msg", ->
      @["updater:run"].yield(null, {event: "download"})
      cy.contains("Downloading updates...")

  describe "updater:run done", ->
    it "displays done msg", ->
      @["updater:run"].yield(null, {event: "done"})
      cy.contains("Updates ready")

    it "triggers window:close on click of restart btn", ->
      @["updater:run"].yield(null, {event: "done"})
      cy.contains(".btn", "Restart").click().then ->
        expect(@App.ipc).to.be.calledWith("window:close")
