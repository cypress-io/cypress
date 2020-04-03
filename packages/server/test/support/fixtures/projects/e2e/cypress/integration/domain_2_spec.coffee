describe.only "localhost", ->
  it "can visit 1", ->
    cy.visit("http://app.localhost:4848")

describe.only "com.au", ->
  it "can visit 2", ->
    cy.visit("http://foo.bar.baz.com.au:4848")

describe "herokuapp.com", ->
  it "can visit 3", ->
    cy.visit("https://cypress-example.herokuapp.com")
    cy.contains("Getting Started with Node on Heroku")
