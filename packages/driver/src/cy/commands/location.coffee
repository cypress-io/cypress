_ = require("lodash")
Promise = require("bluebird")

$errUtils = require("../../cypress/error_utils")
$Location = require("../../cypress/location")

module.exports = (Commands, Cypress, cy, state, config) ->
  Commands.addAll({
    url: (options = {}) ->
      _.defaults options, {log: true}

      if options.log isnt false
        options._log = Cypress.log
          message: ""

      getHref = =>
        cy.getRemoteLocation("href")

      do resolveHref = =>
        Promise.try(getHref).then (href) =>
          cy.verifyUpcomingAssertions(href, options, {
            onRetry: resolveHref
          })

    hash: (options = {}) ->
      _.defaults options, {log: true}

      if options.log isnt false
        options._log = Cypress.log
          message: ""

      getHash = =>
        cy.getRemoteLocation("hash")

      do resolveHash = =>
        Promise.try(getHash).then (hash) =>
          cy.verifyUpcomingAssertions(hash, options, {
            onRetry: resolveHash
          })

    location: (key, options) ->
      ## normalize arguments allowing key + options to be undefined
      ## key can represent the options
      if _.isObject(key) and _.isUndefined(options)
        options = key

      options ?= {}

      _.defaults options, {log: true}

      getLocation = =>
        location = cy.getRemoteLocation()

        ret = if _.isString(key)
          ## use existential here because we only want to throw
          ## on null or undefined values (and not empty strings)
          location[key] ?
            $errUtils.throwErrByPath("location.invalid_key", { args: { key } })
        else
          location

      if options.log isnt false
        options._log = Cypress.log
          message: key ? ""

      do resolveLocation = =>
        Promise.try(getLocation).then (ret) =>
          cy.verifyUpcomingAssertions(ret, options, {
            onRetry: resolveLocation
          })
  })
