_ = require("lodash")
$ = require("jquery")
Promise = require("bluebird")

$Mouse = require("../../../cypress/mouse")

$dom = require("../../../dom")
$utils = require("../../../cypress/utils")
$actionability = require("../../actionability")

module.exports = (Commands, Cypress, cy, state, config) ->
  Commands.addAll({ prevSubject: "element" }, {
    click: (subject, positionOrX, y, options = {}) ->
      ## TODO handle pointer-events: none
      ## http://caniuse.com/#feat=pointer-events

      {options, position, x, y} = $actionability.getPositionFromArguments(positionOrX, y, options)

      _.defaults(options, {
        $el: subject
        log: true
        verify: true
        force: false
        multiple: false
        position: position
        x: x
        y: y
        errorOnSelect: true
        waitForAnimations: config("waitForAnimations")
        animationDistanceThreshold: config("animationDistanceThreshold")
      })

      ## throw if we're trying to click multiple elements
      ## and we did not pass the multiple flag
      if options.multiple is false and options.$el.length > 1
        $utils.throwErrByPath("click.multiple_elements", {
          args: { num: options.$el.length }
        })

      win = state("window")

      click = (el, index) =>
        $el = $(el)

        domEvents = {}
        $previouslyFocusedEl = null

        if options.log
          ## figure out the options which actually change the behavior of clicks
          deltaOptions = $utils.filterOutOptions(options)

          options._log = Cypress.log({
            message: deltaOptions
            $el: $el
          })

          options._log.snapshot("before", {next: "after"})

        if options.errorOnSelect and $el.is("select")
          $utils.throwErrByPath "click.on_select_element", { onFail: options._log }

        ## in order to simulate actual user behavior we need to do the following:
        ## 1. take our element and figure out its center coordinate
        ## 2. check to figure out the element listed at those coordinates
        ## 3. if this element is ourself or our descendants, click whatever was returned
        ## 4. else throw an error because something is covering us up
        getFirstFocusableEl = ($el) ->
          return $el if $dom.isFocusable($el)

          parent = $el.parent()

          ## if we have no parent then just return
          ## the window since that can receive focus
          return $(win) if not parent.length

          getFirstFocusableEl($el.parent())

        afterMouseDown = ($elToClick, coords) ->
          ## we need to use both of these
          { fromWindow, fromViewport } = coords

          ## handle mouse events removing DOM elements
          ## https://www.w3.org/TR/uievents/#event-type-click (scroll up slightly)

          if $dom.isAttached($elToClick)
            domEvents.mouseUp = $Mouse.mouseUp($elToClick, fromViewport)

          if $dom.isAttached($elToClick)
            domEvents.click   = $Mouse.click($elToClick, fromViewport)

          if options._log
            consoleObj = options._log.invoke("consoleProps")

          consoleProps = ->
            consoleObj = _.defaults consoleObj ? {}, {
              "Applied To":   $dom.getElements($el)
              "Elements":     $el.length
              "Coords":       _.pick(fromWindow, "x", "y") ## always absolute
              "Options":      deltaOptions
            }

            if $el.get(0) isnt $elToClick.get(0)
              ## only do this if $elToClick isnt $el
              consoleObj["Actual Element Clicked"] = $dom.getElements($elToClick)

            consoleObj.groups = ->
              groups = [{
                name: "MouseDown"
                items: _.pick(domEvents.mouseDown, "preventedDefault", "stoppedPropagation", "modifiers")
              }]

              if domEvents.mouseUp
                groups.push({
                  name: "MouseUp"
                  items: _.pick(domEvents.mouseUp, "preventedDefault", "stoppedPropagation", "modifiers")
                })

              if domEvents.click
                groups.push({
                  name: "Click"
                  items: _.pick(domEvents.click, "preventedDefault", "stoppedPropagation", "modifiers")
                })

              return groups

            consoleObj

          return Promise
          .delay($actionability.delay, "click")
          .then ->
            ## display the red dot at these coords
            if options._log
              ## because we snapshot and output a command per click
              ## we need to manually snapshot + end them
              options._log.set({coords: fromWindow, consoleProps: consoleProps})

            ## we need to split this up because we want the coordinates
            ## to mutate our passed in options._log but we dont necessary
            ## want to snapshot and end our command if we're a different
            ## action like (cy.type) and we're borrowing the click action
            if options._log and options.log
              options._log.snapshot().end()
          ## need to return null here to prevent
          ## chaining thenable promises
          .return(null)

        shouldFireFocusEvent = ($focused, $elToFocus) ->
          ## if we dont have a focused element
          ## we know we want to fire a focus event
          return true if not $focused

          ## if we didnt have a previously focused el
          ## then always return true
          return true if not $previouslyFocusedEl

          ## if we are attemping to focus a differnet element
          ## than the one we currently have, we know we want
          ## to fire a focus event
          return true if $focused.get(0) isnt $elToFocus.get(0)

          ## if our focused element isnt the same as the previously
          ## focused el then what probably happened is our mouse
          ## down event caused our element to receive focuse
          ## without the browser sending the focus event
          ## which happens when the window isnt in focus
          return true if $previouslyFocusedEl.get(0) isnt $focused.get(0)

          return false

        ## we want to add this delay delta to our
        ## runnables timeout so we prevent it from
        ## timing out from multiple clicks
        cy.timeout($actionability.delay, true, "click")

        ## must use callbacks here instead of .then()
        ## because we're issuing the clicks synchonrously
        ## once we establish the coordinates and the element
        ## passes all of the internal checks
        $actionability.verify(cy, $el, options, {
          onScroll: ($el, type) ->
            Cypress.action("cy:scrolled", $el, type)

          onReady: ($elToClick, coords) ->
            ## TODO: get focused through a callback here
            $focused = cy.getFocused()
            
            ## record the previously focused element before
            ## issuing the mousedown because browsers may
            ## automatically shift the focus to the element
            ## without firing the focus event
            $previouslyFocusedEl = $focused

            domEvents.mouseDown = $Mouse.mouseDown($elToClick, coords.fromViewport)

            ## if mousedown was cancelled then or caused
            ## our element to be removed from the DOM
            ## just resolve after mouse down and dont
            ## send a focus event
            if domEvents.mouseDown.preventedDefault or not $dom.isAttached($elToClick)
              afterMouseDown($elToClick, coords)
            else
              ## retrieve the first focusable $el in our parent chain
              $elToFocus = getFirstFocusableEl($elToClick)

              $focused = cy.getFocused()
              
              if shouldFireFocusEvent($focused, $elToFocus)
                ## if our mousedown went through and
                ## we are focusing a different element
                ## dispatch any primed change events
                ## we have to do this because our blur
                ## method might not get triggered if
                ## our window is in focus since the
                ## browser may fire blur events naturally
                $actionability.dispatchPrimedChangeEvents(state)

                ## send in a focus event!
                cy.now("focus", $elToFocus, {$el: $elToFocus, error: false, verify: false, log: false})
                .then ->
                  afterMouseDown($elToClick, coords)
              else
                afterMouseDown($elToClick, coords)
        })
        .catch (err) ->
          ## snapshot only on click failure
          err.onFail = ->
            if options._log
              options._log.snapshot()

          ## if we give up on waiting for actionability then
          ## lets throw this error and log the command
          $utils.throwErr(err, { onFail: options._log })

      Promise
      .each(options.$el.toArray(), click)
      .then =>
        return options.$el if options.verify is false

        do verifyAssertions = =>
          cy.verifyUpcomingAssertions(options.$el, options, {
            onRetry: verifyAssertions
          })

    ## update dblclick to use the click
    ## logic and just swap out the event details?
    dblclick: (subject, options = {}) ->
      _.defaults options,
        log: true

      dblclicks = []

      dblclick = (el, index) =>
        $el = $(el)

        ## we want to add this delay delta to our
        ## runnables timeout so we prevent it from
        ## timing out from multiple clicks
        cy.timeout($actionability.delay, true, "dblclick")

        if options.log
          log = Cypress.log
            $el: $el
            consoleProps: ->
              "Applied To":   $dom.getElements($el)
              "Elements":     $el.length

        cy.ensureVisibility($el, log)

        p = cy.now("focus", $el, {$el: $el, error: false, verify: false, log: false}).then =>
          event = new MouseEvent "dblclick", {
            bubbles: true
            cancelable: true
          }

          el.dispatchEvent(event)

          # $el.cySimulate("dblclick")

          # log.snapshot() if log

          ## need to return null here to prevent
          ## chaining thenable promises
          return null

        .delay($actionability.delay, "dblclick")

        dblclicks.push(p)

        return p

      ## create a new promise and chain off of it using reduce to insert
      ## the artificial delays.  we have to set this as cancellable for it
      ## to propogate since this is an "inner" promise

      ## return our original subject when our promise resolves
      Promise
      .resolve(subject.toArray())
      .each(dblclick)
      .return(subject)
  })
