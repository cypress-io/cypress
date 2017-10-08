BluebirdPromise = require("bluebird")

beforeEach ->
  @util = {
    deferred: (Promise = BluebirdPromise) ->
      deferred = {}
      deferred.promise = new Promise (resolve, reject) ->
        deferred.resolve = resolve
        deferred.reject = reject
      return deferred

    deepClone: (obj) ->
      JSON.parse(JSON.stringify(obj))
  }

Cypress.Commands.add "visitIndex", (options = {}) ->
  cy.visit("/dist/index.html", options)

Cypress.Commands.add "shouldBeOnIntro", ->
  cy.get(".main-nav .logo")

Cypress.Commands.add "shouldBeOnProjectSpecs", ->
  cy.contains(".folder", "integration")
  cy.contains(".folder", "unit")

Cypress.Commands.add "logOut", ->
  cy.contains("Jane Lane").click()
  cy.contains("Log Out").click()

Cypress.Commands.add "shouldBeLoggedOut", ->
  cy.contains(".main-nav a", "Log In")
