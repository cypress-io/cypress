describe "Options [015]", ->
  beforeEach ->
    cy
      .visit("/")
      .window().then (win) ->
        {@ipc, @App} = win

        @agents = cy.agents()

        @ipc.handle("get:options", null, {})
        @ipc.handle("get:current:user", null, {})

      .get(".fa-cog").as("optionsLink")

  it "link to options has title [016]", ->
    cy
      .get("#footer").find(".dropup")
        .should("have.attr", "title", "Options")

  it "displays options on click [017]", ->
    cy
      .get("@optionsLink").click()
      .get(".dropdown-menu").should("be.visible")

  context "click about link [018]", ->
    beforeEach ->
      @opts = {
        position: "center"
        width: 300
        height: 230
        toolbar: false
        title: "About"
        type: "ABOUT"
      }

    it "triggers window:open [019]", ->
      @agents.spy(@App, "ipc")

      cy.get("@optionsLink").click()
      cy.contains("a", "About").click().then ->
          expect(@App.ipc).to.be.calledWith("window:open", @opts)

  context "click debug console link [018]", ->
    beforeEach ->
      @opts = {
        height: 400
        position: "center"
        title: "Debug Console"
        toolbar: false
        type: "DEBUG"
        width: 800
      }

    it "triggers window:open [019]", ->
      @agents.spy(@App, "ipc")

      cy.get("@optionsLink").click()
      cy.contains("a", "Debug Console").click().then ->
          expect(@App.ipc).to.be.calledWith("window:open", @opts)

  context "click check for updates link [018]", ->
    beforeEach ->
      @opts = {
        height: 210
        position: "center"
        title: "Updates"
        toolbar: false
        type: "UPDATES"
        width: 300
      }

    it "triggers window:open [019]", ->
      @agents.spy(@App, "ipc")

      cy.get("@optionsLink").click()
      cy.contains("a", "Check for Updates").click().then ->
          expect(@App.ipc).to.be.calledWith("window:open", @opts)

  context "click Quit link [018]", ->
    beforeEach ->

    it "triggers quit [019]", ->
      @agents.spy(@App, "ipc")

      cy.get("@optionsLink").click()
      cy.contains("a", "Quit").click().then ->
          expect(@App.ipc).to.be.calledWith("quit")


