beforeEach ->
  cy.on "log:added", (attrs, log) =>
    if attrs.name is "visit"
      @lastLog = log

  return null

it "normally finishes in less than 1000ms on localhost with connection: close", ->
  Cypress._.times 100, ->
    cy.visit('/close')
    .then ->
      expect(@lastLog.get("totalTime")).to.be.lte(1000)

  return undefined

it "normally finishes in less than 1000ms on localhost with connection: keep-alive", ->
  Cypress._.times 100, ->
    cy.visit('/keepalive')
    .then ->
      expect(@lastLog.get("totalTime")).to.be.lte(1000)

  return undefined
