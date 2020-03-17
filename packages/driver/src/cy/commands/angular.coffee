_ = require("lodash")
$ = require("jquery")
Promise = require("bluebird")

$errUtils = require("../../cypress/error_utils")

ngPrefixes = ['ng-', 'ng_', 'data-ng-', 'x-ng-']

module.exports = (Commands, Cypress, cy, state, config) ->
  findByNgBinding = (binding, options) ->
    selector = ".ng-binding"

    angular = state("window").angular

    _.extend options, {verify: false, log: false}

    getEl = ($elements) ->
      filtered = $elements.filter (index, el) ->
        dataBinding = angular.element(el).data("$binding")

        if dataBinding
          bindingName = dataBinding.exp or dataBinding[0].exp or dataBinding
          return binding in bindingName

      ## if we have items return
      ## those filtered items
      if filtered.length
        return filtered

      ## else return null element
      return $(null)

    do resolveElements = =>
      cy.now("get", selector, options).then ($elements) =>
        cy.verifyUpcomingAssertions(getEl($elements), options, {
          onRetry: resolveElements
          onFail: (err) ->
            err.message = "Could not find element for binding: '#{binding}'."
        })

  findByNgAttr = (name, attr, el, options) ->

    selectors = []
    error = "Could not find element for #{name}: '#{el}'.  Searched "

    _.extend options, {verify: false, log: false}

    finds = _.map ngPrefixes, (prefix) =>
      selector = "[#{prefix}#{attr}'#{el}']"
      selectors.push(selector)

      do resolveElements = =>
        cy.now("get", selector, options).then ($elements) =>
          cy.verifyUpcomingAssertions($elements, options, {
            onRetry: resolveElements
          })

    error += selectors.join(", ") + "."

    cancelAll = ->
      _.invokeMap(finds, "cancel")

    Promise
    .any(finds)
    .then (subject) ->
      cancelAll()
      return subject
    .catch Promise.AggregateError, (err) ->
      $errUtils.throwErr error

  Commands.addAll({
    ng: (type, selector, options = {}) ->
      ## what about requirejs / browserify?
      ## we need to intelligently check to see if we're using those
      ## and if angular is available through them.  throw a very specific
      ## error message here that's different depending on what module
      ## system you're using
      $errUtils.throwErrByPath "ng.no_global" if not state("window").angular

      _.defaults options, {log: true}

      if options.log
        options._log = Cypress.log()

      switch type
        when "model"
          findByNgAttr("model", "model=", selector, options)
        when "repeater"
          findByNgAttr("repeater", "repeat*=", selector, options)
        when "binding"
          findByNgBinding(selector, options)
  })
