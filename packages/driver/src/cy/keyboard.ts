import * as $elements from '../dom/elements'


import moment from 'moment'
import Promise from 'bluebird'
import $selection from '../dom/selection'
import $document from '../dom/document'
import UsKeyboardLayout from '../cypress/UsKeyboardLayout'
import $dom from '../dom'
import $utils from '../cypress/utils.coffee'
import $native from '../cypress/native_events'
import { HTMLTextLikeElement } from '../dom/elements';


export interface keyboardModifiers {
  alt: boolean
  ctrl: boolean
  meta: boolean
  shift: boolean
}

export interface KeyboardState {
  keyboardModifiers?: keyboardModifiers
  someotherstate: string
}

interface ProxyState<T> {
  <K extends keyof T>(arg: K): T[K] | undefined
  <K extends keyof T>(arg: K, arg2: T[K] | null): void
  }

export type State = ProxyState<KeyboardState>

const _ = Cypress._

const dateRegex = /^\d{4}-\d{2}-\d{2}/
const monthRegex = /^\d{4}-(0\d|1[0-2])/
const weekRegex = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])/
const timeRegex = /^([0-1]\d|2[0-3]):[0-5]\d(:[0-5]\d)?(\.[0-9]{1,3})?/
const dateTimeRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}/
const clearRegex = /^{selectall}{del}/i


interface KeyDetailsPartial extends Partial<KeyDetails> {
  key: string
}

interface KeyDetails {
  key: string
  text: string
  code: string
  keyCode: number
  location: number
  shiftKey?: string
  shiftText?: string
  shiftKeyCode?: number
  simulatedDefault?: (HTMLElement, options:any) => void
}
// const $Cypress = require('../cypress')


const isSingleDigitRe = /^\d$/
const isStartingDigitRe = /^\d/
const charsBetweenCurlyBracesRe = /{(.+?)}/

const initialModifiers = {
  alt: false,
  ctrl: false,
  meta: false,
  shift: false,
}

/**
 * @example {meta: true, ctrl: false, shift:false, alt: true} => 5
 */
const getModifiersValue = (modifiers:keyboardModifiers) => {
  return _.map(modifiers, (value, key) => {
    return value && modifierValueMap[key]
  })
  .reduce((a, b) => {
    return a + b
  }, 0)
}

// const keyToStandard = (key) => {
//   return keyStandardMap[key] || key
// }

const modifierValueMap = {
  alt: 1,
  ctrl: 2,
  meta: 4,
  shift: 8,
}

// Simulated default actions for select few keys.
const simulatedDefaultKeyMap = {
  'Enter': (el, options) => {
    if ($elements.isContentEditable(el) || $elements.isTextarea(el)) {
      $selection.replaceSelectionContents(el, '\n')
    }

    options.onEnterPressed(options.id)
  },
  'Delete': (el, options) => {
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
  },
  'Backspace': (el, options) => {
    // yes input (if value is actually changed)

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
  },
  'ArrowLeft': (el) => {
    return $selection.moveCursorLeft(el)
  },
  'ArrowRight': (el) => {
    return $selection.moveCursorRight(el)
  },

  'ArrowUp': (el) => {
    return $selection.moveCursorUp(el)
  },

  'ArrowDown': (el) => {
    return $selection.moveCursorDown(el)
  },

}

const keyboardMappings:{[key:string]: KeyDetailsPartial} = {
  'selectall': {
    key: 'selectAll',
    simulatedDefault: $selection.selectAll,
  },
  'movetostart': {
    key: 'moveToStart',
    simulatedDefault: () => {
      return $selection.moveSelectionToStart()
    },
  },
  'movetoend': {
    key: 'moveToEnd',
    simulatedDefault: () => {
      return $selection.moveSelectionToEnd()
    },

  },

  'del': UsKeyboardLayout.Delete,
  'backspace': UsKeyboardLayout.Backspace,
  'esc': UsKeyboardLayout.Escape,
  'enter': UsKeyboardLayout.Enter,
  'rightarrow': UsKeyboardLayout.ArrowRight,
  'leftarrow': UsKeyboardLayout.ArrowLeft,
  'uparrow': UsKeyboardLayout.ArrowUp,
  'downarrow': UsKeyboardLayout.ArrowDown,
  '{': UsKeyboardLayout.BracketLeft,
}

const modifierChars = {
  'alt': UsKeyboardLayout.Alt,
  'option': UsKeyboardLayout.Alt,

  'ctrl': UsKeyboardLayout.Control,
  'control': UsKeyboardLayout.Control,

  'meta': UsKeyboardLayout.Meta,
  'command': UsKeyboardLayout.Meta,
  'cmd': UsKeyboardLayout.Meta,

  'shift': UsKeyboardLayout.Shift,
}

_.defaults(keyboardMappings, UsKeyboardLayout)

const toModifiersEventOptions = (modifiers:keyboardModifiers) => {
  return {
    altKey: modifiers.alt,
    ctrlKey: modifiers.ctrl,
    metaKey: modifiers.meta,
    shiftKey: modifiers.shift,
  }
}

const fromModifierEventOptions = (eventOptions: {[key:string]:string}):keyboardModifiers => {
  const modifiers = _.pickBy({
    alt: eventOptions.altKey,
    ctrl: eventOptions.ctrlKey,
    meta: eventOptions.metaKey,
    shift: eventOptions.shiftKey,
  }, (x) => {
    return !!x
  })

  return _.defaults(modifiers, {
    alt: false,
    ctrl: false,
    meta: false,
    shift: false
  })
}

const getActiveModifiers = (state:State) => {
  return _.clone(state('keyboardModifiers')) || _.clone(initialModifiers)
}

const modifiersToString = (modifiers:keyboardModifiers) => {
  return _.keys(
    _.pickBy(modifiers, (val) => {
      return val
    })
  )
  .join(', ')
}

const joinKeyArrayToString = (keyArr: KeyDetails[]) => {
  return _.map(keyArr, (keyDetails) => {
    if (keyDetails.text) return keyDetails.key
    return `{${keyDetails.key}}`
  }).join()
}

// const isSpecialChar = (chars) => {
//   return !!kb.specialChars[chars]
// }

const isModifier = (details:KeyDetails) => {
  return !!modifierValueMap[_.lowerCase(details.key)]
}

const countNumIndividualKeyStrokes = (keys:KeyDetails[]) => {
  return _.countBy(keys, isModifier)['false']
}

const getKeyDetails = (key:string) => {

  if (keyboardMappings[key]) {
    const details = _.defaults({}, keyboardMappings[key], {
      key: '',
      keyCode: 0,
      code: '',
      text: '',
      location: 0,
    })

    if (details.key.length === 1) {
      details.text = details.key
    }

    return details
  }

  throw Error(`Not a valid key: ${key}`)
}

const getStatefulKeyDetails = (keyDetails:KeyDetails, modifiers: keyboardModifiers) => {
  const details = _.defaults(keyDetails, )

  if (modifiers.shift && details.shiftKey) {
    details.key = details.shiftKey
  }

  if (modifiers.shift && details.shiftKeyCode) {
    details.keyCode = details.shiftKeyCode
  }


  if (modifiers.shift && details.shiftText) {
    details.text = details.shiftText
  }

  // If any modifier besides shift is pressed, no text.
  if (_.some(_.omit(modifiers, ['shift']))) {
    details.text = ''
  }

  return details

}

export interface typeOptions {
  $el:JQuery,
  chars:string,
  release?:boolean
  _log?:any
}

const create = function (state:State) {

  const kb = {
    type (opts: typeOptions) {
      const options = _.defaults(opts, {
        delay: 0,
        simulated: false,
        onError: _.noop,
        onEvent: _.noop,
        onBeforeEvent: _.noop,
        onFocusChange: _.noop,
        onBeforeType: _.noop,
        onAfterType: _.noop,
        onValueChange: _.noop,
        onEnterPressed: _.noop,
        onNoMatchingSpecialChars: _.noop,
        onBeforeSpecialCharAction: _.noop,
      })

      /**
     * @type {HTMLElement}
     */
      const el = options.$el.get(0)
      const doc = $document.getDocumentFromElement(el)

      const keys = _.flatMap(options.chars.split(charsBetweenCurlyBracesRe), (chars) => {
        if (charsBetweenCurlyBracesRe.test(chars)) {
          //# allow special chars and modifiers to be case-insensitive
          return chars.toLowerCase()
        }

        return chars.split('')

      })

      const keyDetails = _.map(keys, getKeyDetails)

      options.onBeforeType(countNumIndividualKeyStrokes(keyDetails))

      //# should make each keystroke async to mimic
      //# how keystrokes come into javascript naturally

      let prevElement = $elements.getFocusedByDocument(doc)

      //TODO: if simulated, synchronous

      return Promise.each(keyDetails, (key:KeyDetails, i:number) => {

        let activeEl = $elements.getFocusedByDocument(doc)

        // TODO: validate activeElement isn't null (aka body is active)
        if (activeEl === null) {
          activeEl = doc.body
        }

        validateTyping(activeEl, joinKeyArrayToString(keyDetails.slice(i)), options._log)

        const details = getStatefulKeyDetails(key, getActiveModifiers(state))

        if (options.simulated) {
          return // kb.simulateKey(details)
        }

        return kb.typeKey(el, details, options)
      })
      .then(() => {
        options.onAfterType(
          $elements.getFocusedByDocument(doc)
        )

        if (options.release !== false) {
          return kb.resetModifiers(doc)
        }
      })
    },

    // simulateKey (el, eventType, key, options) {
    //   //# bail if we've said not to fire this specific event
    //   //# in our options

    //   let charCode
    //   let charCodeAt
    //   let keyCode
    //   let which

    //   if (options[eventType] === false) {
    //     return true
    //   }

    //   key = options.key != null ? options.key : key

    //   let keys = true
    //   let otherKeys = true

    //   // eslint-disable-next-line no-undef
    //   const event = new Event(eventType, {
    //     bubbles: true,
    //     cancelable: eventType !== 'input',
    //   })

    //   switch (eventType) {
    //     case 'keydown':
    //     case 'keyup':
    //       charCodeAt =
    //       options.charCode != null
    //         ? options.charCode
    //         : getKeyCode(key.toUpperCase())

    //       charCode = 0
    //       keyCode = charCodeAt
    //       which = charCodeAt
    //       break

    //     case 'keypress': {

    //       const asciiCode = options.charCode != null ? options.charCode : getAsciiCode(key)

    //       charCode = asciiCode
    //       keyCode = asciiCode
    //       which = asciiCode
    //       break
    //     }

    //     case 'textInput':
    //       charCode = 0
    //       keyCode = 0
    //       which = 0
    //       otherKeys = false

    //       _.extend(event, {
    //         data: key,
    //       })
    //       break

    //     case 'input':
    //       keys = false
    //       otherKeys = false
    //       break
    //     default:
    //       break
    //   }

    //   if (otherKeys) {
    //     _.extend(event, {
    //       location: 0,
    //       repeat: false,
    //     })
    //     _.extend(event, toModifiersEventOptions(getActiveModifiers(state)))
    //   }

    //   if (keys) {
    //     // special key like "{enter}" might have 'key = \n'
    //     // in which case the original intent will be in options.setKey
    //     // "normal" keys will have their value in "key" argument itself
    //     const standardKey = keyToStandard(options.setKey || key)

    //     _.extend(event, {
    //       charCode,
    //       detail: 0,
    //       key: standardKey,
    //       keyCode,
    //       layerX: 0,
    //       layerY: 0,
    //       pageX: 0,
    //       pageY: 0,
    //       view: options.window,
    //       which,
    //     })
    //   }

    //   const args = [options.id, key, eventType, charCodeAt]

    //   //# give the driver a chance to bail on this event
    //   //# if we return false here
    //   if (options.onBeforeEvent.apply(this, args) === false) {
    //     return
    //   }

    //   const dispatched = el.dispatchEvent(event)

    //   args.push(dispatched)

    //   options.onEvent.apply(this, args)

    //   return dispatched
    // },

    typeKey (el:HTMLTextLikeElement, key:KeyDetails, options) {


      return $native.keypress(key)

      // const isDigit = isSingleDigitRe.test(key.text)

      // return kb.ensureKey(el, key, options, () => {

      //   if ($elements.isInput(el) && $elements.isType(el, 'number')) {
      //     const { selectionStart } = el
      //     const valueLength = $elements.getNativeProp(el, 'value').length
      //     const isDigitsInText = isStartingDigitRe.test(options.chars)
      //     const isValidCharacter = key.text === '.' || (key.text === '-' && valueLength)
      //     const { prevChar } = options

      //     if (
      //       !isDigit &&
      //     (isDigitsInText || !isValidCharacter || selectionStart !== 0)
      //     ) {
      //       options.prevChar = key

      //       return
      //     }

      //     //# only type '.' and '-' if it is the first symbol and there already is a value, or if
      //     //# '.' or '-' are appended to a digit. If not, value cannot be set.
      //     if (
      //       isDigit &&
      //     (prevChar === '.' || (prevChar === '-' && !valueLength))
      //     ) {
      //       options.prevChar = key
      //       key = prevChar + key
      //     }
      //   }

      //   if ($elements.isNeedSingleValueChangeInputElement(el)) {
      //     options.typed = options.typed || ''
      //     options.typed += key
      //     if (options.typed === options.chars) {
      //       return $elements.setNativeProp(el, 'value', options.chars)
      //     }

      //     return
      //   }

      //   return $selection.replaceSelectionContents(el, key)
      // })
    },

    // ensureKey (el:HTMLElement, key, options, fn) {
    //   _.defaults(options, {
    //     prevText: null,
    //   })

    //   options.id = _.uniqueId('char')
    //   // options.beforeKey = el.value

    //   const maybeUpdateValueAndFireInput = () => {
    //     //# only call this function if we haven't been told not to
    //     if (
    //       options.onBeforeSpecialCharAction(options.id, options.key) !== false
    //     ) {
    //       let curText

    //       let isValueChangeElement
    //       if ($elements.isInput(el) || $elements.isTextarea(el)) {
    //         isValueChangeElement = true
    //         curText = $elements.getNativeProp(el, 'value')
    //       }

    //       fn.call(this)

    //       if (options.prevText === null && isValueChangeElement) {
    //         options.prevText = curText
    //         options.onValueChange(options.prevText, el)
    //       }
    //     }

    //     return kb.simulateKey(el, 'input', key, options)
    //   }

    //   if (kb.simulateKey(el, 'keydown', key, options)) {
    //     if (kb.simulateKey(el, 'keypress', key, options)) {
    //       if (kb.simulateKey(el, 'textInput', key, options)) {
    //         const shouldUpdateValue = () => {
    //           if ($elements.isInput(el) || $elements.isTextarea(el)) {
    //             const ml = el.maxLength
    //             //# maxlength is -1 by default when omitted
    //             //# but could also be null or undefined :-/
    //             //# only cafe if we are trying to type a key
    //             if ((ml === 0 || ml > 0) && key) {
    //               //# check if we should update the value
    //               //# and fire the input event
    //               //# as long as we're under maxlength
    //               if (!($elements.getNativeProp(el, 'value').length < ml)) {
    //                 return false
    //               }
    //             }
    //           }
    //           return true
    //         }
    //         if (shouldUpdateValue()) {
    //           maybeUpdateValueAndFireInput()
    //         }
    //       }
    //     }
    //   }

    //   return kb.simulateKey(el, 'keyup', key, options)
    // },

    // handleSpecialChars (el, chars, options) {
    //   options.key = chars
    //   const { simulated } = options

    //   if (simulated) {
    //     return kb.specialCharsSimulated[chars].call(this, el, options)
    //   }

    //   return kb.specialChars[chars].call(this, el, options)
    // },

    // getKeyInfo (keyString) {
    //   const keyInfo = UsKeyboardLayout.keyboardMappings[keyString]

    //   if (keyInfo.key && keyInfo.key.length === 1) {
    //     keyInfo.text = keyInfo.key
    //   }

    //   const _activeModifiers = getActiveModifiers(state)

    //   _.extend(keyInfo, { modifiers: getModifiersValue(_activeModifiers) })

    //   return keyInfo
    // },

    // handleModifier (el, chars, options) {
    //   const modifier = modifierChars[chars]

    //   //# do nothing if already activated
    //   if (getActiveModifiers(state)[modifier]) {
    //     return
    //   }

    //   const _activeModifiers = getActiveModifiers(state)

    //   _activeModifiers[modifier] = true

    //   state('keyboardModifiers', _activeModifiers)

    //   return kb.simulateModifier(el, 'keydown', modifier, options)
    // },

    // simulateModifier (el, eventType, modifier, options) {
    //   return kb.simulateKey(el, eventType, null, _.extend(options, {
    //     charCode: modifierCodeMap[modifier],
    //     id: _.uniqueId('char'),
    //     key: `<${modifier}>`,
    //   }))
    // },

    // keyup should be sent to the activeElement or body if null
    resetModifiers (doc:Document) {

      // const activeEl = $elements.getFocusedByDocument(doc)
      // const activeModifiers = getActiveModifiers(state)

      // for (let modifier in activeModifiers) {
      //   const isActivated = activeModifiers[modifier]

      //   activeModifiers[modifier] = false
      //   state('keyboardModifiers', _.clone(activeModifiers))
      //   if (isActivated) {
      //     kb.simulateModifier(activeEl, 'keyup', modifier, {
      //       window,
      //       onBeforeEvent () {},
      //       onEvent () {},
      //     })
      //   }
      // }
    },
    toModifiersEventOptions,
    modifiersToString,
    getActiveModifiers,
    modifierChars,
  }

  return kb
}

const validateTyping = (el, chars, onFail) => {
  const $el = $dom.wrap(el)
  const numElements = $el.length
  const isBody = $el.is('body')
  const isTextLike = $dom.isTextLike($el)
  const isDate = $dom.isType($el, 'date')
  const isTime = $dom.isType($el, 'time')
  const isMonth = $dom.isType($el, 'month')
  const isWeek = $dom.isType($el, 'week')
  const isDateTime =
    $dom.isType($el, 'datetime') || $dom.isType($el, 'datetime-local')
  const hasTabIndex = $dom.isSelector($el, '[tabindex]')

  const isEmptyChars = _.isEmpty(chars)
  const isClearChars = _.startsWith(_.lowerCase(chars), '{selectall}{del}')

  //# TODO: tabindex can't be -1
  //# TODO: can't be readonly

  const isTypeableButNotAnInput = isBody || (hasTabIndex && !isTextLike)

  if (!isBody && !isTextLike && !hasTabIndex) {
    const node = $dom.stringify($el)

    $utils.throwErrByPath('type.not_on_typeable_element', {
      onFail,
      args: { node },
    })
  }

  if (numElements > 1) {
    $utils.throwErrByPath('type.multiple_elements', {
      onFail,
      args: { num: numElements },
    })
  }

  if (!(_.isString(chars) || _.isFinite(chars))) {
    $utils.throwErrByPath('type.wrong_type', {
      onFail,
      args: { chars },
    })
  }

  if (isEmptyChars) {
    $utils.throwErrByPath('type.empty_string', { onFail })
  }

  if (isClearChars) {
    return '{selectall}{del}'.length
  }

  if (isDate) {
    let dateChars

    if (
      _.isString(chars) &&
      (dateChars = dateRegex.exec(chars)) !== null &&
      moment(dateChars[0]).isValid()
    ) {
      return _getEndIndex(chars, dateChars[0])
    }

    $utils.throwErrByPath('type.invalid_date', {
      onFail,
      // set matched date or entire char string
      args: { chars: dateChars ? dateChars[0] : chars },
    })
  }

  if (isMonth) {
    let monthChars

    if (
      _.isString(chars) &&
      (monthChars = monthRegex.exec(chars)) !== null
    ) {
      return _getEndIndex(chars, monthChars[0])
    }

    $utils.throwErrByPath('type.invalid_month', {
      onFail,
      args: { chars },
    })
  }

  if (isWeek) {
    let weekChars

    if (_.isString(chars) && (weekChars = weekRegex.exec(chars)) !== null) {
      return _getEndIndex(chars, weekChars[0])
    }

    $utils.throwErrByPath('type.invalid_week', {
      onFail,
      args: { chars },
    })
  }

  if (isTime) {
    let timeChars

    if (_.isString(chars) && (timeChars = timeRegex.exec(chars)) !== null) {
      return _getEndIndex(chars, timeChars[0])
    }

    $utils.throwErrByPath('type.invalid_time', {
      onFail,
      args: { chars },
    })
  }

  if (isDateTime) {
    let dateTimeChars

    if (
      _.isString(chars) &&
      (dateTimeChars = dateTimeRegex.exec(chars)) !== null
    ) {
      return _getEndIndex(chars, dateTimeChars[0])
    }

    $utils.throwErrByPath('type.invalid_dateTime', {
      onFail,
      args: { chars },
    })
  }

  return chars.length + 1
}

function _getEndIndex (str, substr) {
  return str.indexOf(substr) + substr.length
}

function _splitChars (chars, index) {
  return [chars.slice(0, index), chars.slice(index)]
}

module.exports = { create, toModifiersEventOptions, getActiveModifiers, modifierChars, modifiersToString, fromModifierEventOptions }
