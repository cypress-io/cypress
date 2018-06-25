_ = require("lodash")
$ = require("jquery")
Promise = require("bluebird")

$dom = require("../dom")
$utils = require("../cypress/utils")

delay = 50

getFixedOrStickyEl = $dom.getFirstFixedOrStickyPositionParent
getStickyEl = $dom.getFirstStickyPositionParent

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

ensureElIsNotCovered = (cy, win, $el, fromViewport, options, log, onScroll) ->
  $elAtCoords = null

  getElementAtPointFromViewport = (fromViewport) ->
    ## get the element at point from the viewport based
    ## on the desired x/y normalized coordinations
    if elAtCoords = $dom.getElementAtPointFromViewport(win.document, fromViewport.x, fromViewport.y)
      $elAtCoords = $dom.wrap(elAtCoords)

  ensureDescendents = (fromViewport) ->
    ## figure out the deepest element we are about to interact
    ## with at these coordinates
    $elAtCoords = getElementAtPointFromViewport(fromViewport)

    cy.ensureDescendents($el, $elAtCoords, log)

    return $elAtCoords

  ensureDescendentsAndScroll = ->
    try
      ## use the initial coords fromViewport
      ensureDescendents(fromViewport)
    catch err
      ## if we're being covered by a fixed position element then
      ## we're going to attempt to continously scroll the element
      ## from underneath this fixed position element until we can't
      ## anymore
      $fixed = getFixedOrStickyEl($elAtCoords)

      ## if we dont have a fixed position
      ## then just bail, cuz we need to retry async
      if not $fixed
        throw err

      scrollContainerPastElement = ($container, $fixed) ->
        ## get the width + height of the $fixed
        ## since this is what we are scrolling past!
        { width, height } = $dom.getElementPositioning($fixed)

        ## what is this container currently scrolled?
        ## using jquery here which normalizes window scroll props
        currentScrollTop = $container.scrollTop()
        currentScrollLeft = $container.scrollLeft()

        if onScroll
          type = if $dom.isWindow($container) then "window" else "container"
          onScroll($container, type)

        ## TODO: right here we could set all of the scrollable
        ## containers on the log and include their scroll
        ## positions.
        ##
        ## then the runner could ask the driver to scroll each one
        ## into its correct position until it passed
        # if $dom.isWindow($container)
        #   log.set("scrollBy", { x: -width, y: -height })

        ## we want to scroll in the opposite direction (up not down)
        ## so just decrease the scrolled positions
        $container.scrollTop((currentScrollTop - height))
        $container.scrollLeft((currentScrollLeft - width))

      getAllScrollables = (scrollables, $el) ->
        ## nudge algorithm
        ## starting at the element itself
        ## walk up until and find all of the scrollable containers
        ## until we reach null
        ## then push in the window
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
        ## hold onto all the elements we've scrolled
        ## past in this cycle
        elementsScrolledPast = []

        ## pull off scrollables starting with the most outer
        ## container which is window
        $scrollableContainer = scrollables.pop()

        ## we've reach the end of all the scrollables
        if not $scrollableContainer
          ## bail and just retry async
          throw err

        possiblyScrollMultipleTimes = ($fixed) ->
          ## if we got something AND
          if $fixed and ($fixed.get(0) not in elementsScrolledPast)
            elementsScrolledPast.push($fixed.get(0))

            scrollContainerPastElement($scrollableContainer, $fixed)

            try
              ## now that we've changed scroll positions
              ## we must recalculate whether this element is covered
              ## since the element's top / left positions change.
              fromViewport = getCoordinatesForEl(cy, $el, options).fromViewport

              ## this is a relative calculation based on the viewport
              ## so these are the only coordinates we care about
              ensureDescendents(fromViewport)
            catch err
              ## we failed here, but before scrolling the next container
              ## we need to first verify that the element covering up
              ## is the same one as before our scroll
              if $elAtCoords = getElementAtPointFromViewport(fromViewport)
                ## get the fixed element again
                $fixed = getFixedOrStickyEl($elAtCoords)

                ## and possibly recursively scroll past it
                ## if we haven't see it before
                possiblyScrollMultipleTimes($fixed)
          else
            scrollContainers(scrollables)

        possiblyScrollMultipleTimes($fixed)

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
        obj["Tried to Click"]     = $dom.getElements($el)
        obj["But its Covered By"] = $dom.getElements($elAtCoords)
        obj

    throw err

  ## return the final $elAtCoords
  return $elAtCoords

getCoordinatesForEl = (cy, $el, options) ->
  ## determine if this element is animating
  if options.x and options.y
    $dom.getElementCoordinatesByPositionRelativeToXY($el, options.x, options.y)
  else
    # Cypress.dom.getElementCoordinatesByPosition($el, options.position)
    $dom.getElementCoordinatesByPosition($el, options.position)

ensureNotAnimating = (cy, $el, coordsHistory, animationDistanceThreshold) ->
  ## if we dont have at least 2 points
  ## then automatically retry
  if coordsHistory.length < 2
    throw new Error("coordsHistory must be at least 2 sets of coords")

  ## verify that our element is not currently animating
  ## by verifying it is still at the same coordinates within
  ## 5 pixels of x/y
  cy.ensureElementIsNotAnimating($el, coordsHistory, animationDistanceThreshold)

verify = (cy, $el, options, callbacks) ->
  win = $dom.getWindowByElement($el.get(0))

  { _log, force, position } = options

  { onReady, onScroll } = callbacks

  if not onReady
    throw new Error("actionability.verify must be passed an onReady callback")

  ## if we have a position we must validate
  ## this ahead of time else bail early
  if position
    try
      cy.ensureValidPosition(position, _log)
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

      ## now go get all the coords for this element
      coords = getCoordinatesForEl(cy, $el, options)

      ## if force is true OR waitForAnimations is false
      ## then do not perform these additional ensures...
      if (force isnt true) and (options.waitForAnimations isnt false)
        ## store the coords that were absolute
        ## from the window or from the viewport for sticky elements 
        ## (see https://github.com/cypress-io/cypress/pull/1478)

        sticky = !!getStickyEl($el)
        coordsHistory.push(if sticky then coords.fromViewport else coords.fromWindow)

        ## then we ensure the element isnt animating
        ensureNotAnimating(cy, $el, coordsHistory, options.animationDistanceThreshold)

        ## now that we know our element isn't animating its time
        ## to figure out if its being covered by another element.
        ## this calculation is relative from the viewport so we
        ## only care about fromViewport coords
        $elAtCoords = ensureElIsNotCovered(cy, win, $el, coords.fromViewport, options, _log, onScroll)

      ## pass our final object into onReady
      return onReady($elAtCoords ? $el, coords)

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
  verify
  dispatchPrimedChangeEvents
  getPositionFromArguments
}
