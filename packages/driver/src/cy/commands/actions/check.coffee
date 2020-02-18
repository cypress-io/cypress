_ = require("lodash")
Promise = require("bluebird")

$dom = require("../../../dom")
$utils = require("../../../cypress/utils")
$errUtils = require("../../../cypress/error_utils")
$elements = require("../../../dom/elements")

checkOrUncheck = (type, subject, values = [], options = {}) ->
  ## we're not handling conversion of values to strings
  ## in case we've received numbers

  ## if we're not an array but we are an object
  ## reassign options to values
  if not _.isArray(values) and _.isObject(values)
    options = values
    values = []
  else
    ## make sure we're an array of values
    values = [].concat(values)

  ## keep an array of subjects which
  ## are potentially reduced down
  ## to new filtered subjects
  matchingElements = []

  _.defaults options,
    $el: subject
    log: true
    force: false

  isNoop = ($el) ->
    switch type
      when "check"
        $el.prop("checked")
      when "uncheck"
        not $el.prop("checked")

  isAcceptableElement = ($el) ->
    switch type
      when "check"
        $el.is(":checkbox,:radio")
      when "uncheck"
        $el.is(":checkbox")

  ## does our el have a value
  ## in the values array?
  ## or values array is empty
  elHasMatchingValue = ($el) ->
    value = $elements.getNativeProp($el.get(0), "value")
    values.length is 0 or value in values

  ## blow up if any member of the subject
  ## isnt a checkbox or radio
  checkOrUncheckEl = (el, index) =>
    $el = $dom.wrap(el)

    if not isAcceptableElement($el)
      node   = $dom.stringify($el)
      word   = $utils.plural(options.$el, "contains", "is")
      phrase = if type is "check" then " and `:radio`" else ""
      $errUtils.throwErrByPath("check_uncheck.invalid_element", {
        onFail: options._log
        args: { node, word, phrase, cmd: type }
      })

    isElActionable = elHasMatchingValue($el)

    if isElActionable
      matchingElements.push(el)

    consoleProps = {
      "Applied To":   $dom.getElements($el)
      "Elements":     $el.length
    }

    if options.log and isElActionable

      ## figure out the options which actually change the behavior of clicks
      deltaOptions = $utils.filterOutOptions(options)

      options._log = Cypress.log
        message: deltaOptions
        $el: $el
        consoleProps: ->
          _.extend consoleProps, {
            Options: deltaOptions
          }

      options._log.snapshot("before", {next: "after"})


      ## if the checkbox was already checked
      ## then notify the user of this note
      ## and bail
      if isNoop($el)
        if !options.force
          ## still ensure visibility even if the command is noop
          cy.ensureVisibility($el, options._log)
        if options._log
          inputType = if $el.is(":radio") then "radio" else "checkbox"
          consoleProps.Note = "This #{inputType} was already #{type}ed. No operation took place."
          options._log.snapshot().end()

        return null

    ## if we didnt pass in any values or our
    ## el's value is in the array then check it
    if isElActionable
      cy.now("click", $el, {
        $el: $el
        log: false
        verify: false
        _log: options._log
        force: options.force
        timeout: options.timeout
        interval: options.interval
      }).then ->
        options._log.snapshot().end() if options._log

        return null

  ## return our original subject when our promise resolves
  Promise
  .resolve(options.$el.toArray())
  .each(checkOrUncheckEl)
  .then ->
    ## filter down our $el to the
    ## matching elements
    options.$el = options.$el.filter(matchingElements)

    do verifyAssertions = =>
      cy.verifyUpcomingAssertions(options.$el, options, {
        onRetry: verifyAssertions
      })

module.exports = (Commands, Cypress, cy, state, config) ->
  Commands.addAll({ prevSubject: "element" }, {
    check: (subject, values, options) ->
      checkOrUncheck.call(@, "check", subject, values, options)

    uncheck: (subject, values, options) ->
      checkOrUncheck.call(@, "uncheck", subject, values, options)
  })
