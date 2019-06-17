beforeEach ->
  cy.on "log:added", (attrs, log) =>
    if attrs.name is "visit"
      @lastLog = log

  return null

it "always finishes in less than 150ms on localhost with connection: close", ->
  cy.visit('/close')

  Cypress._.times 100, ->
    cy.visit('/close')
    .then ->
      expect(@lastLog.get("totalTime")).to.be.lte(150)

  return undefined

it "always finishes in less than 150ms on localhost with connection: keep-alive", ->
  cy.visit('/close')

  Cypress._.times 100, ->
    cy.visit('/keepalive')
    .then ->
      expect(@lastLog.get("totalTime")).to.be.lte(150)

  return undefined
