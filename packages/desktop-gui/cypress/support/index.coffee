BluebirdPromise = require("bluebird")

beforeEach ->
  @util = {
    deferred: (Promise = BluebirdPromise) ->
      deferred = {}
      deferred.promise = new Promise (resolve, reject) ->
        deferred.resolve = resolve
        deferred.reject = reject
      return deferred
  }

Cypress.addParentCommand "shouldBeOnLogin", () ->
  cy.contains("Log In with GitHub")
