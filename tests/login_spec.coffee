describe "Login [000]", ->
  beforeEach ->
    cy
      .visit("/")
      .window().its("ipc").as("ipc").then ->
        @ipc.handle("get:options", null, {})

  context "without a current user [02s]", ->
    beforeEach ->
      @ipc.handle("get:current:user", null, {})

    it "displays 'Cypress.io' [02t]", ->
      cy.get("#login").contains("Cypress.io")


    it "has Github Login button [02u]", ->

  context "with a current user [02x]", ->
    it "displays email instead of name [02w]", ->
      cy
        .fixture("user").then (@user) ->
          @user.name = null

          @ipc.handle("get:current:user", null, @user)
          @ipc.handle("get:project:paths", null, [])
        .get("header a").should ($a) ->
          expect($a).to.contain(@user.email)

