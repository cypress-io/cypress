_ = require("lodash")
Promise = require("bluebird")

$dom = require("../../../dom")
$elements = require("../../../dom/elements")
$window = require("../../../dom/window")
$utils = require("../../../cypress/utils")
$errUtils = require("../../../cypress/error_utils")
$actionability = require("../../actionability")

dispatch = (target, eventName, options) ->
  event = new Event(eventName, options)

  ## some options, like clientX & clientY, must be set on the
  ## instance instead of passing them into the constructor
  _.extend(event, options)

  target.dispatchEvent(event)

module.exports = (Commands, Cypress, cy, state, config) ->
  Commands.addAll({ prevSubject: ["element", "window", "document"] }, {
    trigger: (subject, eventName, positionOrX, y, options = {}) ->
      {options, position, x, y} = $actionability.getPositionFromArguments(positionOrX, y, options)

      _.defaults(options, {
        log: true
        $el: subject
        bubbles: true
        cancelable: true
        position: position
        x: x
        y: y
        waitForAnimations: config("waitForAnimations")
        animationDistanceThreshold: config("animationDistanceThreshold")
      })

      if $dom.isWindow(options.$el)
        ## get this into a jquery object
        options.$el = $dom.wrap(options.$el)


      ## omit entries we know aren't part of an event, but pass anything
      ## else through so user can specify what the event object needs
      eventOptions = _.omit(options, "log", "$el", "position", "x", "y", "waitForAnimations", "animationDistanceThreshold")

      if options.log
        options._log = Cypress.log({
          $el: subject
          consoleProps: ->
            {
              "Yielded": subject
              "Event options": eventOptions
            }
        })

        options._log.snapshot("before", {next: "after"})

      if not _.isString(eventName)
        $errUtils.throwErrByPath("trigger.invalid_argument", {
          onFail: options._log
          args: { eventName }
        })

      if options.$el.length > 1
        $errUtils.throwErrByPath("trigger.multiple_elements", {
          onFail: options._log
          args: { num: options.$el.length }
        })

      dispatchEarly = false

      ## if we're window or document then dispatch early
      ## and avoid waiting for actionability
      if $dom.isWindow(subject) or $dom.isDocument(subject)
        dispatchEarly = true
      else
        subject = options.$el.first()

      trigger = ->
        if dispatchEarly
          return dispatch(subject, eventName, eventOptions)

        $actionability.verify(cy, subject, options, {
          onScroll: ($el, type) ->
            Cypress.action("cy:scrolled", $el, type)

          onReady: ($elToClick, coords) ->
            { fromElWindow, fromElViewport, fromAutWindow } = coords

            if options._log
              ## display the red dot at these coords
              options._log.set({
                coords: fromAutWindow
              })

            eventOptions = _.extend({
              clientX: fromElViewport.x
              clientY: fromElViewport.y
              screenX: fromElViewport.x
              screenY: fromElViewport.y
              pageX: fromElWindow.x
              pageY: fromElWindow.y
            }, eventOptions)

            dispatch($elToClick.get(0), eventName, eventOptions)
      })

      Promise
      .try(trigger)
      .then ->
        do verifyAssertions = ->
          cy.verifyUpcomingAssertions(subject, options, {
            onRetry: verifyAssertions
          })
  })
