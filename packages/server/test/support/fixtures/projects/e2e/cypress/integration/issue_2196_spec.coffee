onLoad = onBeforeLoad = null

Cypress.Commands.overwrite "visit", (originalVisit, url, options) ->
  onBeforeLoad = cy.stub().as('onBeforeLoad')
  onLoad = cy.stub().as('onLoad')

  return originalVisit(url, { onBeforeLoad, onLoad })

context "issue #2196: overwriting visit", ->
  it "fires onBeforeLoad", ->
    cy
      .visit("http://localhost:3434/index.html")
      .then ->
        expect(onBeforeLoad).to.be.called
        expect(onLoad).to.be.called
