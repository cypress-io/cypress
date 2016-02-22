describe "About [01f]", ->
  beforeEach ->
    cy
    .visit("/about")
    .window().then (win) ->
      {@ipc, @App} = win

      @agents = cy.agents()
      @agents.spy(@App, "ipc")

      @v = "1.78"

      @ipc.handle("get:options", null, {version: @v})

  it "has about title [01g]", ->
    @src = "logo.png"
    @ipc.handle("get:about:logo:src", null, @src)

    cy.title().should("include", "About")

  context "Cypress logo [01i]", ->
    it "triggers get:about:logo:src on about app start [01b]", ->
      cy
        .then ->
          expect(@App.ipc).to.be.calledWith("get:about:logo:src")

    it "logo img sets src to logo:src [01k]", ->
      @src = "logo.png"
      @ipc.handle("get:about:logo:src", null, @src)

      cy
        .get("img")
          .should("have.attr", "src")
          .and("include", @src)

    it.only "gracefully handles logo err [01m]", ->
      @ipc.handle("get:about:logo:src", {message: "foobar"}, {})


  it "displays app version [01l]", ->
    # @App.updater.set("version", v)
    @ipc.handle("get:about:logo:src", null, "logo.png")

    cy.get(".version").contains(@v)


