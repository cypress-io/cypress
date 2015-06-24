$Cypress.Keyboard = do ($Cypress, _, Promise, bililiteRange) ->

  charsBetweenCurlyBraces = /({.+?})/

  return {
    specialChars: {
      "{selectall}": (el, rng) ->
        rng.bounds('all').select()

      ## charCode = 46
      ## no keyPress
      ## yes input
      "{del}": (el, rng, options) ->
        bounds = rng.bounds()
        if @boundsAreEqual(bounds)
          rng.bounds([bounds[0], bounds[0] + 1])
        options.charCode = 46
        options.keyPress = false
        @ensureKey el, null, options, ->
          rng.text("", "end")

      ## charCode = 8
      ## no keyPress
      ## yes input
      "{backspace}": (el, rng, options) ->
        bounds = rng.bounds()
        if @boundsAreEqual(bounds)
          rng.bounds([bounds[0] - 1, bounds[0]])
        options.charCode = 8
        options.keyPress = false
        @ensureKey el, null, options, ->
          rng.text("", "end")

      "{esc}": (el, rng) ->

      "{tab}": (el, rng) ->

      "{{}": (el, rng) ->

      "{enter}": (el, rng, options) ->
        options.charCode = 13
        @ensureKey el, "\n", options, ->
          rng.insertEOL()
          #options.onEnterPressed

      "{leftarrow}": (el, rng, options) ->
        bounds = rng.bounds()
        options.charCode = 37
        options.keyPress = false
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

      "{rightarrow}": (el, rng, options) ->
        bounds = rng.bounds()
        options.charCode = 39
        options.keyPress = false
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
      new Promise (resolve, reject) =>
        _.defaults options,
          delay: 10
          onNoMatchingSpecialChars: ->
          onEnterPressed: ->

        el = options.$el.get(0)

        ## if el does not have this property
        bililiteRangeSelection = el.bililiteRangeSelection
        rng = bililiteRange(el).bounds("selection")

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

        ## should make each keystroke async to mimic
        ## how keystrokes come into javascript naturally
        _.each options.chars.split(charsBetweenCurlyBraces), (chars) =>
          @typeChars(el, rng, chars, options)

        ## after typing be sure to clear all ranges
        if sel = options.window.getSelection()
          sel.removeAllRanges()

        resolve()

    typeChars: (el, rng, chars, options) ->
      if charsBetweenCurlyBraces.test(chars)
        ## slice off the first and last curly brace
        @handleSpecialChars(el, rng, chars, options)
      else
        _.each chars, (char) =>
          @typeKey(el, rng, char, options)

    simulateKey: (el, eventType, key, options) ->
      ## bail if we've said not to fire a keyPress
      if eventType is "keypress" and options.keyPress is false
        return true

      event = new Event eventType, {
        bubbles: true
        cancelable: true
      }

      switch eventType
        when "keypress"
          charCodeAt = options.charCode ? key.charCodeAt(0)

          charCode = charCodeAt
          keyCode  = charCodeAt
          which    = charCodeAt
        else
          charCodeAt = options.charCode ? key.toUpperCase().charCodeAt(0)

          charCode = 0
          keyCode  = charCodeAt
          which    = charCodeAt

      _.extend event, {
        altKey: false
        charCode: charCode
        ctrlKey: false
        detail: 0
        keyCode: keyCode
        layerX: 0
        layerY: 0
        location: 0
        metaKey: false
        pageX: 0
        pageY: 0
        repeat: false
        shiftKey: false
        view: options.window
        which: which
      }

      el.dispatchEvent(event)

    updateValue: (rng, key) ->
      rng.text(key, "end")
      # rng.sendkeys(key)

    typeKey: (el, rng, key, options) ->
      @ensureKey el, key, options, ->
        @updateValue(rng, key)

    ensureKey: (el, key, options, fn) ->
      if @simulateKey(el, "keydown", key, options)
        if @simulateKey(el, "keypress", key, options)
          fn.call(@)
      @simulateKey(el, "keyup", key, options)

    handleSpecialChars: (el, rng, chars, options) ->
      options = _.clone(options)

      if fn = @specialChars[chars]
        fn.call(@, el, rng, options)
      else
        allChars = _.keys(@specialChars).join(", ")
        options.onNoMatchingSpecialChars(chars, allChars)

    isNothingRange: (rng) ->
      try
        rng._nativeWrap()
      catch
        return true

      return false
  }
