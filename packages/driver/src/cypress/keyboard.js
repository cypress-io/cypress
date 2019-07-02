const _ = require('lodash')
const Promise = require('bluebird')
const $elements = require('../dom/elements')
const $selection = require('../dom/selection')
const $Cypress = require('../cypress')

const isSingleDigitRe = /^\d$/
const isStartingDigitRe = /^\d/
const charsBetweenCurlyBracesRe = /({.+?})/

// Keyboard event map
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
const keyStandardMap = {
  // Cypress keyboard key : Standard value
  '{backspace}': 'Backspace',
  '{insert}': 'Insert',
  '{del}': 'Delete',
  '{downarrow}': 'ArrowDown',
  '{enter}': 'Enter',
  '{esc}': 'Escape',
  '{leftarrow}': 'ArrowLeft',
  '{rightarrow}': 'ArrowRight',
  '{uparrow}': 'ArrowUp',
  '{home}': 'Home',
  '{end}': 'End',
  '{alt}': 'Alt',
  '{ctrl}': 'Control',
  '{meta}': 'Meta',
  '{shift}': 'Shift',
  '{pageup}': 'PageUp',
  '{pagedown}': 'PageDown',
}

const $Keyboard = {
  keyToStandard (key) {
    return keyStandardMap[key] || key
  },

  charCodeMap: {
    33: 49, //# ! --- 1
    64: 50, //# @ --- 2
    35: 51, //# # --- 3
    36: 52, //# $ --- 4
    37: 53, //# % --- 5
    94: 54, //# ^ --- 6
    38: 55, //# & --- 7
    42: 56, //# * --- 8
    40: 57, //# ( --- 9
    41: 48, //# ) --- 0
    59: 186, //# ; --- 186
    58: 186, //# : --- 186
    61: 187, //# = --- 187
    43: 187, //# + --- 187
    44: 188, //# , --- 188
    60: 188, //# < --- 188
    45: 189, //# - --- 189
    95: 189, //# _ --- 189
    46: 190, //# . --- 190
    62: 190, //# > --- 190
    47: 191, //# / --- 191
    63: 191, //# ? --- 191
    96: 192, //# ` --- 192
    126: 192, //# ~ --- 192
    91: 219, //# [ --- 219
    123: 219, //# { --- 219
    92: 220, //# \ --- 220
    124: 220, //# | --- 220
    93: 221, //# ] --- 221
    125: 221, //# } --- 221
    39: 222, //# ' --- 222
    34: 222, //# " --- 222
  },

  modifierCodeMap: {
    alt: 18,
    ctrl: 17,
    meta: 91,
    shift: 16,
  },

  specialChars: {
    '{selectall}': $selection.selectAll,

    //# charCode = 46
    //# no keyPress
    //# no textInput
    //# yes input (if value is actually changed)
    '{del}' (el, options) {
      options.charCode = 46
      options.keypress = false
      options.textInput = false
      options.setKey = '{del}'

      return this.ensureKey(el, null, options, () => {
        $selection.getSelectionBounds(el)

        if ($selection.isCollapsed(el)) {
          //# if there's no text selected, delete the prev char
          //# if deleted char, send the input event
          options.input = $selection.deleteRightOfCursor(el)

          return
        }

        //# text is selected, so delete the selection
        //# contents and send the input event
        $selection.deleteSelectionContents(el)
        options.input = true

      })
    },

    //# charCode = 45
    //# no keyPress
    //# no textInput
    //# no input
    '{insert}' (el, options) {
      options.charCode = 45
      options.keypress = false
      options.textInput = false
      options.input = false
      options.setKey = '{insert}'

      return this.ensureKey(el, null, options)
    },

    //# charCode = 8
    //# no keyPress
    //# no textInput
    //# yes input (if value is actually changed)
    '{backspace}' (el, options) {
      options.charCode = 8
      options.keypress = false
      options.textInput = false
      options.setKey = '{backspace}'

      return this.ensureKey(el, null, options, () => {

        if ($selection.isCollapsed(el)) {
          //# if there's no text selected, delete the prev char
          //# if deleted char, send the input event
          options.input = $selection.deleteLeftOfCursor(el)

          return
        }

        //# text is selected, so delete the selection
        //# contents and send the input event
        $selection.deleteSelectionContents(el)
        options.input = true

      })
    },

    //# charCode = 27
    //# no keyPress
    //# no textInput
    //# no input
    '{esc}' (el, options) {
      options.charCode = 27
      options.keypress = false
      options.textInput = false
      options.input = false
      options.setKey = '{esc}'

      return this.ensureKey(el, null, options)
    },

    // "{tab}": (el, rng) ->

    '{{}' (el, options) {
      options.key = '{'

      return this.typeKey(el, options.key, options)
    },

    //# charCode = 13
    //# yes keyPress
    //# no textInput
    //# no input
    //# yes change (if input is different from last change event)
    '{enter}' (el, options) {
      options.charCode = 13
      options.textInput = false
      options.input = false
      options.setKey = '{enter}'

      return this.ensureKey(el, '\n', options, () => {
        $selection.replaceSelectionContents(el, '\n')

        return options.onEnterPressed(options.id)
      })
    },

    //# charCode = 37
    //# no keyPress
    //# no textInput
    //# no input
    '{leftarrow}' (el, options) {
      options.charCode = 37
      options.keypress = false
      options.textInput = false
      options.input = false
      options.setKey = '{leftarrow}'

      return this.ensureKey(el, null, options, () => {
        return $selection.moveCursorLeft(el)
      })
    },

    //# charCode = 39
    //# no keyPress
    //# no textInput
    //# no input
    '{rightarrow}' (el, options) {
      options.charCode = 39
      options.keypress = false
      options.textInput = false
      options.input = false
      options.setKey = '{rightarrow}'

      return this.ensureKey(el, null, options, () => {
        return $selection.moveCursorRight(el)
      })
    },

    //# charCode = 38
    //# no keyPress
    //# no textInput
    //# no input
    '{uparrow}' (el, options) {
      options.charCode = 38
      options.keypress = false
      options.textInput = false
      options.input = false
      options.setKey = '{uparrow}'

      return this.ensureKey(el, null, options, () => {
        return $selection.moveCursorUp(el)
      })
    },

    //# charCode = 40
    //# no keyPress
    //# no textInput
    //# no input
    '{downarrow}' (el, options) {
      options.charCode = 40
      options.keypress = false
      options.textInput = false
      options.input = false
      options.setKey = '{downarrow}'

      return this.ensureKey(el, null, options, () => {
        return $selection.moveCursorDown(el)
      })
    },

    //# charCode = 36
    //# no keyPress
    //# no textInput
    //# no input
    '{home}' (el, options) {
      options.charCode = 36
      options.keypress = false
      options.textInput = false
      options.input = false
      options.setKey = '{home}'

      return this.ensureKey(el, null, options, () => {
        return $selection.moveCursorToLineStart(el)
      })
    },

    //# charCode = 35
    //# no keyPress
    //# no textInput
    //# no input
    '{end}' (el, options) {
      options.charCode = 35
      options.keypress = false
      options.textInput = false
      options.input = false
      options.setKey = '{end}'

      return this.ensureKey(el, null, options, () => {
        return $selection.moveCursorToLineEnd(el)
      })
    },

    //# charCode = 33
    //# no keyPress
    //# no textInput
    //# no input
    '{pageup}' (el, options) {
      options.charCode = 33
      options.keypress = false
      options.textInput = false
      options.input = false
      options.setKey = '{pageup}'

      return this.ensureKey(el, null, options)
    },

    //# charCode = 34
    //# no keyPress
    //# no textInput
    //# no input
    '{pagedown}' (el, options) {
      options.charCode = 34
      options.keypress = false
      options.textInput = false
      options.input = false
      options.setKey = '{pagedown}'

      return this.ensureKey(el, null, options)
    },
  },

  modifierChars: {
    '{alt}': 'alt',
    '{option}': 'alt',

    '{ctrl}': 'ctrl',
    '{control}': 'ctrl',

    '{meta}': 'meta',
    '{command}': 'meta',
    '{cmd}': 'meta',

    '{shift}': 'shift',
  },

  boundsAreEqual (bounds) {
    return bounds[0] === bounds[1]
  },

  type (options = {}) {
    _.defaults(options, {
      delay: 10,
      onEvent () {},
      onBeforeEvent () {},
      onBeforeType () {},
      onValueChange () {},
      onEnterPressed () {},
      onNoMatchingSpecialChars () {},
      onBeforeSpecialCharAction () {},
    })

    const el = options.$el.get(0)

    const keys = options.chars.split(charsBetweenCurlyBracesRe).map((chars) => {
      if (charsBetweenCurlyBracesRe.test(chars)) {
        //# allow special chars and modifiers to be case-insensitive
        return chars.toLowerCase()
      }

      return chars

    })

    options.onBeforeType(this.countNumIndividualKeyStrokes(keys))

    //# should make each keystroke async to mimic
    //# how keystrokes come into javascript naturally
    return Promise
    .each(keys, (key) => {
      return this.typeChars(el, key, options)
    }).then(() => {
      if (options.release !== false) {
        return this.resetModifiers(el, options.window)
      }
    })
  },

  countNumIndividualKeyStrokes (keys) {
    return _.reduce(keys, (memo, chars) => {
      //# special chars count as 1 keystroke
      if (this.isSpecialChar(chars)) {
        return memo + 1
      //# modifiers don't count as keystrokes
      }

      if (this.isModifier(chars)) {
        return memo
      }

      return memo + chars.length

    }
    , 0)
  },

  typeChars (el, chars, options) {
    options = _.clone(options)

    switch (false) {
      case !this.isSpecialChar(chars): {
        return Promise
        .resolve(this.handleSpecialChars(el, chars, options))
        .delay(options.delay)
      }
      case !this.isModifier(chars): {
        return Promise
        .resolve(this.handleModifier(el, chars, options))
        .delay(options.delay)
      }
      case !charsBetweenCurlyBracesRe.test(chars): {
        //# between curly braces, but not a valid special
        //# char or modifier
        const allChars = _.keys(this.specialChars).concat(_.keys(this.modifierChars)).join(', ')

        return Promise
        .resolve(options.onNoMatchingSpecialChars(chars, allChars))
        .delay(options.delay)
      }
      default: {
        return Promise
        .each(chars.split(''), (char) => {
          return Promise
          .resolve(this.typeKey(el, char, options))
          .delay(options.delay)
        })
      }
    }
  },

  getKeyCode (key) {
    const code = key.charCodeAt(0)

    return this.charCodeMap[code] != null ? this.charCodeMap[code] : code
  },

  getAsciiCode (key) {
    const code = key.charCodeAt(0)

    return code
  },

  expectedValueDoesNotMatchCurrentValue (expected, rng) {
    return expected !== rng.all()
  },

  moveCaretToEnd (rng) {
    const len = rng.length()

    return rng.bounds([len, len])
  },

  simulateKey (el, eventType, key, options) {
    //# bail if we've said not to fire this specific event
    //# in our options

    let charCode
    let keyCode
    let which

    if (options[eventType] === false) {
      return true
    }

    key = options.key != null ? options.key : key

    let keys = true
    let otherKeys = true

    const event = new Event(eventType, {
      bubbles: true,
      cancelable: eventType !== 'input',
    })

    switch (eventType) {
      case 'keydown': case 'keyup': {
        keyCode = options.charCode != null ? options.charCode : this.getKeyCode(key.toUpperCase())

        charCode = 0
        which = keyCode
        break
      }
      case 'keypress': {
        const asciiCode = options.charCode != null ? options.charCode : this.getAsciiCode(key)

        charCode = asciiCode
        keyCode = asciiCode
        which = asciiCode
        break
      }
      case 'textInput': {
        charCode = 0
        keyCode = 0
        which = 0
        otherKeys = false
        _.extend(event, {
          data: key,
        })
        break
      }

      case 'input': {
        keys = false
        otherKeys = false
        break
      }

      default: null
    }

    if (otherKeys) {
      _.extend(event, {
        location: 0,
        repeat: false,
      })
      this.mixinModifiers(event)
    }

    if (keys) {
      // special key like "{enter}" might have 'key = \n'
      // in which case the original intent will be in options.setKey
      // "normal" keys will have their value in "key" argument itself
      const standardKey = $Keyboard.keyToStandard(options.setKey || key)

      _.extend(event, {
        charCode,
        detail: 0,
        key: standardKey,
        keyCode,
        layerX: 0,
        layerY: 0,
        pageX: 0,
        pageY: 0,
        view: options.window,
        which,
      })
    }

    const args = [options.id, key, eventType, which]

    //# give the driver a chance to bail on this event
    //# if we return false here
    if (options.onBeforeEvent.apply(this, args) === false) {
      return
    }

    const dispatched = el.dispatchEvent(event)

    args.push(dispatched)

    options.onEvent.apply(this, args)

    return dispatched
  },

  typeKey (el, key, options) {
    return this.ensureKey(el, key, options, () => {

      const isDigit = isSingleDigitRe.test(key)
      const isNumberInputType = $elements.isInput(el) && $elements.isType(el, 'number')

      if (isNumberInputType) {
        const { selectionStart } = el
        const valueLength = $elements.getNativeProp(el, 'value').length
        const isDigitsInText = isStartingDigitRe.test(options.chars)
        const isValidCharacter = (key === '.') || ((key === '-') && valueLength)
        const { prevChar } = options

        if (!isDigit && (isDigitsInText || !isValidCharacter || (selectionStart !== 0))) {
          options.prevChar = key

          return
        }

        //# only type '.' and '-' if it is the first symbol and there already is a value, or if
        //# '.' or '-' are appended to a digit. If not, value cannot be set.
        if (isDigit && ((prevChar === '.') || ((prevChar === '-') && !valueLength))) {
          options.prevChar = key
          key = prevChar + key
        }
      }

      return options.updateValue(el, key)
    })
  },

  ensureKey (el, key, options, fn) {
    _.defaults(options, {
      prevText: null,
    })

    options.id = _.uniqueId('char')
    // options.beforeKey = el.value

    const maybeUpdateValueAndFireInput = () => {
      //# only call this function if we haven't been told not to
      if (fn && (options.onBeforeSpecialCharAction(options.id, options.key) !== false)) {
        let prevText

        if (!$elements.isContentEditable(el)) {
          prevText = $elements.getNativeProp(el, 'value')
        }

        fn.call(this)

        if ((options.prevText === null) && !$elements.isContentEditable(el)) {
          options.prevText = prevText
          options.onValueChange(options.prevText, el)
        }
      }

      return this.simulateKey(el, 'input', key, options)
    }

    if (this.simulateKey(el, 'keydown', key, options)) {
      if (this.simulateKey(el, 'keypress', key, options)) {
        if (this.simulateKey(el, 'textInput', key, options)) {

          let ml

          if ($elements.isInput(el) || $elements.isTextarea(el)) {
            ml = el.maxLength
          }

          //# maxlength is -1 by default when omitted
          //# but could also be null or undefined :-/
          //# only cafe if we are trying to type a key
          if (((ml === 0) || (ml > 0)) && key) {
            //# check if we should update the value
            //# and fire the input event
            //# as long as we're under maxlength

            if ($elements.getNativeProp(el, 'value').length < ml) {
              maybeUpdateValueAndFireInput()
            }
          } else {
            maybeUpdateValueAndFireInput()
          }
        }
      }
    }

    return this.simulateKey(el, 'keyup', key, options)
  },

  isSpecialChar (chars) {
    let needle

    return (needle = chars, _.keys(this.specialChars).includes(needle))
  },

  handleSpecialChars (el, chars, options) {
    options.key = chars

    return this.specialChars[chars].call(this, el, options)
  },

  modifiers: {
    alt: false,
    ctrl: false,
    meta: false,
    shift: false,
  },

  isModifier (chars) {
    let needle

    return (needle = chars, _.keys(this.modifierChars).includes(needle))
  },

  handleModifier (el, chars, options) {
    const modifier = this.modifierChars[chars]

    //# do nothing if already activated
    if (this.modifiers[modifier]) {
      return
    }

    this.modifiers[modifier] = true

    return this.simulateModifier(el, 'keydown', modifier, options)
  },

  simulateModifier (el, eventType, modifier, options) {
    return this.simulateKey(el, eventType, null, _.extend(options, {
      charCode: this.modifierCodeMap[modifier],
      id: _.uniqueId('char'),
      key: `<${modifier}>`,
    }))
  },

  mixinModifiers (event) {
    return _.extend(event, {
      altKey: this.modifiers.alt,
      ctrlKey: this.modifiers.ctrl,
      metaKey: this.modifiers.meta,
      shiftKey: this.modifiers.shift,
    })
  },

  activeModifiers () {
    return _.reduce(this.modifiers, (memo, isActivated, modifier) => {
      if (isActivated) {
        memo.push(modifier)
      }

      return memo
    }
    , [])
  },

  resetModifiers (el, window) {
    return (() => {
      const result = []

      for (let modifier in this.modifiers) {
        const isActivated = this.modifiers[modifier]

        this.modifiers[modifier] = false
        if (isActivated) {
          result.push(this.simulateModifier(el, 'keyup', modifier, {
            window,
            onBeforeEvent () {},
            onEvent () {},
          }))
        } else {
          result.push(undefined)
        }
      }

      return result
    })()
  },
}

$Cypress.Keyboard = $Keyboard

module.exports = $Keyboard
