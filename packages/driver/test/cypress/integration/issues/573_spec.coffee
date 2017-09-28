describe "basic auth", ->
  it "can visit", ->
    cy.visit("http://cypress:password123@localhost:3500/basic_auth")
    # cy.visit("http://admin:admin@the-internet.herokuapp.com/basic_auth")
