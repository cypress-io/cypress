utils = require("../../../utils")

delay = 50

focusable = "a[href],link[href],button,input,select,textarea,[tabindex],[contenteditable]"

dispatchPrimedChangeEvents = ->
  ## if we have a changeEvent, dispatch it
  if changeEvent = @state("changeEvent")
    changeEvent.call(@)

getCoords = (cy, $el, options) -> (scrollIntoView = true, coordsHistory = []) ->
  retry = ->
    getCoords(cy, $el, options)(scrollIntoView, coordsHistory)

  ## use native scrollIntoView here so scrollable
  ## containers are automatically handled correctly

  ## its possible the center of the element actually isnt
  ## in view yet so we probably need to factor that in
  ## and scrollBy the amount of distance between the center
  ## and the left of the element so it positions the center
  ## in the viewport
  $el.get(0).scrollIntoView() if scrollIntoView

  if options.force isnt true
    try
      cy.ensureVisibility($el, options._log)
      cy.ensureActionability($el, options._log)
    catch err
      options.error = err
      return cy._retry(retry, options)

  waitForAnimations(cy, $el, options, coordsHistory)

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

waitForAnimations = (cy, $el, options, coordsHistory = []) ->
  ## determine if this element is animating
  if options.x and options.y
    coords = cy.getRelativeCoordinates($el, options.x, options.y)
  else
    try
      coords = cy.getCoordinates($el, options.position)
    catch err
      utils.throwErr(err, { onFail: options._log })

  ## if we're forcing this click event
  ## just immediately send it up
  if options.force is true or options.waitForAnimations is false
    return Promise.resolve(coords)
  else
    ## verify that our element is not currently animating
    ## by verifying it is still at the same coordinates within
    ## 5 pixels of x/y?
    coordsHistory.push(coords)

    retry = =>
      waitForAnimations(cy, $el, options, coordsHistory)

    ## if we dont have at least 2 points
    ## then automatically retry
    if coordsHistory.length < 2
      ## silence the first trigger so we dont
      ## actually fire the 'retry' event
      opts = _.chain(options).clone().extend({silent: true}).value()
      return cy._retry(retry, opts)

    ## make sure our element is not currently animating
    try
      cy.ensureElementIsNotAnimating($el, coordsHistory, options.animationDistanceThreshold)
      Promise.resolve(coords)
    catch err
      options.error = err
      cy._retry(retry, options)

module.exports = {
  delay
  dispatchPrimedChangeEvents
  focusable
  getCoords
  getPositionFromArguments
  waitForAnimations
}
