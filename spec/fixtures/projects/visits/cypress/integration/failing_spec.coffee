describe "failing_spec", ->
  it "passes", ->

  it "fails", ->
    cy.then ->
      throw new Error("foo")

  it "doesnt fail", ->
