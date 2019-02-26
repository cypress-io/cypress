describe "localhost", ->
  it "can visit", ->
    cy.visit("http://app.localhost:4848")

describe "com.au", ->
  it "can visit", ->
    cy.visit("http://foo.bar.baz.com.au:4848")

describe "herokuapp.com", ->
  it "can visit", ->
    cy.visit("https://cypress-example.herokuapp.com")
    cy.contains("Getting Started with Node on Heroku")
