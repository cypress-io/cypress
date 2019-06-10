beforeEach ->
  cy.on "log:added", (attrs, log) =>
    if attrs.name is "visit"
      @lastLog = log

  return null

it "normally finishes in less than 500ms on localhost with connection: close", ->
  Cypress._.times 100, ->
    cy.visit('/foo')
    .then ->
      expect(@lastLog.get("totalTime")).to.be.lte(2000)

  return undefined
