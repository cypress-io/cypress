describe "form submission fails", ->
  beforeEach ->
    cy.visit("/forms.html")

  it "fails without an explicit wait when an element is immediately found", ->
    cy
      .server()
      .route("POST", "/users", {})
      .get("input[name=name]").type("brian")
      .get("#submit").click()
      .get("form").then ($form) ->
        expect($form).to.contain("form success!")
