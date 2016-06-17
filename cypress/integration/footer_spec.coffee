describe "Footer", ->
  beforeEach ->
    cy
      .visit("/")
      .window().then (win) ->
        {@ipc, @App} = win

        @agents = cy.agents()
        @agents.spy(@App, "ipc")

        @ipc.handle("get:options", null, {})


  it "does not display on login", ->
    cy.get("footer").should("not.be.visible")

  describe "footer displays in app", ->
    beforeEach ->
      cy
        .fixture("user").then (@user) ->
          @ipc.handle("get:current:user", null, @user)
          @ipc.handle("get:project:paths", null, [])

    it "displays after login", ->
      cy.get("footer").should("be.visible")

    it "opens link to changelog on click of changelog", ->
      cy
        .get("a").contains("Changelog").click().then ->
          expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/changelog")

    it "triggers window:open with About options", ->
      @opts = {
        position: "center"
        width: 300
        height: 230
        toolbar: false
        title: "About"
        type: "ABOUT"
      }

      cy
        .get("a").contains("Version").click().then ->
          expect(@App.ipc).to.be.calledWithExactly("window:open", @opts)
