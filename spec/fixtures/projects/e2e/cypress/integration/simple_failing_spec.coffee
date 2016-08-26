describe "simple failing spec", ->
  it "fails1", ->
    cy.wrap(true, {timeout: 100}).should("be.false")

  it "fails2", ->
    throw new Error("fails2")