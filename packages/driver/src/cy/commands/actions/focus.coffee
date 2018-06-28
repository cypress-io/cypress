_ = require("lodash")
Promise = require("bluebird")

$dom = require("../../../dom")
$utils = require("../../../cypress/utils")
$actionability = require("../../actionability")

module.exports = (Commands, Cypress, cy, state, config) ->
  Commands.addAll({ prevSubject: ["element", "window"] }, {
    focus: (subject, options = {}) ->
      ## we should throw errors by default!
      ## but allow them to be silenced
      _.defaults(options, {
        $el: subject
        error: true
        log: true
        verify: true
      })

      if isWin = $dom.isWindow(options.$el)
        ## get this into a jquery object
        options.$el = $dom.wrap(options.$el)

      if options.log
        options._log = Cypress.log
          $el: options.$el
          consoleProps: ->
            "Applied To": $dom.getElements(options.$el)

      ## http://www.w3.org/TR/html5/editing.html#specially-focusable
      ## ensure there is only 1 dom element in the subject
      ## make sure its allowed to be focusable
      if not (isWin or $dom.isFocusable(options.$el))
        return if options.error is false

        node = $dom.stringify(options.$el)
        $utils.throwErrByPath("focus.invalid_element", {
          onFail: options._log
          args: { node }
        })

      if (num = options.$el.length) and num > 1
        return if options.error is false

        $utils.throwErrByPath("focus.multiple_elements", {
          onFail: options._log
          args: { num }
        })

      timeout = cy.timeout() * .90

      cleanup = null
      hasFocused = false

      promise = new Promise (resolve, reject) ->
        ## we need to bind to the focus event here
        ## because some browsers will not ever fire
        ## the focus event if the window itself is not
        ## currently focused. so we have to tell our users
        ## to do just that!
        cleanup = ->
          options.$el.off("focus", focused)

        focused = ->
          hasFocused = true
          
          cleanup()

          cy.timeout($actionability.delay, true)

          ## TODO: this is really weird how we're
          ## resolving the promise here but letting
          ## the lower promise also still run
          Promise
          .delay($actionability.delay)
          .then(resolve)

        options.$el.on("focus", focused)

        ## store the currently focused item
        ## for later use if necessary to simulate events
        $focused = cy.getFocused()
        
        ## does this synchronously fire?
        ## if it does we don't need this
        ## lower promise
        options.$el.get(0).focus()

        Promise
        .resolve(null)
        .then ->
          ## fallback if our focus event never fires
          ## to simulate the focus + focusin
          return if hasFocused

          simulate = ->
            win = cy.state("window")

            ## todo handle relatedTarget's per the spec
            focusinEvt = new FocusEvent "focusin", {
              bubbles: true
              view: win
              relatedTarget: null
            }

            focusEvt = new FocusEvent "focus", {
              view: win
              relatedTarget: null
            }

            ## not fired in the correct order per w3c spec
            ## because chrome chooses to fire focus before focusin
            ## and since we have a simulation fallback we end up
            ## doing it how chrome does it
            ## http://www.w3.org/TR/DOM-Level-3-Events/#h-events-focusevent-event-order
            options.$el.get(0).dispatchEvent(focusEvt)
            options.$el.get(0).dispatchEvent(focusinEvt)

          ## only blur if we have a focused element AND its not
          ## currently ourselves!
          if $focused and $focused.get(0) isnt options.$el.get(0)
            ## TODO: oh god... so bad, please fixme
            cy.now("blur", $focused, {
              $focused
              $el: $focused,
              error: false,
              verify: false,
              log: false
            })
            .then ->
              simulate()
          else
            simulate()

        ## need to catch potential errors from blur
        ## here and reject the promise
        .catch(reject)

      promise
      .timeout(timeout)
      .catch Promise.TimeoutError, (err) ->
        cleanup()

        return if options.error is false

        $utils.throwErrByPath "focus.timed_out", { onFail: options._log }
      .then ->
        return options.$el if options.verify is false

        do verifyAssertions = ->
          cy.verifyUpcomingAssertions(options.$el, options, {
            onRetry: verifyAssertions
      })

    blur: (subject, options = {}) ->
      ## we should throw errors by default!
      ## but allow them to be silenced
      _.defaults(options, {
        $el: subject
        $focused: cy.getFocused()
        error: true
        log: true
        verify: true
        force: false
      })
      
      { $el, $focused } = options

      if isWin = $dom.isWindow(options.$el)
        ## get this into a jquery object
        options.$el = $dom.wrap(options.$el)

      if options.log
        ## figure out the options which actually change the behavior of clicks
        deltaOptions = $utils.filterOutOptions(options)

        options._log = Cypress.log
          $el: options.$el
          message: deltaOptions
          consoleProps: ->
            "Applied To": $dom.getElements(options.$el)

      if (num = options.$el.length) and num > 1
        return if options.error is false

        $utils.throwErrByPath("blur.multiple_elements", {
          onFail: options._log
          args: { num }
        })

      ## if we haven't forced the blur, and we don't currently
      ## have a focused element OR we aren't the window then error
      if (options.force isnt true) and (not $focused) and (not isWin)
        return if options.error is false

        $utils.throwErrByPath("blur.no_focused_element", { onFail: options._log })

      ## if we're currently window dont check for the wrong
      ## focused element because window will not show up
      ## as $focused
      if (options.force isnt true) and (not isWin) and (
        options.$el.get(0) isnt $focused.get(0)
      )
        return if options.error is false

        node = $dom.stringify($focused)
        $utils.throwErrByPath("blur.wrong_focused_element", {
          onFail: options._log
          args: { node }
        })

      timeout = cy.timeout() * .90

      cleanup = null
      hasBlurred = false

      promise = new Promise (resolve) ->
        ## we need to bind to the blur event here
        ## because some browsers will not ever fire
        ## the blur event if the window itself is not
        ## currently focused. so we have to tell our users
        ## to do just that!
        cleanup = ->
          options.$el.off("blur", blurred)

        blurred = ->
          hasBlurred = true

          cleanup()

          cy.timeout($actionability.delay, true)

          Promise
          .delay($actionability.delay)
          .then(resolve)

        options.$el.on("blur", blurred)

        ## for simplicity we allow change events
        ## to be triggered by a manual blur
        $actionability.dispatchPrimedChangeEvents(state)

        ## NOTE: we could likely check document.hasFocus()
        ## here and expect that blur events are not fired
        ## when the window is not in focus. that would prevent
        ## us from making blur + focus async since we wait
        ## immediately below
        options.$el.get(0).blur()

        Promise
        .resolve(null)
        .then ->
          ## fallback if our blur event never fires
          ## to simulate the blur + focusout
          return if hasBlurred

          win = cy.state("window")

          ## todo handle relatedTarget's per the spec
          focusoutEvt = new FocusEvent "focusout", {
            bubbles: true
            cancelable: false
            view: win
            relatedTarget: null
          }

          blurEvt = new FocusEvent "blur", {
            bubble: false
            cancelable: false
            view: win
            relatedTarget: null
          }

          options.$el.get(0).dispatchEvent(blurEvt)
          options.$el.get(0).dispatchEvent(focusoutEvt)

      promise
      .timeout(timeout)
      .catch Promise.TimeoutError, (err) ->
        cleanup()

        return if options.error is false

        $utils.throwErrByPath "blur.timed_out", { onFail: command }
      .then ->
        return options.$el if options.verify is false

        do verifyAssertions = ->
          cy.verifyUpcomingAssertions(options.$el, options, {
            onRetry: verifyAssertions
      })
  })
