describe "Updates", ->
  beforeEach ->
    cy.viewport(300, 240)
    cy.visit("/updates.html").then (win) =>
      { startUpdateApp, @ipc } = win.App

      @version = "1.78"

      cy.stub(@ipc, "getOptions").resolves({version: @version})
      cy.stub(@ipc, "updaterRun")
      cy.stub(@ipc, "externalOpen")
      cy.stub(@ipc, "windowClose")

      startUpdateApp()

  it "updates title", ->
    cy.title().should("include", "Updates")

  it "displays loading spinner before updater:run is called", ->
    cy.get(".loader").should("exist")

  it "triggers updater:run", ->
    expect(@ipc.updaterRun).to.be.called

  it "links to Changelog", ->
    @ipc.updaterRun.yield(null, {event: "none"})

    cy.contains("a", "View Changelog").click().then ->
      expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/changelog")

  it "displays current version", ->
    @ipc.updaterRun.yield(null, {event: "none"})

    cy.get(".version").contains(@version)

  describe "updater:run start", ->
    it "displays check for updates msg", ->
      @ipc.updaterRun.yield(null, {event: "start"})
      cy.contains("Checking for updates...")

  describe "updater:run apply", ->
    it "displays applying updates msg", ->
      @ipc.updaterRun.yield(null, {event: "apply"})
      cy.contains("Applying updates...")

  describe "updater:run error", ->
    it "displays error msg", ->
      @ipc.updaterRun.yield(null, {event: "error"})
      cy.contains("An error occurred updating")
      cy.contains("You can manually update Cypress by running 'cypress install' from your terminal or by downloading it again.")

    it "triggers window:close on click of close btn", ->
      @ipc.updaterRun.yield(null, {event: "error"})
      cy.contains(".btn", "Done").click().then ->
        expect(@ipc.windowClose).to.be.called

  describe "updater:run none", ->
    it "displays none msg", ->
      @ipc.updaterRun.yield(null, {event: "none"})
      cy.contains("No updates available")

    it "triggers window:close on click of close btn", ->
      @ipc.updaterRun.yield(null, {event: "none"})
      cy.contains(".btn", "Done").click().then ->
        expect(@ipc.windowClose).to.be.called

  describe "updater:run download", ->
    it "displays download msg", ->
      @ipc.updaterRun.yield(null, {event: "download"})
      cy.contains("Downloading updates...")

  describe "updater:run done", ->
    it "displays done msg", ->
      @ipc.updaterRun.yield(null, {event: "done"})
      cy.contains("Updates ready")

    it "triggers window:close on click of restart btn", ->
      @ipc.updaterRun.yield(null, {event: "done"})
      cy.contains(".btn", "Restart").click().then ->
        expect(@ipc.windowClose).to.be.called
