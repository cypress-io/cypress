describe "Updates", ->
  beforeEach ->
    cy
      .viewport(300, 210)
      .visit("/updates")
      .window().then (win) ->
        {@ipc, @App} = win

        @agents = cy.agents()
        @agents.spy(@App, "ipc")

        @v = "1.78"

        @ipc.handle("get:options", null, {version: @v})

  it "has updates title", ->
    cy.title().should("include", "Updates")

  it "links to Changelog", ->
    cy.contains("a", "View Changelog").click().then ->
      expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/changelog")

  it "displays current version", ->
    cy.get(".version").contains(@v)

  it "triggers updater:run", ->
    expect(@App.ipc).to.be.calledWith("updater:run")

  describe "updater:run start", ->
    it "displays check for updates msg", ->
      @ipc.handle("updater:run", null, {event: "start"})
      cy.contains("Checking for updates...")

  describe "updater:run apply", ->
    it "displays applying updates msg", ->
      @ipc.handle("updater:run", null, {event: "apply"})
      cy.contains("Applying updates...")

  describe "updater:run error", ->
    it "displays error msg", ->
      @ipc.handle("updater:run", null, {event: "error"})
      cy.contains("An error occurred updating")

    it "triggers window:close on click of close btn", ->
      @ipc.handle("updater:run", null, {event: "error"})
      cy.contains(".btn", "Done").click().then ->
        expect(@App.ipc).to.be.calledWith("window:close")

  describe "updater:run none", ->
    it "displays none msg", ->
      @ipc.handle("updater:run", null, {event: "none"})
      cy.contains("No updates available")

    it "triggers window:close on click of close btn", ->
      @ipc.handle("updater:run", null, {event: "none"})
      cy.contains(".btn", "Done").click().then ->
        expect(@App.ipc).to.be.calledWith("window:close")

  describe "updater:run download", ->
    it "displays download msg", ->
      @ipc.handle("updater:run", null, {event: "download"})
      cy.contains("Downloading updates...")

  describe "updater:run done", ->
    it "displays done msg", ->
      @ipc.handle("updater:run", null, {event: "done"})
      cy.contains("Updates ready")

    it "triggers window:close on click of restart btn", ->
      @ipc.handle("updater:run", null, {event: "done"})
      cy.contains(".btn", "Restart").click().then ->
        expect(@App.ipc).to.be.calledWith("window:close")