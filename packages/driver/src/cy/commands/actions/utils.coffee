_ = require("lodash")
$ = require("jquery")
Promise = require("bluebird")

$dom = require("../../../cypress/dom")
$utils = require("../../../cypress/utils")

delay = 50

focusable = "a[href],link[href],button,input,select,textarea,[tabindex],[contenteditable]"

dispatchPrimedChangeEvents = (state) ->
  ## if we have a changeEvent, dispatch it
  if changeEvent = state("changeEvent")
    changeEvent()

getPositionFromArguments = (positionOrX, y, options) ->
  switch
    when _.isObject(positionOrX)
      options = positionOrX
      position = null

    when _.isObject(y)
      options = y
      position = positionOrX
      y = null
      x = null

    when _.every [positionOrX, y], _.isFinite
      position = null
      x = positionOrX

    when _.isString(positionOrX)
      position = positionOrX

  return {options, position, x, y}

ensureElIsNotCovered = (cy, win, $el, coords, options, log, onScroll) ->
  $elForAction = null

  ensureDescendents = (coords) ->
    ## figure out the deepest element we are about to interact
    ## with at these coordinates
    $elForAction = cy.getElementAtCoordinates(coords.x, coords.y)

    cy.ensureDescendents($el, $elForAction, log)

    return $elForAction

  ensureDescendentsAndScroll = ->
    try
      ## use the initial coords
      ensureDescendents(coords)
    catch err
      ## if we're being covered by a fixed position element then
      ## we're going to attempt to continously scroll the element
      ## from underneath this fixed position element until we can't
      ## anymore
      $fixed = $dom.getFirstFixedPositionParent($elForAction)

      ## if we dont have a fixed position
      ## then just bail, cuz we need to retry async
      if not $fixed
        throw err

      ## get the width + height of the $elForAction
      ## since this is what we are scrolling past!
      { width, height } = $dom.positionProps($fixed)

      ## nudge algorithm
      ## starting at the element itself
      ## walk up until and find all of the scrollable containers
      ## until we reach null
      ## then push in the window

      getAllScrollables = (scrollables, $el) ->
        $scrollableContainer = $dom.getFirstScrollableParent($el)

        if $scrollableContainer
          scrollables.push($scrollableContainer)

          ## recursively iterate
          return getAllScrollables(scrollables, $scrollableContainer)
        else
          ## we're out of scrollable elements
          ## so just push in $(win)
          scrollables.push($(win))

        return scrollables

      ## we want to scroll all of our containers until
      ## this element becomes unhidden or retry async
      scrollContainers = (scrollables) ->
        ## pull off scrollables starting with the most outer
        ## container which is window
        $scrollableContainer = scrollables.pop()

        ## we've reach the end of all the scrollables
        if not $scrollableContainer
          ## bail and just retry async
          throw err

        ## what is this container currently scrolled?
        ## using jquery here which normalizes window scroll props
        currentScrollTop = $scrollableContainer.scrollTop()
        currentScrollLeft = $scrollableContainer.scrollLeft()

        if onScroll
          type = if $utils.hasWindow($scrollableContainer) then "window" else "container"
          onScroll($scrollableContainer, type)

        ## TODO: right here we could set all of the scrollable
        ## containers on the log and include their scroll
        ## positions.
        ##
        ## then the runner could ask the driver to scroll each one
        ## into its correct position until it passed
        # if $utils.hasWindow($scrollableContainer)
        #   log.set("scrollBy", { x: -width, y: -height })

        ## we want to scroll in the opposite direction (up not down)
        ## so just decrease the scrolled positions
        $scrollableContainer.scrollTop((currentScrollTop - height))
        $scrollableContainer.scrollLeft((currentScrollLeft - width))

        try
          ## now that we've changed scroll positions
          ## we must recalculate whether this element is covered
          ## since the element's top / left positions change
          coords = getCoordinatesForEl(cy, $el, options)

          ensureDescendents(coords)
        catch err
          scrollContainers(scrollables)

      ## start nudging
      scrollContainers(
        getAllScrollables([], $el)
      )
  try
    ensureDescendentsAndScroll()
  catch err
    if log
      log.set consoleProps: ->
        obj = {}
        obj["Tried to Click"]     = $utils.getDomElements($el)
        obj["But its Covered By"] = $utils.getDomElements($elForAction)
        obj

    throw err

  ## return the final $elForAction
  return $elForAction

getCoordinatesForEl = (cy, $el, options) ->
  ## determine if this element is animating
  if options.x and options.y
    cy.getAbsoluteCoordinatesRelativeToXYRelativeToXY($el, options.x, options.y)
  else
    cy.getAbsoluteCoordinates($el, options.position)

ensureNotAnimating = (cy, $el, coordsHistory, animationDistanceThreshold) ->
  ## if we dont have at least 2 points
  ## then automatically retry
  if coordsHistory.length < 2
    throw new Error("coordsHistory must be at least 2 sets of coords")

  ## verify that our element is not currently animating
  ## by verifying it is still at the same coordinates within
  ## 5 pixels of x/y
  cy.ensureElementIsNotAnimating($el, coordsHistory, animationDistanceThreshold)

waitForActionability = (cy, $el, win, options, callbacks) ->
  { _log, force, position } = options

  { onReady, onScroll } = callbacks

  if not onReady
    throw new Error("waitForActionability must be passed an onReady callback")

  ## if we have a position we must validate
  ## this ahead of time else bail early
  if position
    try
      cy.ensureValidPosition(position)
    catch err
      ## cannot proceed, give up
      return Promise.reject(err)

  Promise.try ->
    coordsHistory = []

    runAllChecks = ->
      if force isnt true
        ## scroll the element into view
        $el.get(0).scrollIntoView()

        if onScroll
          onScroll($el, "element")

        ## ensure its visible
        cy.ensureVisibility($el, _log)

        ## ensure its 'receivable'
        cy.ensureReceivability($el, _log)

      ## now go get the coords
      coords = getCoordinatesForEl(cy, $el, options)

      ## if force is true OR waitForAnimations is false
      ## then do not perform these additional ensures...
      if (force isnt true) and (options.waitForAnimations isnt false)
        ## store the coords
        coordsHistory.push(coords)

        ## then we ensure the element isnt animating
        ensureNotAnimating(cy, $el, coordsHistory, options.animationDistanceThreshold)

        ## figures out the element and coordinates and ensures
        ## this is a descendent
        $elForAction = ensureElIsNotCovered(cy, win, $el, coords, options, _log, onScroll)

      ## pass our final object into onReady
      return onReady($elForAction ? $el, coords)

    ## we cannot enforce async promises here because if our
    ## element passes every single check, we MUST fire the event
    ## synchronously else we risk the state changing between
    ## the checks and firing the event!
    do retryActionability = ->
      try
        runAllChecks()
      catch err
        options.error = err
        cy.retry(retryActionability, options)

module.exports = {
  delay
  dispatchPrimedChangeEvents
  focusable
  # getCoords
  getPositionFromArguments
  # waitForAnimations
  waitForActionability
}
