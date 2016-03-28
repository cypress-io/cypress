describe "Options", ->
  beforeEach ->
    cy
      .visit("/")
      .window().then (win) ->
        {@ipc, @App} = win

        @agents = cy.agents()

        @ipc.handle("get:options", null, {})
        @ipc.handle("get:current:user", null, {})

      .get(".fa-cog").as("optionsLink")

  it "link to options has tooltip attrs", ->
    cy
      .get("#footer").find(".dropup")
        .should("have.attr", "data-original-title")

  it "displays options on click", ->
    cy
      .get("@optionsLink").click()
      .get(".dropdown-menu").should("be.visible")

  context "click about link", ->
    beforeEach ->
      @opts = {
        position: "center"
        width: 300
        height: 230
        toolbar: false
        title: "About"
        type: "ABOUT"
      }

    it "triggers window:open", ->
      @agents.spy(@App, "ipc")

      cy.get("@optionsLink").click()
      cy.contains("a", "About").click().then ->
          expect(@App.ipc).to.be.calledWith("window:open", @opts)

  context "click debug console link", ->
    beforeEach ->
      @opts = {
        height: 400
        position: "center"
        title: "Debug Console"
        toolbar: false
        type: "DEBUG"
        width: 800
      }

    it "triggers window:open", ->
      @agents.spy(@App, "ipc")

      cy.get("@optionsLink").click()
      cy.contains("a", "Debug Console").click().then ->
          expect(@App.ipc).to.be.calledWith("window:open", @opts)

  context "click check for updates link", ->
    beforeEach ->
      @opts = {
        height: 210
        position: "center"
        title: "Updates"
        toolbar: false
        type: "UPDATES"
        width: 300
      }

    it "triggers window:open", ->
      @agents.spy(@App, "ipc")

      cy.get("@optionsLink").click()
      cy.contains("a", "Check for updates").click().then ->
          expect(@App.ipc).to.be.calledWith("window:open", @opts)

  context "click Quit link", ->
    beforeEach ->

    it "triggers quit", ->
      @agents.spy(@App, "ipc")

      cy.get("@optionsLink").click()
      cy.contains("a", "Quit").click().then ->
          expect(@App.ipc).to.be.calledWith("quit")


