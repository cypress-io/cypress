onStart = cy.stub()
onReady = cy.stub()

Cypress.Commands.overwrite "visit", (originalVisit, url, options) ->
  return originalVisit(url, { onStart, onReady })

context "issue #2196: overwriting visit", ->
  it "fires onStart", ->
    cy
      .visit("http://localhost:3434/index.html")
      .then ->
        expect(onStart).to.be.called
        expect(onReady).to.be.called
