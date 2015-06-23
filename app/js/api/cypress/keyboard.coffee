$Cypress.Keyboard = do ($Cypress, _, Promise, bililiteRange) ->

  charsBetweenCurlyBraces = /({.+?})/

  return {
    specialChars: {
      "{selectall}": (rng) ->
        rng.bounds('all').select()

      ## we need to actually still fire
      ## the key events for deleting by
      ## typing the "backspace key"
      "{del}": (rng) ->
        bounds = rng.bounds()
        if bounds[0] is bounds[1]
          rng.bounds(bounds[0], bounds[0] + 1)
        rng.text("", "end")
    }

    type: (options = {}) ->
      new Promise (resolve, reject) =>
        _.defaults options,
          delay: 10
          onNoMatchingSpecialChars: ->

        el = options.$el.get(0)

        rng = bililiteRange(el).bounds("selection")

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
        @handleSpecialChars(rng, chars, options)
      else
        _.each chars, (char) =>
          @typeKey(el, rng, char, options)

    simulateKey: (el, type, key, options) ->
      event = new Event type, {
        bubbles: true
        cancelable: true
      }

      switch type
        when "keypress"
          charCodeAt = key.charCodeAt(0)

          charCode = charCodeAt
          keyCode  = charCodeAt
          which    = charCodeAt
        else
          charCodeAt = key.toUpperCase().charCodeAt(0)

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
      if @simulateKey(el, "keydown", key, options)
        if @simulateKey(el, "keypress", key, options)
          @updateValue(rng, key)
      @simulateKey(el, "keyup", key, options)

    handleSpecialChars: (rng, chars, options) ->
      if fn = @specialChars[chars]
        fn.call(@, rng)
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
