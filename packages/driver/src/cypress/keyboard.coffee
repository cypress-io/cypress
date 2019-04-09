_ = require("lodash")
Promise = require("bluebird")
$elements = require("../dom/elements")
$selection = require("../dom/selection")
$Cypress = require("../cypress")

isSingleDigitRe = /^\d$/
isStartingDigitRe = /^\d/
charsBetweenCurlyBracesRe = /({.+?})/

# Keyboard event map
# https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
keyStandardMap = {
  # Cypress keyboard key : Standard value
  "{backspace}": "Backspace",
  "{insert}": "Insert",
  "{del}": "Delete",
  "{downarrow}": "ArrowDown",
  "{enter}": "Enter",
  "{esc}": "Escape",
  "{leftarrow}": "ArrowLeft",
  "{rightarrow}": "ArrowRight",
  "{uparrow}": "ArrowUp",
  "{home}": "Home",
  "{end}": "End",
  "{alt}": "Alt",
  "{ctrl}": "Control",
  "{meta}": "Meta",
  "{shift}": "Shift",
  "{pageup}": "PageUp",
  "{pagedown}": "PageDown"
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
    "{selectall}": $selection.selectAll

    ## charCode = 46
    ## no keyPress
    ## no textInput
    ## yes input (if value is actually changed)
    "{del}": (el, options) ->
      options.charCode  = 46
      options.keypress  = false
      options.textInput = false
      options.setKey    = "{del}"

      @ensureKey el, null, options, ->
        bounds = $selection.getSelectionBounds(el)

        if $selection.isCollapsed(el)
          ## if there's no text selected, delete the prev char
          ## if deleted char, send the input event
          options.input = $selection.deleteRightOfCursor(el)
          return

        ## text is selected, so delete the selection
        ## contents and send the input event
        $selection.deleteSelectionContents(el)
        options.input = true

        return

    ## charCode = 45
    ## no keyPress
    ## no textInput
    ## no input
    "{insert}": (el, options) ->
      options.charCode  = 45
      options.keypress  = false
      options.textInput = false
      options.input     = false
      options.setKey    = "{insert}"
      @ensureKey el, null, options


    ## charCode = 8
    ## no keyPress
    ## no textInput
    ## yes input (if value is actually changed)
    "{backspace}": (el, options) ->
      options.charCode  = 8
      options.keypress  = false
      options.textInput = false
      options.setKey    = "{backspace}"

      @ensureKey el, null, options, ->

        if $selection.isCollapsed(el)
          ## if there's no text selected, delete the prev char
          ## if deleted char, send the input event
          options.input = $selection.deleteLeftOfCursor(el)
          return

        ## text is selected, so delete the selection
        ## contents and send the input event
        $selection.deleteSelectionContents(el)
        options.input = true

        return


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
      options.charCode  = 13
      options.textInput = false
      options.input     = false
      options.setKey    = "{enter}"
      @ensureKey el, "\n", options, ->
        $selection.replaceSelectionContents(el, "\n")
        options.onEnterPressed(options.id)

    ## charCode = 37
    ## no keyPress
    ## no textInput
    ## no input
    "{leftarrow}": (el, options) ->
      options.charCode  = 37
      options.keypress  = false
      options.textInput = false
      options.input     = false
      options.setKey    = "{leftarrow}"
      @ensureKey el, null, options, ->
        $selection.moveCursorLeft(el)

    ## charCode = 39
    ## no keyPress
    ## no textInput
    ## no input
    "{rightarrow}": (el, options) ->
      options.charCode  = 39
      options.keypress  = false
      options.textInput = false
      options.input     = false
      options.setKey    = "{rightarrow}"
      @ensureKey el, null, options, ->
        $selection.moveCursorRight(el)

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
      @ensureKey el, null, options, ->
        $selection.moveCursorUp(el)


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
      @ensureKey el, null, options, ->
        $selection.moveCursorDown(el)

    ## charCode = 36
    ## no keyPress
    ## no textInput
    ## no input
    "{home}": (el, options) ->
      options.charCode  = 36
      options.keypress  = false
      options.textInput = false
      options.input     = false
      options.setKey    = "{home}"
      @ensureKey el, null, options, ->
        $selection.moveCursorToLineStart(el)

    ## charCode = 35
    ## no keyPress
    ## no textInput
    ## no input
    "{end}": (el, options) ->
      options.charCode  = 35
      options.keypress  = false
      options.textInput = false
      options.input     = false
      options.setKey    = "{end}"
      @ensureKey el, null, options, ->
        $selection.moveCursorToLineEnd(el)


    ## charCode = 33
    ## no keyPress
    ## no textInput
    ## no input
   "{pageup}": (el, options) ->
      options.charCode  = 33
      options.keypress  = false
      options.textInput = false
      options.input     = false
      options.setKey    = "{pageup}"
      @ensureKey el, null, options


    ## charCode = 34
    ## no keyPress
    ## no textInput
    ## no input
    "{pagedown}": (el, options) ->
      options.charCode  = 34
      options.keypress  = false
      options.textInput = false
      options.input     = false
      options.setKey    = "{pagedown}"
      @ensureKey el, null, options
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
      onValueChange: ->
      onEnterPressed: ->
      onNoMatchingSpecialChars: ->
      onBeforeSpecialCharAction: ->
    })

    el = options.$el.get(0)

    keys = options.chars.split(charsBetweenCurlyBracesRe).map (chars) ->
      if charsBetweenCurlyBracesRe.test(chars)
        ## allow special chars and modifiers to be case-insensitive
        chars.toLowerCase()
      else
        chars

    options.onBeforeType @countNumIndividualKeyStrokes(keys)

    ## should make each keystroke async to mimic
    ## how keystrokes come into javascript naturally
    Promise
    .each keys, (key) =>
      @typeChars(el, key, options)
    .then =>
      if options.release isnt false
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

  typeChars: (el, chars, options) ->
    options = _.clone(options)

    switch
      when @isSpecialChar(chars)
        Promise
        .resolve @handleSpecialChars(el, chars, options)
        .delay(options.delay)

      when @isModifier(chars)
        Promise
        .resolve @handleModifier(el, chars, options)
        .delay(options.delay)

      when charsBetweenCurlyBracesRe.test(chars)
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

  getKeyCode: (key) ->
    code = key.charCodeAt(0)
    @charCodeMap[code] ? code

  getAsciiCode: (key) ->
    code = key.charCodeAt(0)
    return code

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
        keyCode = options.charCode ? @getKeyCode(key.toUpperCase())

        charCode = 0
        keyCode  = keyCode
        which    = keyCode

      when "keypress"
        asciiCode = options.charCode ? @getAsciiCode(key)

        charCode = asciiCode
        keyCode  = asciiCode
        which    = asciiCode

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

    args = [options.id, key, eventType, which]

    ## give the driver a chance to bail on this event
    ## if we return false here
    return if options.onBeforeEvent.apply(@, args) is false

    dispatched = el.dispatchEvent(event)

    args.push(dispatched)

    options.onEvent.apply(@, args)

    return dispatched

  typeKey: (el, key, options) ->
    @ensureKey el, key, options, ->

      isDigit = isSingleDigitRe.test(key)
      isNumberInputType = $elements.isInput(el) and $elements.isType(el, 'number')

      if isNumberInputType
        selectionStart = el.selectionStart
        valueLength = $elements.getNativeProp(el, "value").length
        isDigitsInText = isStartingDigitRe.test(options.chars)
        isValidCharacter = key is '.' or (key is '-' and valueLength)
        prevChar = options.prevChar

        if !isDigit and (isDigitsInText or !isValidCharacter or selectionStart isnt 0)
          options.prevChar = key
          return

        ## only type '.' and '-' if it is the first symbol and there already is a value, or if
        ## '.' or '-' are appended to a digit. If not, value cannot be set.
        if isDigit and (prevChar is '.' or (prevChar is '-' and !valueLength))
          options.prevChar = key
          key = prevChar + key

      options.updateValue(el, key)

  ensureKey: (el, key, options, fn) ->
    _.defaults(options, {
      prevText: null
    })

    options.id        = _.uniqueId("char")
    # options.beforeKey = el.value

    maybeUpdateValueAndFireInput = =>
      ## only call this function if we haven't been told not to
      if fn and options.onBeforeSpecialCharAction(options.id, options.key) isnt false
        if not $elements.isContentEditable(el)
          prevText = $elements.getNativeProp(el, "value")
        fn.call(@)

        if options.prevText is null and not $elements.isContentEditable(el)
          options.prevText = prevText
          options.onValueChange(options.prevText, el)

      @simulateKey(el, "input", key, options)

    if @simulateKey(el, "keydown", key, options)
      if @simulateKey(el, "keypress", key, options)
        if @simulateKey(el, "textInput", key, options)

          if $elements.isInput(el) or $elements.isTextarea(el)
            ml = el.maxLength

          ## maxlength is -1 by default when omitted
          ## but could also be null or undefined :-/
          ## only cafe if we are trying to type a key
          if (ml is 0 or ml > 0 ) and key
            ## check if we should update the value
            ## and fire the input event
            ## as long as we're under maxlength

            if $elements.getNativeProp(el, "value").length < ml
              maybeUpdateValueAndFireInput()
          else
            maybeUpdateValueAndFireInput()

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
