_ = require("lodash")
$dom = require("../dom")
$utils = require("../cypress/utils")

VALID_POSITIONS = "topLeft top topRight left center right bottomLeft bottom bottomRight".split(" ")

## TODO: in 4.0 we should accept a new validation type called 'elements'
## which accepts an array of elements (and they all have to be elements!!)
## this would fix the TODO below, and also ensure that commands understand
## they may need to work with both element arrays, or specific items
## such as a single element, a single document, or single window

returnFalse = -> return false

create = (state, expect) ->
  ## TODO: we should probably normalize all subjects
  ## into an array and loop through each and verify
  ## each element in the array is valid. as it stands
  ## we only validate the first
  validateType = (subject, type, cmd) ->
    name = cmd.get("name")
    prev = cmd.get("prev")

    switch type
      when "element"
        ## if this is an element then ensure its currently attached
        ## to its document context
        if $dom.isElement(subject)
          ensureAttached(subject, name)

        ## always ensure this is an element
        ensureElement(subject, name)

      when "document"
        ensureDocument(subject, name)

      when "window"
        ensureWindow(subject, name)

  ensureSubjectByType = (subject, type, name) ->
    current = state("current")

    types = [].concat(type)

    ## if we have an optional subject and nothing's
    ## here then just return cuz we good to go
    if ("optional" in types) and _.isUndefined(subject)
      return

    ## okay we either have a subject and either way
    ## slice out optional so we can verify against
    ## the various types
    types = _.without(types, "optional")

    ## if we have no types then bail
    return if types.length is 0

    errors = []

    for type in types
      try
        validateType(subject, type, current)
      catch err
        errors.push(err)

    ## every validation failed and we had more than one validation
    if (errors.length is types.length)
      err = errors[0]

      if types.length > 1
        ## append a nice error message telling the user this
        err = $utils.appendErrMsg(err, "All #{types.length} subject validations failed on this subject.")

      throw err

  ensureRunnable = (name) ->
    if not state("runnable")
      $utils.throwErrByPath("miscellaneous.outside_test_with_cmd", {
        args: {
          cmd: name
        }
      })

  ensureElementIsNotAnimating = ($el, coords = [], threshold) ->
    lastTwo = coords.slice(-2)

    ## bail if we dont yet have two points
    if lastTwo.length isnt 2
      $utils.throwErrByPath("dom.animation_check_failed")

    [point1, point2] = lastTwo

    ## verify that there is not a distance
    ## greater than a default of '5' between
    ## the points
    if $utils.getDistanceBetween(point1, point2) > threshold
      cmd  = state("current").get("name")
      node = $dom.stringify($el)
      $utils.throwErrByPath("dom.animating", {
        args: { cmd, node }
      })

  ensureReceivability = (subject, onFail) ->
    cmd = state("current").get("name")

    if subject.prop("disabled")
      node = $dom.stringify(subject)

      $utils.throwErrByPath("dom.disabled", {
        onFail
        args: { cmd, node }
      })

  ensureVisibility = (subject, onFail) ->
    cmd = state("current").get("name")

    if not (subject.length is subject.filter(":visible").length)
      reason = $dom.getReasonIsHidden(subject)
      node   = $dom.stringify(subject)
      $utils.throwErrByPath("dom.not_visible", {
        onFail
        args: { cmd, node, reason }
      })

  ensureAttached = (subject, name, onFail) ->
    if $dom.isDetached(subject)
      prev = state("current").get("prev")

      $utils.throwErrByPath("subject.not_attached", {
        onFail
        args: {
          name
          subject: $dom.stringify(subject),
          previous: prev.get("name")
        }
      })

  ensureElement = (subject, name, onFail) ->
    if not $dom.isElement(subject)
      prev = state("current").get("prev")

      $utils.throwErrByPath("subject.not_element", {
        onFail
        args: {
          name
          subject: $utils.stringifyActual(subject)
          previous: prev.get("name")
        }
      })

  ensureWindow = (subject, name, log) ->
    if not $dom.isWindow(subject)
      prev = state("current").get("prev")

      $utils.throwErrByPath("subject.not_window_or_document", {
        args: {
          name
          type: "window"
          subject: $utils.stringifyActual(subject)
          previous: prev.get("name")
        }
      })

  ensureDocument = (subject, name, log) ->
    if not $dom.isDocument(subject)
      prev = state("current").get("prev")

      $utils.throwErrByPath("subject.not_window_or_document", {
        args: {
          name
          type: "document"
          subject: $utils.stringifyActual(subject)
          previous: prev.get("name")
        }
      })

  ensureExistence = (subject) ->
    returnFalse = ->
      cleanup()

      return false

    cleanup = ->
      state("onBeforeLog", null)

    ## prevent any additional logs this is an implicit assertion
    state("onBeforeLog", returnFalse)

    ## verify the $el exists and use our default error messages
    ## TODO: always unbind if our expectation failed
    try
      expect(subject).to.exist
    catch err
      cleanup()

      throw err

  ensureElExistence = ($el) ->
    ## dont throw if this isnt even a DOM object
    # return if not $dom.isJquery($el)

    ## ensure that we either had some assertions
    ## or that the element existed
    return if $el and $el.length

    ## TODO: REFACTOR THIS TO CALL THE CHAI-OVERRIDES DIRECTLY
    ## OR GO THROUGH I18N

    cy.ensureExistence($el)

  ensureDescendents = ($el1, $el2, onFail) ->
    cmd = state("current").get("name")

    if not $dom.isDescendent($el1, $el2)
      if $el2
        element1 = $dom.stringify($el1)
        element2 = $dom.stringify($el2)
        $utils.throwErrByPath("dom.covered", {
          onFail
          args: { cmd, element1, element2 }
        })
      else
        node = $dom.stringify($el1)
        $utils.throwErrByPath("dom.center_hidden", {
          onFail
          args: { cmd, node }
        })

  ensureValidPosition = (position, log) ->
    ## make sure its valid first!
    if position in VALID_POSITIONS
      return true

    $utils.throwErrByPath("dom.invalid_position_argument", {
      onFail: log
      args: {
        position,
        validPositions: VALID_POSITIONS.join(', ')
      }
    })

  ensureScrollability = ($el, cmd) ->
    return true if $dom.isScrollable($el)

    ## prep args to throw in error since we can't scroll
    cmd   ?= state("current").get("name")
    node  = $dom.stringify($el)

    $utils.throwErrByPath("dom.not_scrollable", {
      args: { cmd, node }
    })

  return {
    ensureSubjectByType

    ensureElement

    ensureAttached

    ensureRunnable

    ensureWindow

    ensureDocument

    ensureElementIsNotAnimating

    ensureReceivability

    ensureVisibility

    ensureExistence

    ensureElExistence

    ensureDescendents

    ensureValidPosition

    ensureScrollability
  }

module.exports = {
  create
}
