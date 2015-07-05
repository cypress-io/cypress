$Cypress.register "Actions", (Cypress, _, $, Promise) ->

  textLike = "textarea,:text,[contenteditable],[type=password],[type=email],[type=number],[type=date],[type=week],[type=month],[type=time],[type=datetime],[type=datetime-local],[type=search],[type=url]"

  focusable = "a[href],link[href],button,input,select,textarea,[tabindex],[contenteditable]"

  dispatchPrimedChangeEvents = ->
    ## if we have a changeEvent, dispatch it
    if changeEvent = @prop("changeEvent")
      changeEvent.call(@)

  Cypress.addChildCommand

    submit: (subject, options = {}) ->
      _.defaults options,
        log: true
        $el: subject

      @ensureDom(options.$el)

      ## changing this to a promise .map() causes submit events
      ## to break when they need to be triggered synchronously
      ## like with type {enter}.  either convert type to a promise
      ## to just create a synchronous submit function
      form = options.$el.get(0)

      if options.log
        command = Cypress.Log.command
          $el: options.$el
          onConsole: ->
            "Applied To": $Cypress.Utils.getDomElements(options.$el)
            Elements: options.$el.length

      if not options.$el.is("form")
        node = Cypress.Utils.stringifyElement(options.$el)
        word = Cypress.Utils.plural(options.$el, "contains", "is")
        @throwErr(".submit() can only be called on a <form>! Your subject #{word} a: #{node}", command)

      if (num = options.$el.length) and num > 1
        @throwErr(".submit() can only be called on a single form! Your subject contained #{num} form elements!", command)

      ## calling the native submit method will not actually trigger
      ## a submit event, so we need to dispatch this manually so
      ## native event listeners and jquery can bind to it
      submit = new Event("submit", {bubbles: true, cancelable: true})
      !!dispatched = form.dispatchEvent(submit)

      ## now we need to check to see if we should actually submit
      ## the form!
      ## dont submit the form if our dispatched event was cancelled (false)
      form.submit() if dispatched

      command.snapshot().end() if command

      return options.$el

    fill: (subject, obj, options = {}) ->
      @throwErr "cy.fill() must be passed an object literal as its 1st argument!" if not _.isObject(obj)

    check: (subject, values, options) ->
      @_check_or_uncheck("check", subject, values, options)

    uncheck: (subject, values, options) ->
      @_check_or_uncheck("uncheck", subject, values, options)

    focus: (subject, options = {}) ->
      ## we should throw errors by default!
      ## but allow them to be silenced
      _.defaults options,
        $el: subject
        error: true
        log: true

      @ensureDom(options.$el, "focus")

      if options.log
        command = Cypress.Log.command
          $el: options.$el
          onConsole: ->
            "Applied To": $Cypress.Utils.getDomElements(options.$el)

      ## http://www.w3.org/TR/html5/editing.html#specially-focusable
      ## ensure there is only 1 dom element in the subject
      ## make sure its allowed to be focusable
      if not (options.$el.is(focusable) or $Cypress.Utils.hasWindow(options.$el))
        return if options.error is false

        node = Cypress.Utils.stringifyElement(options.$el)
        @throwErr(".focus() can only be called on a valid focusable element! Your subject is a: #{node}", command)

      if (num = options.$el.length) and num > 1
        return if options.error is false

        @throwErr(".focus() can only be called on a single element! Your subject contained #{num} elements!", command)

      timeout = @_timeout() / 2

      cleanup = null
      hasFocused = false

      promise = new Promise (resolve, reject) =>
        ## we need to bind to the focus event here
        ## because some browsers will not ever fire
        ## the focus event if the window itself is not
        ## currently focused. so we have to tell our users
        ## to do just that!
        cleanup = ->
          options.$el.off("focus", focused)

        focused = =>
          hasFocused = true

          ## set this back to null unless we are
          ## force focused ourselves during this command
          forceFocusedEl = @prop("forceFocusedEl")
          @prop("forceFocusedEl", null) unless forceFocusedEl is options.$el.get(0)

          cleanup()

          command.snapshot().end() if command

          resolve(options.$el)

        options.$el.on("focus", focused)

        options.$el.get(0).focus()

        @defer =>
          ## fallback if our focus event never fires
          ## to simulate the focus + focusin
          return if hasFocused

          simulate = =>
            @prop("forceFocusedEl", options.$el.get(0))

            ## todo handle relatedTarget's per the spec
            focusinEvt = new FocusEvent "focusin", {
              bubbles: true
              view: @private("window")
              relatedTarget: null
            }

            focusEvt = new FocusEvent "focus", {
              view: @private("window")
              relatedTarget: null
            }

            ## not fired in the correct order per w3c spec
            ## because chrome chooses to fire focus before focusin
            ## and since we have a simulation fallback we end up
            ## doing it how chrome does it
            ## http://www.w3.org/TR/DOM-Level-3-Events/#h-events-focusevent-event-order
            options.$el.get(0).dispatchEvent(focusEvt)
            options.$el.get(0).dispatchEvent(focusinEvt)
            # options.$el.cySimulate("focus")
            # options.$el.cySimulate("focusin")

          @command("focused", {log: false}).then ($focused) =>
            ## only blur if we have a focused element AND its not
            ## currently ourselves!
            if $focused and $focused.get(0) isnt options.$el.get(0)

              @command("blur", {$el: $focused, error: false, log: false}).then =>
                simulate()
            else
              simulate()

          ## need to catch potential errors from blur
          ## here and reject the promise
          .catch (err) ->
            reject(err)

      promise
        .timeout(timeout)
        .catch Promise.TimeoutError, (err) =>
          cleanup()

          return if options.error is false

          @throwErr ".focus() timed out because your browser did not receive any focus events. This is a known bug in Chrome when it is not the currently focused window.", command

    blur: (subject, options = {}) ->
      ## we should throw errors by default!
      ## but allow them to be silenced
      _.defaults options,
        $el: subject
        error: true
        log: true

      @ensureDom(options.$el, "blur")

      if options.log
        command = Cypress.Log.command
          $el: options.$el
          onConsole: ->
            "Applied To": $Cypress.Utils.getDomElements(options.$el)

      if (num = options.$el.length) and num > 1
        return if options.error is false

        @throwErr(".blur() can only be called on a single element! Your subject contained #{num} elements!", command)

      @command("focused", {log: false}).then ($focused) =>
        if not $focused
          return if options.error is false

          @throwErr(".blur() can only be called when there is a currently focused element.", command)

        if options.$el.get(0) isnt $focused.get(0)
          return if options.error is false

          node = Cypress.Utils.stringifyElement($focused)
          @throwErr(".blur() can only be called on the focused element. Currently the focused element is a: #{node}", command)

        timeout = @_timeout() / 2

        cleanup = null
        hasBlurred = false

        promise = new Promise (resolve) =>
          ## we need to bind to the blur event here
          ## because some browsers will not ever fire
          ## the blur event if the window itself is not
          ## currently focused. so we have to tell our users
          ## to do just that!
          cleanup = ->
            options.$el.off("blur", blurred)

          blurred = =>
            hasBlurred = true

            ## set this back to null unless we are
            ## force blurring ourselves during this command
            blacklistFocusedEl = @prop("blacklistFocusedEl")
            @prop("blacklistFocusedEl", null) unless blacklistFocusedEl is options.$el.get(0)

            cleanup()

            command.snapshot().end() if command

            resolve(options.$el)

          options.$el.on("blur", blurred)

          ## for simplicity we allow change events
          ## to be triggered by a manual blur
          dispatchPrimedChangeEvents.call(@)

          options.$el.get(0).blur()

          @defer =>
            ## fallback if our blur event never fires
            ## to simulate the blur + focusout
            return if hasBlurred

            @prop("blacklistFocusedEl", options.$el.get(0))

            ## todo handle relatedTarget's per the spec
            focusoutEvt = new FocusEvent "focusout", {
              bubbles: true
              cancelable: false
              view: @private("window")
              relatedTarget: null
            }

            blurEvt = new FocusEvent "blur", {
              bubble: false
              cancelable: false
              view: @private("window")
              relatedTarget: null
            }

            options.$el.get(0).dispatchEvent(blurEvt)
            options.$el.get(0).dispatchEvent(focusoutEvt)

        promise.timeout(timeout).catch Promise.TimeoutError, (err) =>
          cleanup()

          return if options.error is false

          @throwErr ".blur() timed out because your browser did not receive any blur events. This is a known bug in Chrome when it is not the currently focused window.", command

    ## update dblclick to use the click
    ## logic and just swap out the event details?
    dblclick: (subject, options = {}) ->
      _.defaults options,
        log: true

      @ensureDom(subject)

      wait = 10

      dblclicks = []

      dblclick = (el, index) =>
        $el = $(el)

        ## we want to add this wait delta to our
        ## runnables timeout so we prevent it from
        ## timing out from multiple clicks
        @_timeout(wait, true)

        if options.log
          command = Cypress.Log.command
            $el: $el
            onConsole: ->
              "Applied To":   $Cypress.Utils.getDomElements($el)
              "Elements":     $el.length

        @ensureVisibility $el, command

        p = @command("focus", {$el: $el, error: false, log: false}).then =>
          event = new MouseEvent "dblclick", {
            bubbles: true
            cancelable: true
          }

          el.dispatchEvent(event)

          # $el.cySimulate("dblclick")

          command.snapshot().end() if command

          ## need to return null here to prevent
          ## chaining thenable promises
          return null

        .delay(wait)
        .cancellable()

        dblclicks.push(p)

        return p

      ## create a new promise and chain off of it using reduce to insert
      ## the artificial delays.  we have to set this as cancellable for it
      ## to propogate since this is an "inner" promise

      ## return our original subject when our promise resolves
      Promise
        .resolve(subject.toArray())
        .each(dblclick)
        .cancellable()
        .return(subject)
        .catch Promise.CancellationError, (err) ->
          _(dblclicks).invoke("cancel")
          throw err

    click: (subject, options = {}) ->
      ## TODO handle pointer-events: none
      ## http://caniuse.com/#feat=pointer-events

      ## TODO handle if element is removed during mousedown / mouseup

      _.defaults options,
        $el: subject
        log: true
        force: false
        command: null
        errorOnSelect: true

      @ensureDom(options.$el)

      win             = @private("window")
      wait            = 10
      stopPropagation = MouseEvent.prototype.stopPropagation

      clicks = []

      click = (el, index) =>
        $el = $(el)

        ## we want to add this wait delta to our
        ## runnables timeout so we prevent it from
        ## timing out from multiple clicks
        @_timeout(wait, true)

        mdownCancelled = mupCancelled = clickCancelled = null
        mdownEvt = mupEvt = clickEvt = null
        $previouslyFocusedEl = null

        if options.log
          ## figure out the options which actually change the behavior of clicks
          deltaOptions = Cypress.Utils.filterDelta(options, {force: false, timeout: null, interval: 50})

          options.command = Cypress.Log.command({
            message: deltaOptions
            $el: $el
          })

        if options.errorOnSelect and $el.is("select")
          @throwErr "Cannot call .click() on a <select> element. Use cy.select() command instead to change the value.", options.command

        ## in order to simulate actual user behavior we need to do the following:
        ## 1. take our element and figure out its center coordinate
        ## 2. check to figure out the element listed at those coordinates
        ## 3. if this element is ourself or our descendents, click whatever was returned
        ## 4. else throw an error because something is covering us up
        if options.force isnt true
          @ensureVisibility $el, options.command

        getFirstFocusableEl = ($el) ->
          return $el if $el.is(focusable)

          parent = $el.parent()

          ## if we have no parent then just return
          ## the window since that can receive focus
          return $(win) if not parent.length

          getFirstFocusableEl($el.parent())

        issueMouseDown = ($elToClick, coords) =>
          mdownEvt = new MouseEvent "mousedown", {
            bubbles: true
            cancelable: true
            view: win
            clientX: coords.x
            clientY: coords.y
            buttons: 1
            detail: 1
          }

          mdownEvt.stopPropagation = ->
            @_hasStoppedPropagation = true
            stopPropagation.apply(@, arguments)

          mupEvt = new MouseEvent "mouseup", {
            bubbles: true
            cancelable: true
            view: win
            clientX: coords.x
            clientY: coords.y
            buttons: 0
            detail: 1
          }

          mupEvt.stopPropagation = ->
            @_hasStoppedPropagation = true
            stopPropagation.apply(@, arguments)

          clickEvt = new MouseEvent "click", {
            bubbles: true
            cancelable: true
            view: win
            clientX: coords.x
            clientY: coords.y
            buttons: 0
            detail: 1
          }

          clickEvt.stopPropagation = ->
            @_hasStoppedPropagation = true
            stopPropagation.apply(@, arguments)


          @command("focused", {log: false}).then ($focused) =>
            ## record the previously focused element before
            ## issuing the mousedown because browsers may
            ## automatically shift the focus to the element
            ## without firing the focus event
            $previouslyFocusedEl = $focused

            mdownCancelled = !$elToClick.get(0).dispatchEvent(mdownEvt)

        mdownFocusCallback = ->
          mdownCausedFocus = true

        afterMouseDown = ($elToClick, coords) =>
          mupCancelled   = !$elToClick.get(0).dispatchEvent(mupEvt)
          clickCancelled = !$elToClick.get(0).dispatchEvent(clickEvt)

          if options.command
            consoleObj = options.command.attributes.onConsole()

          onConsole = ->
            consoleObj = _.defaults consoleObj ? {}, {
              "Applied To":   $Cypress.Utils.getDomElements($el)
              "Elements":     $el.length
              "Coords":       coords
              "Options":      deltaOptions
            }

            if $el.get(0) isnt $elToClick.get(0)
              ## only do this if $elToClick isnt $el
              consoleObj["Actual Element Clicked"] = $Cypress.Utils.getDomElements($elToClick)

            consoleObj.groups = ->
              [
                {
                  name: "MouseDown"
                  items: {
                    preventedDefault: mdownCancelled
                    stoppedPropagation: !!mdownEvt._hasStoppedPropagation
                  }
                },
                {
                  name: "MouseUp"
                  items: {
                    preventedDefault: mupCancelled
                    stoppedPropagation: !!mupEvt._hasStoppedPropagation
                  }
                }
                {
                  name: "Click"
                  items: {
                    preventedDefault: clickCancelled
                    stoppedPropagation: !!clickEvt._hasStoppedPropagation
                  }
                }
              ]

            consoleObj

          ## display the red dot at these coords
          if options.command
            options.command.set({coords: coords, onConsole: onConsole}).snapshot().end()

          ## need to return null here to prevent
          ## chaining thenable promises
          return null

        findElByCoordinates = ($el) =>

          coordsObj = (coords, $el) ->
            {
              coords: coords
              $elToClick: $el
            }

          scrollWindowPastFixedElement = ($fixed) ->
            height = $fixed.outerHeight()
            width  = $fixed.outerWidth()
            win.scrollBy(-width, -height)
            if options.command
              ## store the scrollBy to be used later in the iframe view
              options.command.set "scrollBy", {x: -width, y: -height}

          getElementWithFixedPosition = ($el) ->
            ## return null if we're at body/html
            ## cuz that means nothing has fixed position
            return null if not $el or $el.is("body,html")

            ## if we have fixed position return ourselves
            if $el.css("position") is "fixed"
              return $el

            ## else recursively continue to walk up the parent node chain
            getElementWithFixedPosition($el.parent())

          getElementAtCoordinates = (coords) =>
            ## accept options which disable actually ensuring the element
            ## is clickable / in the foreground
            ## this is helpful during css animations for instance where
            ## you're trying to click a moving target. in that case we'll
            ## just 'click' it for you and simulate everything related to
            ## the click without verifying it is clickable. focus events
            ## default actions, propagation, etc will still be respected
            $elToClick = @getElementAtCoordinates(coords.x, coords.y)

            try
              @ensureDescendents $el, $elToClick, options.command
            catch err
              ## if $elToClick isnt a descendent then attempt to nudge the
              ## window scrollBy based on the height of the covering element
              ## (if its fixed position) until our element comes into view
              if $fixed = getElementWithFixedPosition($elToClick)
                scrollWindowPastFixedElement($fixed)

                retry = ->
                  getCoords(false)

                ## try again now that we've nudged the window's scroll
                # return getElementAtCoordinates(coords)
                return @_retry(retry, options)

              if options.command
                options.command.snapshot()
                options.command.set onConsole: ->
                  obj = {}
                  obj["Tried to Click"]     = $Cypress.Utils.getDomElements($el)
                  obj["But its Covered By"] = $Cypress.Utils.getDomElements($elToClick)
                  obj

              options.error   = err
              return @_retry(getCoords, options)

            return coordsObj(coords, $elToClick)

          getCoords = (scrollIntoView = true) =>
            ## use native scrollIntoView here so scrollable
            ## containers are automatically handled correctly

            ## its possible the center of the element actually isnt
            ## in view yet so we probably need to factor that in
            ## and scrollBy the amount of distance between the center
            ## and the left of the element so it positions the center
            ## in the viewport
            $el.get(0).scrollIntoView() if scrollIntoView

            coords = @getCoordinates($el)

            ## if we're forcing this click event
            ## just immediately send it up
            if options.force
              return coordsObj(coords, $el)

            getElementAtCoordinates(coords)

          Promise.resolve(getCoords())

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

        p = findElByCoordinates($el)
          .then (obj) =>
            {$elToClick, coords} = obj

            issueMouseDown($elToClick, coords).then =>

              ## if mousedown was cancelled then
              ## just resolve after mouse down and dont
              ## send a focus event
              if mdownCancelled
                afterMouseDown($elToClick, coords)
              else
                ## retrieve the first focusable $el in our parent chain
                $elToFocus = getFirstFocusableEl($elToClick)

                @command("focused", {log: false}).then ($focused) =>
                  if shouldFireFocusEvent($focused, $elToFocus)
                    ## if our mousedown went through and
                    ## we are focusing a different element
                    ## dispatch any primed change events
                    ## we have to do this because our blur
                    ## method might not get triggered if
                    ## our window is in focus since the
                    ## browser may fire blur events naturally
                    dispatchPrimedChangeEvents.call(@)

                    ## send in a focus event!
                    @command("focus", {$el: $elToFocus, error: false, log: false})
                    .then ->
                      afterMouseDown($elToClick, coords)
                  else
                    afterMouseDown($elToClick, coords)

          .delay(wait)
          .cancellable()

        clicks.push(p)

        return p

      Promise
        .each(options.$el.toArray(), click)
        .cancellable()
        .return(options.$el)
        .catch Promise.CancellationError, (err) ->
          _(clicks).invoke("cancel")
          throw err

    type: (subject, chars, options = {}) ->
      ## allow the el we're typing into to be
      ## changed by options -- used by cy.clear()
      _.defaults options,
        $el: subject
        log: true
        force: false
        delay: 10

      @ensureDom(options.$el)

      if options.log
        ## figure out the options which actually change the behavior of clicks
        deltaOptions = Cypress.Utils.filterDelta(options, {
          force: false
          timeout: null
          interval: 50
          delay: 10
        })

        table = {}

        getRow = (id, key, which) ->
          table[id] or do ->
            table[id] = (obj = {})
            if key
              obj.typed = key
              obj.which = which if which
            obj

        updateTable = (id, key, column, value, which) ->
          row = getRow(id, key, which)
          row[column] = value or "preventedDefault"

        getTableData = ->
          ## transform table object into object with zero based index as keys
          _.reduce _(table).values(), (memo, value, index) ->
            memo[index + 1] = value
            memo
          , {}

        options.command = Cypress.Log.command
          message: [chars, deltaOptions]
          $el: options.$el
          onConsole: ->
            "Typed":      chars
            "Applied To": $Cypress.Utils.getDomElements(options.$el)
            "Options":    deltaOptions
            "table": ->
              {
                name: "Key Events Table"
                data: getTableData()
                columns: ["typed", "which", "keydown", "keypress", "textInput", "input", "keyup", "change"]
              }

      if not options.$el.is(textLike)
        node = Cypress.Utils.stringifyElement(options.$el)
        @throwErr(".type() can only be called on textarea or :text! Your subject is a: #{node}", options.command)

      if (num = options.$el.length) and num > 1
        @throwErr(".type() can only be called on a single textarea or :text! Your subject contained #{num} elements!", options.command)

      if not (_.isString(chars) or _.isFinite(chars))
        @throwErr(".type() can only accept a String or Number. You passed in: '#{chars}'", options.command)

      if _.isBlank(chars)
        @throwErr(".type() cannot accept an empty String! You need to actually type something.", options.command)

      options.chars = "" + chars

      type = =>
        simulateSubmitHandler = =>
          form = options.$el.parents("form")

          return if not form.length

          multipleInputsAndNoSubmitElements = (form) ->
            inputs  = form.find("input")
            submits = form.find("input[type=submit], button[type!=button]")

            inputs.length > 1 and submits.length is 0

          ## throw an error here if there are multiple form parents

          ## bail if we have multiple inputs and no submit elements
          return if multipleInputsAndNoSubmitElements(form)

          clickedDefaultButton = (button) ->
            ## find the 'default button' as per HTML spec and click it natively
            ## do not issue mousedown / mouseup since this is supposed to be synthentic
            if button.length
              button.get(0).click()
              true
            else
              false

          getDefaultButton = (form) ->
            form.find("input[type=submit], button[type!=button]").first()

          defaultButtonisDisabled = (button) ->
            button.prop("disabled")

          defaultButton = getDefaultButton(form)

          ## bail if the default button is in a 'disabled' state
          return if defaultButtonisDisabled(defaultButton)

          ## issue the click event to the 'default button' of the form
          ## we need this to be synchronous so not going through our
          ## own click command
          ## as of now, at least in Chrome, causing the click event
          ## on the button will indeed trigger the form submit event
          ## so we dont need to fire it manually anymore!
          if not clickedDefaultButton(defaultButton)
            ## if we werent able to click the default button
            ## then synchronously fire the submit event
            ## currently this is sync but if we use a waterfall
            ## promise in the submit command it will break again
            ## consider changing type to a Promise and juggle logging
            @command("submit", {log: false, $el: form})

        dispatchChangeEvent = (id) =>
          change = document.createEvent("HTMLEvents")
          change.initEvent("change", true, false)

          dispatched = options.$el.get(0).dispatchEvent(change)

          updateTable.call(@, id, null, "change", dispatched) if id and updateTable

          return dispatched

        @Cypress.Keyboard.type({
          $el:    options.$el
          chars:  options.chars
          delay:  options.delay
          window: @private("window")

          onBeforeType: (totalKeys) =>
            ## for the total number of keys we're about to
            ## type, ensure we raise the timeout to account
            ## for the delay being added to each keystroke
            @_timeout (totalKeys * options.delay), true

          onEvent: =>
            updateTable.apply(@, arguments) if updateTable

          ## fires only when the 'value'
          ## of input/text/contenteditable
          ## changes
          onTypeChange: =>
            ## never fire any change events for contenteditable
            return if options.$el.is("[contenteditable]")

            @prop "changeEvent", ->
              dispatchChangeEvent()
              @prop "changeEvent", null

          onEnterPressed: (changed, id) =>
            ## dont dispatch change events or handle
            ## submit event if we've pressed enter into
            ## a textarea or contenteditable
            return if options.$el.is("textarea,[contenteditable]")

            ## if our value has changed since our
            ## element was activated we need to
            ## fire a change event immediately
            if changed
              dispatchChangeEvent(id)

            ## handle submit event handler here
            simulateSubmitHandler()

          onNoMatchingSpecialChars: (chars, allChars) =>
            if chars is "{tab}"
              @throwErr("{tab} isn't a supported character sequence. You'll want to use the command: 'cy.tab()' which is not ready yet, but when it is done that's what you'll use.", options.command)
            else
              @throwErr("Special character sequence: '#{chars}' is not recognized. Available sequences are: #{allChars}", options.command)

        })

      @command("focused", {log: false}).then ($focused) =>
        ## if we dont have a focused element
        ## or if we do and its not ourselves
        ## then issue the click
        if not $focused or ($focused and $focused.get(0) isnt options.$el.get(0))
          ## click the element first to simulate focus
          ## and typical user behavior in case the window
          ## is out of focus
          @command("click", {
            $el: options.$el
            log: false
            command: options.command
            force: options.force
            timeout: options.timeout
            interval: options.interval
          }).then =>
            type()
        else
          type()
      .then ->
        ## submit events should be finished at this point!
        ## so we can snapshot the current state of the DOM
        options.command.snapshot().end() if options.command

        return options.$el

    clear: (subject, options = {}) ->
      ## what about other types of inputs besides just text?
      ## what about the new HTML5 ones?
      _.defaults options,
        log: true
        force: false

      @ensureDom(subject)

      ## blow up if any member of the subject
      ## isnt a textarea or :text
      clear = (el, index) =>
        $el = $(el)

        if options.log
          ## figure out the options which actually change the behavior of clicks
          deltaOptions = Cypress.Utils.filterDelta(options, {force: false, timeout: null, interval: 50})

          options.command = Cypress.Log.command
            message: deltaOptions
            $el: $el
            onConsole: ->
              "Applied To": $Cypress.Utils.getDomElements($el)
              "Elements":   $el.length
              "Options":    deltaOptions

        node = Cypress.Utils.stringifyElement($el)

        if not $el.is(textLike)
          word = Cypress.Utils.plural(subject, "contains", "is")
          @throwErr ".clear() can only be called on textarea or :text! Your subject #{word} a: #{node}", options.command

        @command("type", "{selectall}{del}", {
          $el: $el
          log: false
          command: options.command
          force: options.force
          timeout: options.timeout
          interval: options.interval
        }).then ->
          options.command.snapshot().end() if options.command

          return null

      Promise
        .resolve(subject.toArray())
        .each(clear)
        .cancellable()
        .return(subject)

    select: (subject, valueOrText, options = {}) ->
      _.defaults options,
        $el: subject
        log: true
        force: false

      @ensureDom(options.$el)

      if options.log
        ## figure out the options which actually change the behavior of clicks
        deltaOptions = Cypress.Utils.filterDelta(options, {force: false, timeout: null, interval: 50})

        options.command = Cypress.Log.command
          message: deltaOptions
          $el: options.$el
          onConsole: ->
            "Selected":   values
            "Applied To": $Cypress.Utils.getDomElements(options.$el)
            "Options":    deltaOptions

      ## if subject is a <select> el assume we are filtering down its
      ## options to a specific option first by value and then by text
      ## we'll throw if more than one is found AND the select
      ## element is multiple=multiple

      ## if the subject isn't a <select> then we'll check to make sure
      ## this is an option
      ## if this is multiple=multiple then we'll accept an array of values
      ## or texts and clear the previous selections which matches jQuery's
      ## behavior

      if not options.$el.is("select")
        node = Cypress.Utils.stringifyElement(options.$el)
        @throwErr ".select() can only be called on a <select>! Your subject is a: #{node}"

      if (num = options.$el.length) and num > 1
        @throwErr ".select() can only be called on a single <select>! Your subject contained #{num} elements!"

      ## normalize valueOrText if its not an array
      valueOrText = [].concat(valueOrText)
      multiple    = options.$el.prop("multiple")

      ## throw if we're not a multiple select and we've
      ## passed an array of values
      if not multiple and valueOrText.length > 1
        @throwErr ".select() was called with an array of arguments but does not have a 'multiple' attribute set!"

      values  = []
      optionEls = []
      optionsObjects = options.$el.children().map (index, el) ->
        ## push the value in values array if its
        ## found within the valueOrText
        value = el.value
        optEl = $(el)

        if value in valueOrText
          optionEls.push optEl
          values.push(value)

        ## return the elements text + value
        {
          value: value
          text: optEl.text()
          $el: optEl
        }

      ## if we couldn't find anything by value then attempt
      ## to find it by text and insert its value into values arr
      if not values.length
        _.each optionsObjects.get(), (obj, index) ->
          if obj.text in valueOrText
            optionEls.push obj.$el
            values.push(obj.value)

      ## if we didnt set multiple to true and
      ## we have more than 1 option to set then blow up
      if not multiple and values.length > 1
        @throwErr(".select() matched than one option by value or text: #{valueOrText.join(", ")}")

      @command("click", {
        $el: options.$el
        log: false
        errorOnSelect: false ## prevent click errors since we want the select to be clicked
        command: options.command
        force: options.force
        timeout: options.timeout
        interval: options.interval
      }).then( =>

        ## TODO:
        ## 1. test cancellation
        ## 2. test passing optionEls to each directly
        ## 3. update other tests using this Promise.each pattern
        ## 4. test that force is always true
        ## 5. test that command is not provided (undefined / null)
        ## 6. test that option actually receives click event
        ## 7. test that select still has focus (i think it already does have a test)
        ## 8. test that multiple=true selects receive option event for each selected option
        Promise
          .resolve(optionEls) ## why cant we just pass these directly to .each?
          .each (optEl) =>
            @command("click", {
              $el: optEl
              log: false
              force: true ## always force the click to happen on the <option>
              timeout: options.timeout
              interval: options.interval
            })
          .cancellable()
          .then =>
            ## reset the selects value after we've
            ## fired all the proper click events
            ## for the options
            options.$el.val(values)

            input = new Event "input", {
              bubbles: true
              cancelable: false
            }

            options.$el.get(0).dispatchEvent(input)

            ## yup manually create this change event
            ## 1.6.5. HTML event types
            ## scroll down to 'change'
            change = document.createEvent("HTMLEvents")
            change.initEvent("change", true, false)

            options.$el.get(0).dispatchEvent(change)

            ## change events should be finished at this point!
            ## so we can snapshot the current state of the DOM
            options.command.snapshot().end() if options.command
      ).return(options.$el)

  Cypress.addParentCommand
    focused: (options = {}) ->
      log = ($el) ->
        return if options.log is false

        Cypress.Log.command
          $el: $el
          end: true
          snapshot: true
          onConsole: ->
            ret = if $el
              $Cypress.Utils.getDomElements($el)
            else
              "--nothing--"
            Returned: ret
            Elements: $el?.length ? 0

      try
        d = @private("document")
        forceFocusedEl = @prop("forceFocusedEl")
        if forceFocusedEl
          if @_contains(forceFocusedEl)
            el = forceFocusedEl
          else
            @prop("forceFocusedEl", null)
        else
          el = d.activeElement

        ## return null if we have an el but
        ## the el is body or the el is currently the
        ## blacklist focused el
        if el and el isnt @prop("blacklistFocusedEl")
          el = $(el)

          if el.is("body")
            log(null)
            return null

          log(el)
          return el
        else
          log(null)
          return null

      catch
        log(null)
        return null

  Cypress.Cy.extend
    _check_or_uncheck: (type, subject, values = [], options = {}) ->
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

      _.defaults options,
        $el: subject
        log: true
        force: false

      @ensureDom(options.$el)

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

      ## blow up if any member of the subject
      ## isnt a checkbox or radio
      checkOrUncheck = (el, index) =>
        $el = $(el)

        onConsole =
          "Applied To":   $Cypress.Utils.getDomElements($el)
          "Elements":     $el.length

        if options.log
          ## figure out the options which actually change the behavior of clicks
          deltaOptions = Cypress.Utils.filterDelta(options, {force: false, timeout: null, interval: 50})

          command = Cypress.Log.command
            message: deltaOptions
            $el: $el
            onConsole: ->
              _.extend onConsole, {
                Options: deltaOptions
              }

        if not isAcceptableElement($el)
          node   = Cypress.Utils.stringifyElement($el)
          word   = Cypress.Utils.plural(options.$el, "contains", "is")
          phrase = if type is "check" then " and :radio" else ""
          @throwErr ".#{type}() can only be called on :checkbox#{phrase}! Your subject #{word} a: #{node}", command

        ## if the checkbox was already checked
        ## then notify the user of this note
        ## and bail
        if isNoop($el)
          ## still ensure visibility even if the command is noop
          @ensureVisibility $el, command
          onConsole.Note = "This checkbox was already #{type}ed. No operation took place."
          return
        else
          ## set the coords only if we are actually
          ## going to go out and click this bad boy
          coords = @getCoordinates($el)
          onConsole.Coords = coords
          command.set "coords", coords

        ## if we didnt pass in any values or our
        ## el's value is in the array then check it
        if not values.length or $el.val() in values
          @command("click", {
            $el: $el
            log: false
            command: command
            force: options.force
            timeout: options.timeout
            interval: options.interval
          }).then ->
            command.snapshot().end() if command

            return null

      ## return our original subject when our promise resolves
      Promise
        .resolve(options.$el.toArray())
        .each(checkOrUncheck)
        .cancellable()
        .return(options.$el)
