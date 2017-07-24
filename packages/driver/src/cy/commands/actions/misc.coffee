_ = require("lodash")
Promise = require("bluebird")

$Log = require("../../../cypress/log")
{ getCoords, getPositionFromArguments } = require("./utils")
$utils = require("../../../cypress/utils")

module.exports = (Commands, Cypress, cy, state, config) ->
  Commands.addAll({ prevSubject: "dom" }, {
    hover: (args) ->
      $utils.throwErrByPath("hover.not_implemented")

    trigger: (subject, eventName, positionOrX, y, options = {}) ->
      {options, position, x, y} = getPositionFromArguments(positionOrX, y, options)

      _.defaults options,
        log: true
        $el: subject
        bubbles: true
        cancelable: true
        position: position
        x: x
        y: y

      ## omit entries we know aren't part of an event, but pass anything
      ## else through so user can specify what the event object needs
      eventOptions = _.omit(options, "log", "$el", "position", "x", "y")

      if options.log
        options._log = Cypress.log
          $el: subject
          consoleProps: ->
            {
              "Yielded": subject
              "Event options": eventOptions
            }

        options._log.snapshot("before", {next: "after"})

      cy.ensureDom(options.$el)

      if not _.isString(eventName)
        $utils.throwErrByPath("trigger.invalid_argument", {
          onFail: options._log
          args: { eventName }
        })

      if options.$el.length > 1
        $utils.throwErrByPath("trigger.multiple_elements", {
          onFail: options._log
          args: { num: options.$el.length }
        })

      win = state("window")
      $el = options.$el.first()
      el = $el.get(0)

      trigger = (coords) =>
        if options._log
          ## display the red dot at these coords
          options._log.set({coords: coords})

        eventOptions = _.extend({
          clientX: $utils.getClientX(coords, win)
          clientY: $utils.getClientY(coords, win)
          pageX: coords.x
          pageY: coords.y
        }, eventOptions)

        event = new Event(eventName, eventOptions)

        ## some options, like clientX & clientY, must be set on the
        ## instance instead of passing them into the constructor
        _.extend(event, eventOptions)

        el.dispatchEvent(event)

      Promise
      .try(getCoords(@, $el, options))
      .then(trigger)
      .then =>
        do verifyAssertions = =>
          cy.verifyUpcomingAssertions(subject, options, {
            onRetry: verifyAssertions
          })
  })
