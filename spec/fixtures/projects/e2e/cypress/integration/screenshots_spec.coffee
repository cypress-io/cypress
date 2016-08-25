describe "screenshots", ->
  it "manually generates pngs", ->
    cy.screenshot("foo/bar/baz")

  it "generates pngs on failure", ->
    cy.then ->
      throw new Error("fail whale")