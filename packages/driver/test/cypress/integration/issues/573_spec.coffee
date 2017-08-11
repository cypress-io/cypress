describe.skip "basic auth", ->
  it "prompts", ->
    cy.visit("http://admin:admin@the-internet.herokuapp.com/basic_auth")
