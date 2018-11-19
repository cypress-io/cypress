onStart = cy.stub()
onLoad = cy.stub()

Cypress.Commands.overwrite "visit", (originalVisit, url, options) ->
  return originalVisit(url, { onStart, onLoad })

context "issue #2196: overwriting visit", ->
  it "fires onStart", ->
    cy
      .visit("http://localhost:3434/index.html")
      .then ->
        expect(onStart).to.be.called
        expect(onLoad).to.be.called
