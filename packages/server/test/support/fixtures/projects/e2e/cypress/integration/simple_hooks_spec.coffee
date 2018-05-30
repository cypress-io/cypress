describe "simple hooks spec", ->
  before ->
    cy.wait(100)

  beforeEach ->
    cy.wait(200)

  afterEach ->
    cy.wait(200)

  after ->
    cy.wait(100)

  it "t1", ->
    cy.wrap("t1").should("eq", "t1")

  it "t2", ->
    cy.wrap("t2").should("eq", "t2")

  it "t3", ->
    cy.wrap("t3").should("eq", "t3")
