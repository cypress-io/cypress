describe "stdout_failing_spec", ->
  it "passes", ->

  it "fails", ->
    cy.then ->
      throw new Error("foo")

  it "doesnt fail", ->

  context "failing hook", ->
    beforeEach ->
      cy.visit("/does-not-exist.html")

    it "is failing", ->

  context "passing hook", ->
    beforeEach ->
      cy.wrap({})

    it "is failing", ->
      cy.visit("/does-not-exist.html")