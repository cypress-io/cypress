describe "form submissions", ->
  beforeEach ->
    cy.visit("/forms.html")

  it "will find 'form success' message by default (after retrying)", ->
    cy
      .server()
      .route("POST", "/users", {})
      .get("input[name=name]").type("brian")
      .get("#submit").click()
      .get("form span").then ($span) ->
        expect($span).to.contain("form success!")

  it "needs an explicit should when an element is immediately found", ->
    cy
      .server()
      .route("POST", "/users", {})
      .get("input[name=name]").type("brian")
      .get("#submit").click()
      .get("form").should ($form) ->
        expect($form).to.contain("form success!")