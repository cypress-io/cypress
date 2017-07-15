_ = require("lodash")
$dom = require("../cypress/dom")
$utils = require("../cypress/utils")

commandOptions = ["exist", "exists", "visible", "length"]
VALID_POSITIONS = ["topLeft", "top", "topRight", "left", "center", "right", "bottomLeft", "bottom", "bottomRight"]

returnFalse = -> return false

create = (state, config, expect, isInDom) ->
  ensureSubject = ->
    subject = state("subject")

    if not subject?
      cmd = state("current").get("name")
      $utils.throwErrByPath("miscellaneous.no_subject", {
        args: { subject, cmd }
      })

    return subject

  ensureParent = ->
    current = state("current")

    if not current.get("prev")
      $utils.throwErrByPath("miscellaneous.orphan", {
        args: { cmd: current.get("name") }
      })

  ensureElementIsNotAnimating = ($el, coords = [], threshold) ->
    waitForAnimations = config("waitForAnimations")

    ## bail if we have disabled waiting on animations
    return if waitForAnimations is false

    threshold ?= config("animationDistanceThreshold")

    lastTwo = coords.slice(-2)

    ## bail if we dont yet have two points
    if lastTwo.length isnt 2
      $utils.throwErrByPath("dom.animation_check_failed")

    [point1, point2] = lastTwo

    distance = ->
      deltaX = point1.x - point2.x
      deltaY = point1.y - point2.y

      Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    ## verify that there is not a distance
    ## greater than a default of '5' between
    ## the points
    if distance() > threshold
      cmd  = state("current").get("name")
      node = $utils.stringifyElement($el)
      $utils.throwErrByPath("dom.animating", {
        args: { cmd, node }
      })

  ensureActionability = (subject, onFail) ->
    subject ?= @ensureSubject()

    cmd = state("current").get("name")

    if subject.prop("disabled")
      node = $utils.stringifyElement(subject)

      $utils.throwErrByPath("dom.disabled", {
        onFail
        args: { cmd, node }
      })

  ensureVisibility = (subject, onFail) ->
    subject ?= @ensureSubject()

    cmd = state("current").get("name")

    if not (subject.length is subject.filter(":visible").length)
      reason = $dom.getReasonElIsHidden(subject)
      node   = $utils.stringifyElement(subject)
      $utils.throwErrByPath("dom.not_visible", {
        onFail
        args: { cmd, node, reason }
      })

  ensureDom = (subject, cmd, log) ->
    subject ?= @ensureSubject()

    cmd ?= state("current").get("name")

    isWindow = $utils.hasWindow(subject)

    ## think about dropping the 'cmd' part
    ## and adding exactly what the subject is
    ## if its an object or array, just say Object or Array
    ## but if its a primitive, just print out its value like
    ## true, false, 0, 1, 3, "foo", "bar"
    if not $utils.hasDom(subject)
      $utils.throwErrByPath("dom.non_dom", {
        onFail: log
        args: { cmd }
      })

    if not (isWindow or isInDom(subject))
      node = $utils.stringifyElement(subject)
      $utils.throwErrByPath("dom.detached", {
        onFail: log
        args: { cmd, node }
      })

    return subject

  ensureExistence = (subject) ->
    returnFalse = =>
      cleanup()

      return false

    cleanup = =>
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
    # return if not $utils.isInstanceOf($el, $)

    ## ensure that we either had some assertions
    ## or that the element existed
    return if $el and $el.length

    ## TODO: REFACTOR THIS TO CALL THE CHAI-OVERRIDES DIRECTLY
    ## OR GO THROUGH I18N

    @ensureExistence($el)

  ensureDescendents = ($el1, $el2, onFail) ->
    cmd = state("current").get("name")

    if not $utils.isDescendent($el1, $el2)
      if $el2
        element1 = $utils.stringifyElement($el1)
        element2 = $utils.stringifyElement($el2)
        $utils.throwErrByPath("dom.covered", {
          onFail
          args: { cmd, element1, element2 }
        })
      else
        node = $utils.stringifyElement($el1)
        $utils.throwErrByPath("dom.center_hidden", {
          onFail
          args: { cmd, node }
        })

  ensureValidPosition = (position) ->
    ## make sure its valid first!
    if position in VALID_POSITIONS
      return true

    $utils.throwErrByPath("dom.invalid_position_argument", {
      args: { position, validPositions: VALID_POSITIONS.join(', ') }
    })

  ensureScrollability = ($el, cmd) ->
    return true if $dom.elIsScrollable($el)

    ## prep args to throw in error since we can't scroll
    cmd   ?= state("current").get("name")
    node  = $utils.stringifyElement($el)

    $utils.throwErrByPath("dom.not_scrollable", {
      args: { cmd, node }
    })

  return {
    ensureSubject

    ensureParent

    ensureElementIsNotAnimating

    ensureActionability

    ensureVisibility

    ensureDom

    ensureExistence

    ensureElExistence

    ensureDescendents

    ensureValidPosition

    ensureScrollability
  }

module.exports = {
  create
}
