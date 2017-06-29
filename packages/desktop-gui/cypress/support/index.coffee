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

Cypress.Commands.add "visitIndex", ->
  cy.visit("/dist/index.html")

Cypress.Commands.add "shouldBeOnLogin", ->
  cy.contains("Log In with GitHub")

Cypress.Commands.add "shouldBeOnIntro", ->
  cy.get(".nav .logo")

Cypress.Commands.add "shouldBeOnProjectSpecs", ->
  cy.contains(".folder", "integration")
  cy.contains(".folder", "unit")
