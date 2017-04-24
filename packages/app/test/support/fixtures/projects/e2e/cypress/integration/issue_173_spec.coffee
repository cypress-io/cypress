beforeEach ->
  cy.visit("/index.html")

it "fails", ->
  cy.get("element_does_not_exist", {timeout: 200})

it "should be able to log", ->
  cy.get("body").should("contain", "hi")