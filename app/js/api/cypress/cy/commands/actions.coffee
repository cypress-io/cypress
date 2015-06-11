$Cypress.register "Actions", (Cypress, _, $) ->

  pressedEnter = /\{enter\}/

  textLike = "textarea,:text,[contenteditable],[type=password],[type=email],[type=number],[type=date],[type=week],[type=month],[type=time],[type=datetime],[type=datetime-local],[type=search],[type=url]"

  focusable = "a[href],link[href],button,input,select,textarea,[tabindex]"

  $.simulate.prototype.simulateKeySequence.defaults["{esc}"] = (rng, char, options) ->
    keyOpts = {keyCode: 27, charCode: 27, which: 27}
    _.each ["keydown", "keypress", "keyup"], (event) ->
      options.$el.simulate event, _.extend({}, options.eventProps, keyOpts)

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
        command = Cypress.command
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
        command = Cypress.command
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

      promise.timeout(timeout).catch Promise.TimeoutError, (err) =>
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
        command = Cypress.command
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

          options.$el.get(0).blur()

          @defer =>
            ## fallback if our blur event never fires
            ## to simulate the blur + focusout
            return if hasBlurred

            @prop("blacklistFocusedEl", options.$el.get(0))

            options.$el.cySimulate("blur")
            options.$el.cySimulate("focusout")

        promise.timeout(timeout).catch Promise.TimeoutError, (err) =>
          cleanup()

          return if options.error is false

          @throwErr ".blur() timed out because your browser did not receive any blur events. This is a known bug in Chrome when it is not the currently focused window.", command

    dblclick: (subject, options = {}) ->
      _.defaults options,
        log: true

      @ensureDom(subject)

      dblclick = (el, index) =>
        $el = $(el)

        if options.log
          command = Cypress.command
            $el: $el
            onConsole: ->
              "Applied To":   $Cypress.Utils.getDomElements($el)
              "Elements":     $el.length

        @ensureVisibility $el, command

        wait = if $el.is("a") then 50 else 10

        @command("focus", {$el: $el, error: false, log: false}).then =>
          $el.cySimulate("dblclick")

          command.snapshot().end() if command

          ## we want to add this wait delta to our
          ## runnables timeout so we prevent it from
          ## timing out from multiple clicks
          @_timeout(wait, true)

          ## need to return null here to prevent
          ## chaining thenable promises
          return null

        .delay(wait)

      ## create a new promise and chain off of it using reduce to insert
      ## the artificial delays.  we have to set this as cancellable for it
      ## to propogate since this is an "inner" promise

      ## return our original subject when our promise resolves
      Promise
        .resolve(subject.toArray())
        .each(dblclick)
        .cancellable()
        .return(subject)

    click: (subject, options = {}) ->
      ## TODO handle pointer-events: none
      ## http://caniuse.com/#feat=pointer-events

      ## TODO handle if element is removed during mousedown / mouseup

      _.defaults options,
        $el: subject
        log: true
        force: false
        command: null

      @ensureDom(options.$el)

      win             = @private("window")
      wait            = 10
      stopPropagation = MouseEvent.prototype.stopPropagation

      click = (el, index) =>
        $el = $(el)

        ## we want to add this wait delta to our
        ## runnables timeout so we prevent it from
        ## timing out from multiple clicks
        @_timeout(wait, true)

        mdownCancelled = mupCancelled = clickCancelled = null
        mdownEvt = mupEvt = clickEvt = null

        if options.log
          options.command = Cypress.command({$el: $el})

        ## in order to simulate actual user behavior we need to do the following:
        ## 1. take our element and figure out its center coordinate
        ## 2. check to figure out the element listed at those coordinates
        ## 3. if this element is ourself or our descendents, click whatever was returned
        ## 4. else throw an error because something is covering us up
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

          mdownCancelled = !$elToClick.get(0).dispatchEvent(mdownEvt)

        afterMouseDown = ($elToClick, coords) =>
          mupCancelled   = !$elToClick.get(0).dispatchEvent(mupEvt)
          clickCancelled = !$elToClick.get(0).dispatchEvent(clickEvt)

          if options.command
            console = options.command.attributes.onConsole()

          onConsole = ->
            console = _.defaults console ? {}, {
              "Applied To":   $Cypress.Utils.getDomElements($el)
              "Elements":     $el.length
              "Coords":       coords
            }

            if $el.get(0) isnt $elToClick.get(0)
              ## only do this if $elToClick isnt $el
              console["Actual Element Clicked"] = $Cypress.Utils.getDomElements($elToClick)

            console.groups = ->
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

            console

          ## display the red dot at these coords
          if options.command
            options.command.set({coords: coords, onConsole: onConsole}).snapshot().end()

          ## need to return null here to prevent
          ## chaining thenable promises
          return null

        findElByCoordinates = ($el) =>

          getCoords = =>
            ## use native scrollIntoView here so scrollable
            ## containers are automatically handled correctly

            ## its possible the center of the element actually isnt
            ## in view yet so we probably need to factor that in
            ## and scrollBy the amount of distance between the center
            ## and the left of the element so it positions the center
            ## in the viewport
            $el.get(0).scrollIntoView()

            coords = @getCoordinates($el)

            ## if we're forcing this click event
            ## just immediately send it up
            if options.force
              return {
                coords: coords
                $elToClick: $el
              }

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
              if options.command
                options.command.set onConsole: ->
                  obj = {}
                  obj["Covered By"] = $Cypress.Utils.getDomElements($elToClick)
                  obj

              options.error   = err
              return @_retry(getCoords, options)

            return {
              coords: coords
              $elToClick: $elToClick
            }

          Promise.resolve(getCoords())

        p = findElByCoordinates($el).then (obj) =>
          {$elToClick, coords} = obj

          issueMouseDown($elToClick, coords)

          ## if mousedown was cancelled then
          ## just resolve after mouse down and dont
          ## send a focus event
          if mdownCancelled
            afterMouseDown($elToClick, coords)
          else
            ## retrieve the first focusable $el in our parent chain
            $elToFocus = getFirstFocusableEl($elToClick)

            ## send in a focus event!
            @command("focus", {$el: $elToFocus, error: false, log: false})
            .then -> afterMouseDown($elToClick, coords)

        p.delay(wait)

      Promise
        .resolve(options.$el.toArray())
        .each(click)
        .cancellable()
        .return(options.$el)

    type: (subject, sequence, options = {}) ->
      ## allow the el we're typing into to be
      ## changed by options -- used by cy.clear()
      _.defaults options,
        $el: subject
        log: true
        force: false

      @ensureDom(options.$el)

      if options.log
        options.command = Cypress.command
          $el: options.$el
          onConsole: ->
            "Typed":      sequence
            "Applied To": $Cypress.Utils.getDomElements(options.$el)

      @ensureVisibility(options.$el, options.command)

      if not options.$el.is(textLike)
        node = Cypress.Utils.stringifyElement(options.$el)
        @throwErr(".type() can only be called on textarea or :text! Your subject is a: #{node}", options.command)

      if (num = options.$el.length) and num > 1
        @throwErr(".type() can only be called on a single textarea or :text! Your subject contained #{num} elements!", options.command)

      options.sequence = sequence

      ## click the element first to simulate focus
      ## and typical user behavior in case the window
      ## is out of focus
      @command("click", {$el: options.$el, log: false, command: options.command, force: options.force}).then =>

        multipleInputsAndNoSubmitElements = (form) ->
          inputs  = form.find("input")
          submits = form.find("input[type=submit], button[type!=button]")

          inputs.length > 1 and submits.length is 0

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

        simulateSubmitHandler = =>
          form = options.$el.parents("form")

          return if not form.length

          ## throw an error here if there are multiple form parents

          ## bail if we have multiple inputs and no submit elements
          return if multipleInputsAndNoSubmitElements(form)

          keydownPrevented  = false
          keypressPrevented = false

          ## there are edge cases where this logic is broken
          ## we are currently not following the spec in regards
          ## to NOT firing keypress events when the keydown
          ## event is preventDefault() or stopPropagation()
          ## our simulation lib is firing keypress no matter what

          keydown = (e) ->
            if e.which is 13 and e.isDefaultPrevented()
              keydownPrevented = true

          keypress = (e) =>
            if e.which is 13
              if e.isDefaultPrevented()
                keypressPrevented = true

              ## keypress happens after keydown so we can just simulate the
              ## submit event now if both events were NOT prevented!
              if keydownPrevented is false and keypressPrevented is false
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

          form.on "keydown", keydown
          form.on "keypress", keypress

          @once "invoke:end", ->
            form.off "keydown", keydown
            form.off "keypress", keypress

          ## need to do the crazy logic associated with knowing when
          ## to trigger the form submit event and when to also trigger
          ## the click event on the first 'submit' like element

        ## handle submit event handler here if we are pressing enter
        simulateSubmitHandler() if pressedEnter.test(sequence)

        options.$el.simulate "key-sequence", options

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
          options.command = Cypress.command
            $el: $el
            onConsole: ->
              "Applied To": $Cypress.Utils.getDomElements($el)
              "Elements":   $el.length

        node = Cypress.Utils.stringifyElement($el)

        if not $el.is(textLike)
          word = Cypress.Utils.plural(subject, "contains", "is")
          @throwErr ".clear() can only be called on textarea or :text! Your subject #{word} a: #{node}", options.command

        @command("type", "{selectall}{del}", {$el: $el, log: false, command: options.command, force: options.force}).then ->
          options.command.snapshot().end() if options.command

          return null

      Promise
        .resolve(subject.toArray())
        .each(clear)
        .cancellable()
        .return(subject)

    select: (subject, valueOrText, options = {}) ->
      @ensureDom(subject)

      ## if subject is a <select> el assume we are filtering down its
      ## options to a specific option first by value and then by text
      ## we'll throw if more than one is found AND the select
      ## element is multiple=multiple

      ## if the subject isn't a <select> then we'll check to make sure
      ## this is an option
      ## if this is multiple=multiple then we'll accept an array of values
      ## or texts and clear the previous selections which matches jQuery's
      ## behavior

      if not subject.is("select")
        node = Cypress.Utils.stringifyElement(subject)
        @throwErr ".select() can only be called on a <select>! Your subject is a: #{node}"

      if (num = subject.length) and num > 1
        @throwErr ".select() can only be called on a single <select>! Your subject contained #{num} elements!"

      @ensureVisibility(subject)

      ## normalize valueOrText if its not an array
      valueOrText = [].concat(valueOrText)
      multiple    = subject.prop("multiple")

      ## throw if we're not a multiple select and we've
      ## passed an array of values
      if not multiple and valueOrText.length > 1
        @throwErr ".select() was called with an array of arguments but does not have a 'multiple' attribute set!"

      values  = []
      options = subject.children().map (index, el) ->
        ## push the value in values array if its
        ## found within the valueOrText
        value = el.value
        values.push(value) if value in valueOrText

        ## return the elements text + value
        {
          value: value
          text: $(el).text()
        }

      ## if we couldn't find anything by value then attempt
      ## to find it by text and insert its value into values arr
      if not values.length
        _.each options.get(), (obj, index) ->
          values.push(obj.value) if obj.text in valueOrText

      ## if we didnt set multiple to true and
      ## we have more than 1 option to set then blow up
      if not multiple and values.length > 1
        @throwErr(".select() matched than one option by value or text: #{valueOrText.join(", ")}")

      subject.val(values)

      ## yup manually create this change event
      ## 1.6.5. HTML event types
      ## scroll down the 'change'
      event = document.createEvent("HTMLEvents")
      event.initEvent("change", true, false)

      subject.get(0).dispatchEvent(event)

      return subject

  Cypress.addParentCommand
    focused: (options = {}) ->
      log = ($el) ->
        return if options.log is false

        Cypress.command
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
          command = Cypress.command
            $el: $el
            onConsole: -> onConsole

        @ensureVisibility $el, command

        if not isAcceptableElement($el)
          node   = Cypress.Utils.stringifyElement($el)
          word   = Cypress.Utils.plural(options.$el, "contains", "is")
          phrase = if type is "check" then " and :radio" else ""
          @throwErr ".#{type}() can only be called on :checkbox#{phrase}! Your subject #{word} a: #{node}", command

        ## if the checkbox was already checked
        ## then notify the user of this note
        ## and bail
        if isNoop($el)
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
          @command("click", {$el: $el, log: false, command: command, force: options.force}).then ->
            command.snapshot().end() if command

            return null

      ## return our original subject when our promise resolves
      Promise
        .resolve(options.$el.toArray())
        .each(checkOrUncheck)
        .cancellable()
        .return(options.$el)