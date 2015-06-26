$Cypress.Keyboard = do ($Cypress, _, Promise, bililiteRange) ->

  charsBetweenCurlyBraces = /({.+?})/

  return {
    charCodeMap: {
      33:  49,  ## ! --- 1
      64:  50,  ## @ --- 2
      35:  51,  ## # --- 3
      36:  52,  ## $ --- 4
      37:  53,  ## % --- 5
      94:  54,  ## ^ --- 6
      38:  55,  ## & --- 7
      42:  56,  ## * --- 8
      40:  57,  ## ( --- 9
      41:  48,  ## ) --- 0
      59:  186, ## ; --- 186
      58:  186, ## : --- 186
      61:  187, ## = --- 187
      43:  187, ## + --- 187
      44:  188, ## , --- 188
      60:  188, ## < --- 188
      45:  189, ## - --- 189
      95:  189, ## _ --- 189
      46:  190, ## . --- 190
      62:  190, ## > --- 190
      47:  191, ## / --- 191
      63:  191, ## ? --- 191
      96:  192, ## ` --- 192
      126: 192, ## ~ --- 192
      91:  219, ## [ --- 219
      123: 219, ## { --- 219
      92:  220, ## \ --- 220
      124: 220, ## | --- 220
      93:  221, ## ] --- 221
      125: 221, ## } --- 221
      39:  222, ## ' --- 222
      34:  222  ## " --- 222
    }

    specialChars: {
      "{selectall}": (el, rng) ->
        rng.bounds('all').select()

      ## charCode = 46
      ## no keyPress
      ## no textInput
      ## yes input (if value is actually changed)
      "{del}": (el, rng, options) ->
        bounds = rng.bounds()
        if @boundsAreEqual(bounds)
          rng.bounds([bounds[0], bounds[0] + 1])
        options.charCode = 46
        options.keypress = false
        options.textInput = false
        @ensureKey el, null, options, ->
          prev = rng.all()
          rng.text("", "end")

          ## after applying the {del}
          ## if our text didnt change
          ## dont send the input event
          if prev is rng.all()
            options.input = false

      ## charCode = 8
      ## no keyPress
      ## no textInput
      ## yes input (if value is actually changed)
      "{backspace}": (el, rng, options) ->
        bounds = rng.bounds()
        if @boundsAreEqual(bounds)
          rng.bounds([bounds[0] - 1, bounds[0]])
        options.charCode  = 8
        options.keypress  = false
        options.textInput = false
        @ensureKey el, null, options, ->
          prev = rng.all()
          rng.text("", "end")

          ## after applying the {backspace}
          ## if our text didnt change
          ## dont send the input event
          if prev is rng.all()
            options.input = false

      ## charCode = 27
      ## no keyPress
      ## no textInput
      ## no input
      "{esc}": (el, rng, options) ->
        options.charCode  = 27
        options.keypress  = false
        options.textInput = false
        options.input     = false
        @ensureKey el, null, options

      # "{tab}": (el, rng) ->

      "{{}": (el, rng, options) ->
        options.key = "{"
        @typeKey(el, rng, options.key, options)

      ## charCode = 13
      ## yes keyPress
      ## no textInput
      ## no input
      ## yes change (if input is different from last change event)
      "{enter}": (el, rng, options) ->
        options.charCode  = 13
        options.textInput = false
        options.input     = false
        @ensureKey el, "\n", options, ->
          rng.insertEOL()
          changed = options.prev isnt rng.all()
          options.onEnterPressed(changed, options.id)

      ## charCode = 37
      ## no keyPress
      ## no textInput
      ## no input
      "{leftarrow}": (el, rng, options) ->
        bounds = rng.bounds()
        options.charCode  = 37
        options.keypress  = false
        options.textInput = false
        options.input     = false
        @ensureKey el, null, options, ->
          switch
            when @boundsAreEqual(bounds)
              ## if bounds are equal move the caret
              ## 1 to the left
              left  = bounds[0] - 1
              right = left
            when bounds[0] > 0
              ## just set the cursor back to the left
              ## position
              left = bounds[0]
              right = left
            else
              left = 0
              right = 0

          rng.bounds([left, right])

      ## charCode = 39
      ## no keyPress
      ## no textInput
      ## no input
      "{rightarrow}": (el, rng, options) ->
        bounds = rng.bounds()
        options.charCode  = 39
        options.keypress  = false
        options.textInput = false
        options.input     = false
        @ensureKey el, null, options, ->
          switch
            when @boundsAreEqual(bounds)
              ## if bounds are equal move the caret
              ## 1 to the right
              left  = bounds[0] + 1
              right = left
            else
              ## just set the cursor back to the left
              ## position
              right = bounds[1]
              left = right

          rng.bounds([left, right])
    }

    boundsAreEqual: (bounds) ->
      bounds[0] is bounds[1]

    type: (options = {}) ->
      _.defaults options,
        delay: 10
        onEvent: ->
        onBeforeType: ->
        onTypeChange: ->
        onEnterPressed: ->
        onNoMatchingSpecialChars: ->

      el = options.$el.get(0)

      ## if el does not have this property
      bililiteRangeSelection = el.bililiteRangeSelection
      rng = bililiteRange(el).bounds("selection")

      ## store the previous text value
      ## so we know to fire change events
      ## and change callbacks
      options.prev = rng.all()

      ## restore the bounds if our el already has this
      if bililiteRangeSelection
        rng.bounds(bililiteRangeSelection)
      else
        ## if our input is one of these, then
        ## simulate each key stroke, ensure none
        ## are defaultPrevented, but only change
        ## the value once everything has been typed
        # if /date|month|datetime|time/.test(type)
          ## throw an error if value is invalid
          ## use a switch/case here

        if len = rng.length()
          bounds = [len, len]
          if not _.isEqual(rng._bounds, bounds)
            el.bililiteRangeSelection = bounds
            rng._bounds = bounds

      keys = options.chars.split(charsBetweenCurlyBraces)

      options.onBeforeType @countNumIndividualKeyStrokes(keys)

      promises = []

      ## should make each keystroke async to mimic
      ## how keystrokes come into javascript naturally
      Promise
        .each keys, (key) =>
          @typeChars(el, rng, key, promises, options)
        .cancellable()
        .then ->
          ## if after typing we ended up changing
          ## our value then fire the onTypeChange callback
          if options.prev isnt rng.all()
            options.onTypeChange()

          ## after typing be sure to clear all ranges
          if sel = options.window.getSelection()
            sel.removeAllRanges()
        .catch Promise.CancellationError, (err) ->
          _(promises).invoke("cancel")
          throw err

    countNumIndividualKeyStrokes: (keys) ->
      _.reduce keys, (memo, chars) ->
        ## chars in curly braces count as 1 keystroke
        if charsBetweenCurlyBraces.test(chars)
          memo + 1
        else
          memo + chars.length
      , 0

    typeChars: (el, rng, chars, promises, options) ->
      options = _.clone(options)

      if charsBetweenCurlyBraces.test(chars)
        p = Promise
          .resolve @handleSpecialChars(el, rng, chars, options)
          .delay(options.delay)
          .cancellable()
        promises.push(p)
        p
      else
        Promise
          .each chars.split(""), (char) =>
            p = Promise
              .resolve @typeKey(el, rng, char, options)
              .delay(options.delay)
              .cancellable()
            promises.push(p)
            p

    getCharCode: (key) ->
      code = key.charCodeAt(0)
      @charCodeMap[code] ? code

    simulateKey: (el, eventType, key, options) ->
      ## bail if we've said not to fire this specific event
      ## in our options
      return true if options[eventType] is false

      key = options.key ? key

      keys      = true
      otherKeys = true

      event = new Event eventType, {
        bubbles: true
        cancelable: eventType isnt "input"
      }

      switch eventType
        when "keydown", "keyup"
          charCodeAt = options.charCode ? @getCharCode(key.toUpperCase())

          charCode = 0
          keyCode  = charCodeAt
          which    = charCodeAt

        when "keypress"
          charCodeAt = options.charCode ? @getCharCode(key)

          charCode = charCodeAt
          keyCode  = charCodeAt
          which    = charCodeAt

        when "textInput"
          charCode  = 0
          keyCode   = 0
          which     = 0
          otherKeys = false

          _.extend event, {
            data: key
          }

        when "input"
          keys      = false
          otherKeys = false

      if otherKeys
        _.extend event, {
          altKey: false
          ctrlKey: false
          location: 0
          metaKey: false
          repeat: false
          shiftKey: false
        }

      if keys
        _.extend event, {
          charCode: charCode
          detail: 0
          keyCode: keyCode
          layerX: 0
          layerY: 0
          pageX: 0
          pageY: 0
          view: options.window
          which: which
        }

      dispatched = el.dispatchEvent(event)

      args = [options.id, key, eventType, dispatched]

      args.push(charCodeAt) if charCodeAt

      options.onEvent.apply(@, args)

      return dispatched

    updateValue: (rng, key) ->
      rng.text(key, "end")

    typeKey: (el, rng, key, options) ->
      @ensureKey el, key, options, ->
        @updateValue(rng, key)

    ensureKey: (el, key, options, fn) ->
      options.id = _.uniqueId("char")

      if @simulateKey(el, "keydown", key, options)
        if @simulateKey(el, "keypress", key, options)
          if @simulateKey(el, "textInput", key, options)
            fn.call(@) if fn
            @simulateKey(el, "input", key, options)
      @simulateKey(el, "keyup", key, options)

    handleSpecialChars: (el, rng, chars, options) ->
      if fn = @specialChars[chars]
        options.key = chars
        fn.call(@, el, rng, options)
      else
        allChars = _.keys(@specialChars).join(", ")
        options.onNoMatchingSpecialChars(chars, allChars)
  }
