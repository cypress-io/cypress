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

Cypress.addParentCommand "shouldBeOnLogin", () ->
  cy.contains("Log In with GitHub")

Cypress.addParentCommand "shouldBeOnProjectSpecs", () ->
  cy.contains(".folder", "integration")
  cy.contains(".folder", "unit")
