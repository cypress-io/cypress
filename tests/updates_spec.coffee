describe "Updates [01o]", ->
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

  it "has updates title [01g]", ->
    cy.title().should("include", "Updates")

  it "links to Changelog [02e]", ->
    cy.contains("a", "View Changelog").click().then ->
      expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/changelog")

  it "displays current version [02f]", ->
    cy.get(".version").contains(@v)

  it "triggers updater:run [028]", ->
    expect(@App.ipc).to.be.calledWith("updater:run")

  describe "updater:run start [02a]", ->
    it "displays check for updates msg [02b]", ->
      @ipc.handle("updater:run", null, {event: "start"})
      cy.contains("Checking for updates...")

  describe "updater:run apply [05z]", ->
    it "displays applying updates msg [060]", ->
      @ipc.handle("updater:run", null, {event: "apply"})
      cy.contains("Applying updates...")

  describe "updater:run error [02c]", ->
    it "displays error msg [02b]", ->
      @ipc.handle("updater:run", null, {event: "error"})
      cy.contains("An error occurred updating")

    it "triggers window:close on click of close btn [02d]", ->
      @ipc.handle("updater:run", null, {event: "error"})
      cy.contains(".btn", "Done").click().then ->
        expect(@App.ipc).to.be.calledWith("window:close")

  describe "updater:run none [061]", ->
    it "displays none msg [062]", ->
      @ipc.handle("updater:run", null, {event: "none"})
      cy.contains("No updates available")

    it "triggers window:close on click of close btn [063]", ->
      @ipc.handle("updater:run", null, {event: "none"})
      cy.contains(".btn", "Done").click().then ->
        expect(@App.ipc).to.be.calledWith("window:close")

  describe "updater:run download [064]", ->
    it "displays download msg [065]", ->
      @ipc.handle("updater:run", null, {event: "download"})
      cy.contains("Downloading updates...")

  describe "updater:run done [066]", ->
    it "displays done msg [02b]", ->
      @ipc.handle("updater:run", null, {event: "done"})
      cy.contains("Updates ready")

    it "triggers window:close on click of restart btn [067]", ->
      @ipc.handle("updater:run", null, {event: "done"})
      cy.contains(".btn", "Restart").click().then ->
        expect(@App.ipc).to.be.calledWith("window:close")