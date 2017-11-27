_ = require("lodash")
Promise = require("bluebird")
bililiteRange = require("../../vendor/bililiteRange")

$Cypress = require("../cypress")

charsBetweenCurlyBraces = /({.+?})/

# Keyboard event map
# https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
keyStandardMap = {
  # Cypress keyboard key : Standard value
  "{backspace}": "Backspace",
  "{del}": "Delete",
  "{downarrow}": "ArrowDown",
  "{enter}": "Enter",
  "{esc}": "Escape",
  "{leftarrow}": "ArrowLeft",
  "{rightarrow}": "ArrowRight",
  "{uparrow}": "ArrowUp",
  "{alt}": "Alt",
  "{ctrl}": "Control",
  "{meta}": "Meta",
  "{shift}": "Shift"
}

$Keyboard = {
  keyToStandard: (key) ->
    keyStandardMap[key] || key

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

  modifierCodeMap: {
    alt: 18
    ctrl: 17
    meta: 91
    shift: 16
  }

  specialChars: {
    "{selectall}": (el, options) ->
      options.rng.bounds('all').select()

    ## charCode = 46
    ## no keyPress
    ## no textInput
    ## yes input (if value is actually changed)
    "{del}": (el, options) ->
      {rng} = options
      bounds = rng.bounds()
      if @boundsAreEqual(bounds)
        rng.bounds([bounds[0], bounds[0] + 1])
      options.charCode  = 46
      options.keypress  = false
      options.textInput = false
      options.setKey    = "{del}"
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
    "{backspace}": (el, options) ->
      {rng} = options
      bounds = rng.bounds()
      if @boundsAreEqual(bounds)
        rng.bounds([bounds[0] - 1, bounds[0]])
      options.charCode  = 8
      options.keypress  = false
      options.textInput = false
      options.setKey    = "{backspace}"
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
    "{esc}": (el, options) ->
      options.charCode  = 27
      options.keypress  = false
      options.textInput = false
      options.input     = false
      options.setKey    = "{esc}"
      @ensureKey el, null, options

    # "{tab}": (el, rng) ->

    "{{}": (el, options) ->
      options.key = "{"
      @typeKey(el, options.key, options)

    ## charCode = 13
    ## yes keyPress
    ## no textInput
    ## no input
    ## yes change (if input is different from last change event)
    "{enter}": (el, options) ->
      {rng} = options
      options.charCode  = 13
      options.textInput = false
      options.input     = false
      options.setKey    = "{enter}"
      @ensureKey el, "\n", options, ->
        rng.insertEOL()
        changed = options.prev isnt rng.all()
        options.onEnterPressed(changed, options.id)

    ## charCode = 37
    ## no keyPress
    ## no textInput
    ## no input
    "{leftarrow}": (el, options) ->
      {rng} = options
      bounds = rng.bounds()
      options.charCode  = 37
      options.keypress  = false
      options.textInput = false
      options.input     = false
      options.setKey    = "{leftarrow}"
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

    ## charCode = 38
    ## no keyPress
    ## no textInput
    ## no input
    "{uparrow}": (el, options) ->
      options.charCode  = 38
      options.keypress  = false
      options.textInput = false
      options.input     = false
      options.setKey    = "{uparrow}"
      @ensureKey(el, null, options)

    ## charCode = 39
    ## no keyPress
    ## no textInput
    ## no input
    "{rightarrow}": (el, options) ->
      {rng} = options
      bounds = rng.bounds()
      options.charCode  = 39
      options.keypress  = false
      options.textInput = false
      options.input     = false
      options.setKey    = "{rightarrow}"
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

    ## charCode = 40
    ## no keyPress
    ## no textInput
    ## no input
    "{downarrow}": (el, options) ->
      options.charCode  = 40
      options.keypress  = false
      options.textInput = false
      options.input     = false
      options.setKey    = "{downarrow}"
      @ensureKey(el, null, options)
  }

  modifierChars: {
    "{alt}": "alt"
    "{option}": "alt"

    "{ctrl}": "ctrl"
    "{control}": "ctrl"

    "{meta}": "meta"
    "{command}": "meta"
    "{cmd}": "meta"

    "{shift}": "shift"
  }

  boundsAreEqual: (bounds) ->
    bounds[0] is bounds[1]

  type: (options = {}) ->
    _.defaults(options, {
      delay: 10
      onEvent: ->
      onBeforeEvent: ->
      onBeforeType: ->
      onTypeChange: ->
      onEnterPressed: ->
      onNoMatchingSpecialChars: ->
      onBeforeSpecialCharAction: ->
    })

    el = options.$el.get(0)

    bililiteRangeSelection = el.bililiteRangeSelection
    rng = bililiteRange(el).bounds("selection")

    ## if the value has changed since previously typing, we need to
    ## update the caret position if the value has changed
    if el.prevValue and @expectedValueDoesNotMatchCurrentValue(el.prevValue, rng)
      @moveCaretToEnd(rng)
      el.prevValue = rng.all()
      bililiteRangeSelection = el.bililiteRangeSelection = rng.bounds()

    ## store the previous text value
    ## so we know to fire change events
    ## and change callbacks
    options.prev = rng.all()

    resetBounds = (start, end) ->
      if start? and end?
        bounds = [start, end]
      else
        len = rng.length()
        bounds = [len, len]

      ## resets the bounds to the
      ## end of the element's text
      if not _.isEqual(rng._bounds, bounds)
        el.bililiteRangeSelection = bounds
        rng.bounds(bounds)

    ## restore the bounds if our el already has this
    if bililiteRangeSelection
      rng.bounds(bililiteRangeSelection)
    else
      ## native date/moth/datetime/time input types
      ## do not have selectionStart so we have to
      ## manually fix the range on those elements.
      ## we know we need to do that when
      ## el.selectionStart throws or if the element
      ## does not have a selectionStart property
      try
        if "selectionStart" of el
          el.selectionStart
        else
          resetBounds()
      catch
        ## currently if this throws we're likely on
        ## a native input type (number, etc)
        ## and we're just going to take a shortcut here
        ## by figuring out if there is currently a
        ## selection range of the window. whatever that
        ## value is we need to set the range of the el.
        ## now this will fail if there is a PARTIAL range
        ## for instance if our element has value of: 121234
        ## and the selection range is '12' we cannot know
        ## if it is the [0,1] index or the [2,3] index. to
        ## fix this we need to walk forward and backward by
        ## s.modify('extend', 'backward', 'character') until
        ## we can definitely figure out where the selection is
        ## check if this fires selectionchange events. if it does
        ## we may need an option that enables to use to simply
        ## silence these events, or perhaps just TELL US where
        ## to type via the index.
        try
          selection = el.ownerDocument.getSelection().toString()
          index = options.$el.val().indexOf(selection)
          if selection.length and index > -1
            resetBounds(index, selection.length)
          else
            resetBounds()
        catch
          resetBounds()

    keys = options.chars.split(charsBetweenCurlyBraces).map (chars) ->
      if charsBetweenCurlyBraces.test(chars)
        ## allow special chars and modifiers to be case-insensitive
        chars.toLowerCase()
      else
        chars

    options.onBeforeType @countNumIndividualKeyStrokes(keys)

    ## should make each keystroke async to mimic
    ## how keystrokes come into javascript naturally
    Promise
    .each keys, (key) =>
      @typeChars(el, rng, key, options)
    .then =>
      ## if after typing we ended up changing
      ## our value then fire the onTypeChange callback
      if @expectedValueDoesNotMatchCurrentValue(options.prev, rng)
        options.onTypeChange()

      ## after typing be sure to clear all ranges
      if sel = options.window.getSelection()
        sel.removeAllRanges()

      unless options.release is false
        @resetModifiers(el, options.window)

  countNumIndividualKeyStrokes: (keys) ->
    _.reduce keys, (memo, chars) =>
      ## special chars count as 1 keystroke
      if @isSpecialChar(chars)
        memo + 1
      ## modifiers don't count as keystrokes
      else if @isModifier(chars)
        memo
      else
        memo + chars.length
    , 0

  typeChars: (el, rng, chars, options) ->
    options = _.clone(options)
    options.rng = rng

    switch
      when @isSpecialChar(chars)
        Promise
        .resolve @handleSpecialChars(el, chars, options)
        .delay(options.delay)

      when @isModifier(chars)
        Promise
        .resolve @handleModifier(el, chars, options)
        .delay(options.delay)

      when charsBetweenCurlyBraces.test(chars)
        ## between curly braces, but not a valid special
        ## char or modifier
        allChars = _.keys(@specialChars).concat(_.keys(@modifierChars)).join(", ")

        Promise
        .resolve options.onNoMatchingSpecialChars(chars, allChars)
        .delay(options.delay)

      else
        Promise
        .each chars.split(""), (char) =>
          Promise
          .resolve @typeKey(el, char, options)
          .delay(options.delay)

  getCharCode: (key) ->
    code = key.charCodeAt(0)
    @charCodeMap[code] ? code

  expectedValueDoesNotMatchCurrentValue: (expected, rng) ->
    expected isnt rng.all()

  moveCaretToEnd: (rng) ->
    len = rng.length()
    rng.bounds [len, len]

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
        location: 0
        repeat: false
      }
      @mixinModifiers(event)

    if keys
      # special key like "{enter}" might have 'key = \n'
      # in which case the original intent will be in options.setKey
      # "normal" keys will have their value in "key" argument itself
      standardKey = $Keyboard.keyToStandard(options.setKey || key)
      _.extend event, {
        charCode: charCode
        detail: 0
        key: standardKey
        keyCode: keyCode
        layerX: 0
        layerY: 0
        pageX: 0
        pageY: 0
        view: options.window
        which: which
      }

    args = [options.id, key, eventType, charCodeAt]

    ## give the driver a chance to bail on this event
    ## if we return false here
    return if options.onBeforeEvent.apply(@, args) is false

    dispatched = el.dispatchEvent(event)

    args.push(dispatched)

    options.onEvent.apply(@, args)

    return dispatched

  typeKey: (el, key, options) ->
    ## if we have an afterKey value it means
    ## we've typed in prior to this
    if after = options.afterKey
      ## if this afterKey value is no longer the current value
      ## then something has altered the value and we need to
      ## automatically shift the caret to the end like a real browser
      if @expectedValueDoesNotMatchCurrentValue(after, options.rng)
        @moveCaretToEnd(options.rng)

    @ensureKey el, key, options, ->
      options.updateValue(options.rng, key)
      ## update the selection that's cached on the element
      ## and store the value for comparison in any future typing
      el.bililiteRangeSelection = options.rng.bounds()
      el.prevValue = el.value

  ensureKey: (el, key, options, fn) ->
    options.id        = _.uniqueId("char")
    options.beforeKey = options.rng.all()

    maybeUpdateValueAndFireInput = =>
      ## only call this function if we haven't been told not to
      if fn and options.onBeforeSpecialCharAction(options.id, options.key) isnt false
        fn.call(@)

      @simulateKey(el, "input", key, options)

    if @simulateKey(el, "keydown", key, options)
      if @simulateKey(el, "keypress", key, options)
        if @simulateKey(el, "textInput", key, options)

          ml = el.maxLength

          ## maxlength is -1 by default when omitted
          ## but could also be null or undefined :-/
          if ml is 0 or ml > 0
            ## check if we should update the value
            ## and fire the input event
            ## as long as we're under maxlength
            if el.value.length < ml
              maybeUpdateValueAndFireInput()
          else
            maybeUpdateValueAndFireInput()

          ## store the afterKey value so we know
          ## if something mutates the value between typing keys
          options.afterKey = options.rng.all()

    @simulateKey(el, "keyup", key, options)

  isSpecialChar: (chars) ->
    !!@specialChars[chars]

  handleSpecialChars: (el, chars, options) ->
    options.key = chars
    @specialChars[chars].call(@, el, options)

  modifiers: {
    alt: false
    ctrl: false
    meta: false
    shift: false
  }

  isModifier: (chars) ->
    !!@modifierChars[chars]

  handleModifier: (el, chars, options) ->
    modifier = @modifierChars[chars]

    ## do nothing if already activated
    return if @modifiers[modifier]

    @modifiers[modifier] = true
    @simulateModifier(el, "keydown", modifier, options)

  simulateModifier: (el, eventType, modifier, options) ->
    @simulateKey(el, eventType, null, _.extend(options, {
      charCode: @modifierCodeMap[modifier]
      id: _.uniqueId("char")
      key: "<#{modifier}>"
    }))

  mixinModifiers: (event) ->
    _.extend(event, {
      altKey: @modifiers.alt
      ctrlKey: @modifiers.ctrl
      metaKey: @modifiers.meta
      shiftKey: @modifiers.shift
    })

  activeModifiers: ->
    _.reduce @modifiers, (memo, isActivated, modifier) ->
      memo.push(modifier) if isActivated
      memo
    , []

  resetModifiers: (el, window) ->
    for modifier, isActivated of @modifiers
      @modifiers[modifier] = false
      if isActivated
        @simulateModifier(el, "keyup", modifier, {
          window: window
          onBeforeEvent: ->
          onEvent: ->
        })
}

$Cypress.Keyboard = $Keyboard

module.exports = $Keyboard
