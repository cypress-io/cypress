describe "without fetch polyfill", ->
  it "does not set polyfilled state", ->
    cy.visit("http://localhost:1818/first")
      .then ->
        expect(cy.state("fetchPolyfilled")).to.be.undefined
