describe "user agent", ->
  it "is set on visits", ->
    cy.visit("/agent")
    cy.get("#agent").should("contain", "foo bar baz agent")

  it "is set on requests", ->
    cy
      .request("PUT", "/agent")
      .its("body").should("deep.eq", {
        userAgent: "foo bar baz agent"
      })
