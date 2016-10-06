describe "No Running Test", ->
  it "foo", ->
    cy.noop()

  it "bar", ->

  context "nested suite", ->
    try
      cy
        .viewport("iphone-6")
        .get("h1")
    catch err
      expect(err.message).to.include("Uncaught CypressError")
      expect(err.message).to.include("Cypress cannot execute commands outside a running test.")
      expect(err.message).to.include("This usually happens when you accidentally write commands outside an 'it ...)' test.")
      expect(err.message).to.include("If that is the case, just move these commands inside an 'it ...)' test.")
      expect(err.message).to.include("Check your test file for errors.")
      expect(err.message).to.include("nhttps://on.cypress.io/cannot-execute-commands-outside-test")
