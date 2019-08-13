import _ from 'lodash'
import moment from 'moment'
import Promise from 'bluebird'
import Debug from 'debug'
import * as $dom from '../dom'
import * as $elements from '../dom/elements'
import * as $document from '../dom/document'
import * as $selection from '../dom/selection'
import $window from '../dom/window'
import $utils from '../cypress/utils.coffee'
import { USKeyboard } from '../cypress/UsKeyboardLayout'
import { HTMLTextLikeElement, HTMLTextLikeInputElement } from '../dom/types'

const debug = Debug('cypress:driver:keyboard')

export interface keyboardModifiers {
  alt: boolean
  ctrl: boolean
  meta: boolean
  shift: boolean
}

export interface KeyboardState {
  keyboardModifiers?: keyboardModifiers
}

export interface ProxyState<T> {
  <K extends keyof T>(arg: K): T[K] | undefined
  <K extends keyof T>(arg: K, arg2: T[K] | null): void
}

export type State = ProxyState<KeyboardState>

interface KeyDetailsPartial extends Partial<KeyDetails> {
  key: string
}

type SimulatedDefault = (
  el: HTMLTextLikeElement,
  key: KeyDetails,
  options: any
) => void

interface KeyDetails {
  key: string
  text: string
  code: string
  keyCode: number
  location: number
  shiftKey?: string
  shiftText?: string
  shiftKeyCode?: number
  simulatedDefault?: SimulatedDefault
  simulatedDefaultOnly?: boolean
  events: {
    [key in KeyEventType]?: boolean;
  }
}
// const $Cypress = require('../cypress')

const dateRegex = /^\d{4}-\d{2}-\d{2}/
const monthRegex = /^\d{4}-(0\d|1[0-2])/
const weekRegex = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])/
const timeRegex = /^([0-1]\d|2[0-3]):[0-5]\d(:[0-5]\d)?(\.[0-9]{1,3})?/
const dateTimeRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}/
const charsBetweenCurlyBracesRe = /({.+?})/
// const clearRegex = /^{selectall}{del}/i
// const isSingleDigitRe = /^\d$/
// const isStartingDigitRe = /^\d/

const initialModifiers = {
  alt: false,
  ctrl: false,
  meta: false,
  shift: false,
}

/**
 * @example {meta: true, ctrl: false, shift:false, alt: true} => 5
 */
const getModifiersValue = (modifiers: keyboardModifiers) => {
  return _.map(modifiers, (value, key) => {
    return value && modifierValueMap[key]
  }).reduce((a, b) => {
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

export type KeyEventType =
  | 'keydown'
  | 'keyup'
  | 'keypress'
  | 'input'
  | 'textInput'

const toModifiersEventOptions = (modifiers: keyboardModifiers) => {
  return {
    altKey: modifiers.alt,
    ctrlKey: modifiers.ctrl,
    metaKey: modifiers.meta,
    shiftKey: modifiers.shift,
  }
}

const fromModifierEventOptions = (eventOptions: {
  [key: string]: string
}): keyboardModifiers => {
  const modifiers = _.pickBy(
    {
      alt: eventOptions.altKey,
      ctrl: eventOptions.ctrlKey,
      meta: eventOptions.metaKey,
      shift: eventOptions.shiftKey,
    },
    _.identity
  )

  return _.defaults(modifiers, {
    alt: false,
    ctrl: false,
    meta: false,
    shift: false,
  })
}

const getActiveModifiers = (state: State) => {
  return _.clone(state('keyboardModifiers')) || _.clone(initialModifiers)
}

const modifiersToString = (modifiers: keyboardModifiers) => {
  return _.keys(_.pickBy(modifiers, (val) => {
    return val
  })).join(', ')
}

const joinKeyArrayToString = (keyArr: KeyDetails[]) => {
  return _.map(keyArr, (keyDetails) => {
    if (keyDetails.text) return keyDetails.key

    return `{${keyDetails.key}}`
  }).join('')
}

type modifierKeyDetails = KeyDetails & {
  key: keyof typeof keyToModifierMap
}

const isModifier = (details: KeyDetails): details is modifierKeyDetails => {
  return !!keyToModifierMap[details.key]
}

const getFormattedKeyString = (details: KeyDetails) => {
  let foundKeyString = _.findKey(keyboardMappings, { key: details.key })

  if (foundKeyString) {
    return `{${foundKeyString}}`
  }

  foundKeyString = keyToModifierMap[details.key]

  if (foundKeyString) {
    return `<${foundKeyString}>`
  }

  return details.key

}

const countNumIndividualKeyStrokes = (keys: KeyDetails[]) => {
  return _.countBy(keys, isModifier)['false']
}

const findKeyDetailsOrLowercase = (key: string): KeyDetailsPartial => {
  const keymap = getKeymap()
  const foundKey = keymap[key]

  if (foundKey) return foundKey

  return _.mapKeys(keymap, (val, key) => {
    return _.toLower(key)
  })[_.toLower(key)]
}

const getTextLength = (str) => _.toArray(str).length

const getKeyDetails = (onKeyNotFound) => {
  return (key: string) => {
    let foundKey

    if (getTextLength(key) === 1) {
      foundKey = USKeyboard[key]
      foundKey = foundKey || { key }
    } else {
      foundKey = findKeyDetailsOrLowercase(key)
    }

    if (foundKey) {
      const details = _.defaults({}, foundKey, {
        key: '',
        keyCode: 0,
        code: '',
        text: '',
        location: 0,
        events: {},
      })

      if (getTextLength(details.key) === 1) {
        details.text = details.key
      }

      return details
    }

    onKeyNotFound(key, _.keys(getKeymap()).join(', '))

    throw Error(`Not a valid key: ${key}`)
  }
}

const hasModifierBesidesShift = (modifiers: keyboardModifiers) => {
  return _.some(_.omit(modifiers, ['shift']))
}

// type shouldBe = <K extends Function,T>(fn:K, a:T): re
// const shouldBeNumber = (a) => (_.isNumber(a) ? a : throwError())
// const shouldBe = (fn: (t1)=>t1 is number, a)=>fn(a)?a:throwError()

/**
 * @example '{foo}' => 'foo'
 */
const parseCharsBetweenCurlyBraces = (chars: string) => {
  return /{(.+?)}/.exec(chars)![1]
}

const shouldIgnoreEvent = <
  T extends KeyEventType,
  K extends { [key in T]?: boolean }
>(
  eventName: T,
  options: K
) => {
  return options[eventName] === false
}

const shouldUpdateValue = (el: HTMLElement, key: KeyDetails) => {
  if (!key.text) return true

  const bounds = $selection.getSelectionBounds(el)
  const noneSelected = bounds.start === bounds.end

  if ($elements.isInput(el) || $elements.isTextarea(el)) {
    if ($elements.isReadOnlyInputOrTextarea(el)) {
      return false
    }

    if (noneSelected) {
      // const ml = $elements.getNativeProp(el, 'maxLength')
      const ml = el.maxLength

      //# maxlength is -1 by default when omitted
      //# but could also be null or undefined :-/
      //# only care if we are trying to type a key
      if (ml === 0 || ml > 0) {
        //# check if we should update the value
        //# and fire the input event
        //# as long as we're under maxlength
        if (!($elements.getNativeProp(el, 'value').length < ml)) {
          return false
        }
      }
    }
  }

  return true
}

const getKeymap = () => {
  return {
    ...keyboardMappings,
    ...modifierChars,
    // TODO: add the reset of USKeyboard to available keys
    // ...USKeyboard,
  }
}
const validateTyping = (
  el: HTMLElement,
  keys: KeyDetails[],
  currentIndex: number,
  onFail: Function,
  skipCheckUntilIndex?: number,
) => {

  const chars = joinKeyArrayToString(keys.slice(currentIndex))
  const allChars = joinKeyArrayToString(keys)

  if (skipCheckUntilIndex) {
    return { skipCheckUntilIndex: skipCheckUntilIndex-- }
  }

  debug('validateTyping:', chars, el)

  // debug('validateTyping', el, chars)
  const $el = $dom.wrap(el)
  const numElements = $el.length
  const isBody = $el.is('body')
  const isTextLike = $dom.isTextLike(el)
  let isDate = false
  let isTime = false
  let isMonth = false
  let isWeek = false
  let isDateTime = false

  if ($elements.isInput(el)) {
    isDate = $dom.isType(el, 'date')
    isTime = $dom.isType(el, 'time')
    isMonth = $dom.isType(el, 'month')
    isWeek = $dom.isType(el, 'week')
    isDateTime =
      $dom.isType(el, 'datetime') || $dom.isType(el, 'datetime-local')
  }

  const isFocusable = $elements.isFocusable($el)
  const clearChars = '{selectall}{delete}'
  const isClearChars = _.startsWith(chars.toLowerCase(), clearChars)

  //# TODO: tabindex can't be -1
  //# TODO: can't be readonly

  if (isBody) {
    return {}
  }

  if (!isFocusable && !isTextLike) {
    const node = $dom.stringify($el)

    $utils.throwErrByPath('type.not_on_typeable_element', {
      onFail,
      args: { node },
    })
  }

  if (!isFocusable && isTextLike) {
    const node = $dom.stringify($el)

    $utils.throwErrByPath('type.not_actionable_textlike', {
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

  if (isClearChars) {
    skipCheckUntilIndex = 2 // {selectAll}{del} is two keys

    return { skipCheckUntilIndex, isClearChars: true }
  }

  if (isDate) {
    let dateChars

    if (
      _.isString(chars) &&
      (dateChars = dateRegex.exec(chars)) !== null &&
      moment(dateChars[0]).isValid()
    ) {
      skipCheckUntilIndex = _getEndIndex(chars, dateChars[0])

      return { skipCheckUntilIndex }
    }

    $utils.throwErrByPath('type.invalid_date', {
      onFail,
      // set matched date or entire char string
      args: { chars: allChars },
    })
  }

  if (isMonth) {
    let monthChars

    if (_.isString(chars) && (monthChars = monthRegex.exec(chars)) !== null) {
      skipCheckUntilIndex = _getEndIndex(chars, monthChars[0])

      return { skipCheckUntilIndex }
    }

    $utils.throwErrByPath('type.invalid_month', {
      onFail,
      args: { chars: allChars },
    })
  }

  if (isWeek) {
    let weekChars

    if (_.isString(chars) && (weekChars = weekRegex.exec(chars)) !== null) {
      skipCheckUntilIndex = _getEndIndex(chars, weekChars[0])

      return { skipCheckUntilIndex }
    }

    $utils.throwErrByPath('type.invalid_week', {
      onFail,
      args: { chars: allChars },
    })
  }

  if (isTime) {
    let timeChars

    if (_.isString(chars) && (timeChars = timeRegex.exec(chars)) !== null) {
      skipCheckUntilIndex = _getEndIndex(chars, timeChars[0])

      return { skipCheckUntilIndex }
    }

    $utils.throwErrByPath('type.invalid_time', {
      onFail,
      args: { chars: allChars },
    })
  }

  if (isDateTime) {
    let dateTimeChars

    if (
      _.isString(chars) &&
      (dateTimeChars = dateTimeRegex.exec(chars)) !== null
    ) {
      skipCheckUntilIndex = _getEndIndex(chars, dateTimeChars[0])

      return { skipCheckUntilIndex }
    }

    $utils.throwErrByPath('type.invalid_dateTime', {
      onFail,
      args: { chars: allChars },
    })
  }

  return {}
}

function _getEndIndex (str, substr) {
  return str.indexOf(substr) + substr.length
}

// function _splitChars(chars, index) {
//   return [chars.slice(0, index), chars.slice(index)]
// }

// Simulated default actions for select few keys.
const simulatedDefaultKeyMap: { [key: string]: SimulatedDefault } = {
  Enter: (el, key, options) => {
    if ($elements.isContentEditable(el) || $elements.isTextarea(el)) {
      key.events.input = $selection.replaceSelectionContents(el, '\n')
    } else {
      key.events.input = false
    }

    options.onEnterPressed()
  },
  Delete: (el, key) => {
    key.events.input = $selection.deleteRightOfCursor(el)
  },
  Backspace: (el, key) => {
    key.events.input = $selection.deleteLeftOfCursor(el)
  },
  ArrowLeft: (el) => {
    return $selection.moveCursorLeft(el)
  },
  ArrowRight: (el) => {
    return $selection.moveCursorRight(el)
  },

  ArrowUp: (el) => {
    return $selection.moveCursorUp(el)
  },

  ArrowDown: (el) => {
    return $selection.moveCursorDown(el)
  },

  Home: (el) => {
    return $selection.moveCursorToLineStart(el)
  },
  End: (el) => {
    return $selection.moveCursorToLineEnd(el)
  },
}

const modifierChars = {
  alt: USKeyboard.Alt,
  option: USKeyboard.Alt,

  ctrl: USKeyboard.Control,
  control: USKeyboard.Control,

  meta: USKeyboard.Meta,
  command: USKeyboard.Meta,
  cmd: USKeyboard.Meta,

  shift: USKeyboard.Shift,
}

const keyboardMappings: { [key: string]: KeyDetailsPartial } = {
  selectAll: {
    key: 'selectAll',
    simulatedDefault: (el) => {
      const doc = $document.getDocumentFromElement(el)

      return $selection.selectAll(doc)
    },
    simulatedDefaultOnly: true,
  },
  moveToStart: {
    key: 'moveToStart',
    simulatedDefault: (el) => {
      const doc = $document.getDocumentFromElement(el)

      return $selection.moveSelectionToStart(doc)
    },
    simulatedDefaultOnly: true,
  },
  moveToEnd: {
    key: 'moveToEnd',
    simulatedDefault: (el) => {
      const doc = $document.getDocumentFromElement(el)

      return $selection.moveSelectionToEnd(doc)
    },
    simulatedDefaultOnly: true,
  },

  del: USKeyboard.Delete,
  backspace: USKeyboard.Backspace,
  esc: USKeyboard.Escape,
  enter: USKeyboard.Enter,
  rightArrow: USKeyboard.ArrowRight,
  leftArrow: USKeyboard.ArrowLeft,
  upArrow: USKeyboard.ArrowUp,
  downArrow: USKeyboard.ArrowDown,
  home: USKeyboard.Home,
  end: USKeyboard.End,
  insert: USKeyboard.Insert,
  pageUp: USKeyboard.PageUp,
  pageDown: USKeyboard.PageDown,
  '{': USKeyboard.BracketLeft,
}

const keyToModifierMap = {
  Alt: 'alt',
  Control: 'ctrl',
  Meta: 'meta',
  Shift: 'shift',
}

export interface typeOptions {
  $el: JQuery
  chars: string
  force?: boolean
  simulated?: boolean
  release?: boolean
  _log?: any
  delay?: number
  onError?: Function
  onEvent?: Function
  onBeforeEvent?: Function
  onFocusChange?: Function
  onBeforeType?: Function
  onAfterType?: Function
  onValueChange?: Function
  onEnterPressed?: Function
  onNoMatchingSpecialChars?: Function
  onBeforeSpecialCharAction?: Function
}

export default class Keyboard {
  public foo = 'foo'

  constructor (private state: State) {}

  type (opts: typeOptions) {
    const options = _.defaults({}, opts, {
      delay: 0,
      force: false,
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
      parseSpecialCharSequences: true,
      onFail: _.noop,
    })

    if (options.force) {
      options.simulated = true
    }

    debug('type:', options.chars, options)

    const el = options.$el.get(0)
    const doc = $document.getDocumentFromElement(el)

    let keys: string[]

    if (!options.parseSpecialCharSequences) {
      keys = options.chars.split('')
    } else {
      keys = _.flatMap(
        options.chars.split(charsBetweenCurlyBracesRe),
        (chars) => {
          if (charsBetweenCurlyBracesRe.test(chars)) {
            //# allow special chars and modifiers to be case-insensitive
            return parseCharsBetweenCurlyBraces(chars) //.toLowerCase()
          }

          // ignore empty strings
          return _.filter(_.split(chars, ''))
        }
      )

    }

    const keyDetailsArr = _.map(
      keys,
      getKeyDetails(options.onNoMatchingSpecialChars)
    )

    const numKeys = countNumIndividualKeyStrokes(keyDetailsArr)

    options.onBeforeType(numKeys)

    // # should make each keystroke async to mimic
    //# how keystrokes come into javascript naturally

    // let prevElement = $elements.getActiveElByDocument(doc)

    const getActiveEl = (doc: Document) => {
      if (options.force) {
        return options.$el.get(0)
      }

      const activeEl = $elements.getActiveElByDocument(doc)

      if (activeEl === null) {
        return doc.body
      }

      return activeEl
    }

    let _skipCheckUntilIndex: number | undefined = 0

    const typeKeyFns = _.map(
      keyDetailsArr,
      (key: KeyDetails, i: number) => {
        return () => {
          debug('typing key:', key.key)

          const activeEl = getActiveEl(doc)

          _skipCheckUntilIndex = _skipCheckUntilIndex && _skipCheckUntilIndex - 1

          if (!_skipCheckUntilIndex) {
            const { skipCheckUntilIndex, isClearChars } = validateTyping(
              activeEl,
              keyDetailsArr,
              i,
              options.onFail,
              _skipCheckUntilIndex,
            )

            _skipCheckUntilIndex = skipCheckUntilIndex
            if (
              _skipCheckUntilIndex
              && $elements.isNeedSingleValueChangeInputElement(el)
            ) {
              const originalText = el.value

              debug('skip validate until:', _skipCheckUntilIndex)
              const keysType = keyDetailsArr.slice(0, _skipCheckUntilIndex)

              _.each(keysType, (key) => {
                key.simulatedDefaultOnly = true
                key.simulatedDefault = _.noop
              })

              _.last(keysType)!.simulatedDefault = () => {
                options.onValueChange(originalText, el)

                const valToSet = isClearChars ? '' : joinKeyArrayToString(keysType)

                debug('setting element value', valToSet, el)

                return $elements.setNativeProp(
                  el as HTMLTextLikeInputElement,
                  'value',
                  valToSet
                )
              }
            }
          } else {
            debug('skipping validation due to *skipCheckUntilIndex*', _skipCheckUntilIndex)
          }

          if (key.simulatedDefaultOnly && key.simulatedDefault) {
            key.simulatedDefault(activeEl, key, options)

            return null
          }

          this.typeSimulatedKey(activeEl, key, options)
          debug('returning null')

          return null

        }
      }
    )

    const modifierKeys = _.filter(keyDetailsArr, (key) => {
      return isModifier(key)
    })

    if (options.simulated && !options.delay) {
      _.each(typeKeyFns, (fn) => {
        return fn()
      })

      if (options.release !== false) {
        _.each(modifierKeys, (key) => {
          return this.simulatedKeyup(getActiveEl(doc), key, options)
        })
      }

      options.onAfterType()

      return
    }

    return Promise.each(typeKeyFns, (fn) => {
      return Promise.try(() => {
        return fn()
      }).delay(options.delay)
    })
      .then(() => {
        if (options.release !== false) {
          return Promise.map(modifierKeys, (key) => {
            return this.simulatedKeyup(getActiveEl(doc), key, options)
          })
        }

        return []
      })
      .then(() => {
        options.onAfterType()
      })
  }

  fireSimulatedEvent (
    el: HTMLElement,
    eventType: KeyEventType,
    keyDetails: KeyDetails,
    opts: {
      onBeforeEvent?: (...args) => boolean
      onEvent?: (...args) => boolean
      id: string
    }
  ) {
    debug('fireSimulatedEvent', eventType, keyDetails)
    const options = _.defaults(opts, {
      onBeforeEvent: _.noop,
      onEvent: _.noop,
    })

    const win = $window.getWindowByElement(el)
    const text = keyDetails.text
    let charCode: number | undefined
    let keyCode: number | undefined
    let which: number | undefined
    let data: string | undefined
    let location: number | undefined = keyDetails.location || 0
    let key: string | undefined
    let code: string | undefined = keyDetails.code
    let eventConstructor = 'KeyboardEvent'
    let cancelable = true

    let addModifiers = true

    switch (eventType) {
      case 'keydown':
      case 'keyup': {
        keyCode = keyDetails.keyCode
        which = keyDetails.keyCode
        key = keyDetails.key
        charCode = 0
        break
      }

      case 'keypress': {
        const charCodeAt = keyDetails.text.charCodeAt(0)

        charCode = charCodeAt
        keyCode = charCodeAt
        which = charCodeAt
        key = keyDetails.key
        break
      }

      case 'textInput': // lowercase in IE11
        eventConstructor = 'TextEvent'
        addModifiers = false
        charCode = 0
        keyCode = 0
        which = 0
        location = undefined
        data = text
        break

      case 'input':
        eventConstructor = 'InputEvent'
        addModifiers = false
        data = text
        location = undefined
        cancelable = false
        break
      default: {
        throw new Error(`Invalid event: ${eventType}`)
      }
    }

    let eventOptions: EventInit & {
      view?: Window
      data?: string
      repeat?: boolean
    } = {}

    if (addModifiers) {
      const modifierEventOptions = toModifiersEventOptions(getActiveModifiers(this.state))

      eventOptions = {
        ...eventOptions,
        ...modifierEventOptions,
        repeat: false,
      }
    }

    eventOptions = {
      ...eventOptions,
      ..._.omitBy(
        {
          bubbles: true,
          cancelable,
          key,
          code,
          charCode,
          location,
          keyCode,
          which,
          data,
          detail: 0,
          view: win,
        },
        _.isUndefined
      ),
    }

    let event: Event

    debug('event options:', eventType, eventOptions)
    if (eventConstructor === 'TextEvent') {
      event = document.createEvent('TextEvent')
      // @ts-ignore
      event.initTextEvent(
        eventType,
        eventOptions.bubbles,
        eventOptions.cancelable,
        eventOptions.view,
        eventOptions.data,
        1
        // eventOptions.locale
      )
      /*1: IE11 Input method param*/
      // event.initEvent(eventType)

      // or is IE
    } else {
      event = new win[eventConstructor](eventType, eventOptions)
    }

    const dispatched = el.dispatchEvent(event)

    debug(`dispatched [${eventType}] on ${el}`)
    const formattedKeyString = getFormattedKeyString(keyDetails)

    debug('format string', formattedKeyString)
    options.onEvent(options.id, formattedKeyString, eventType, which, dispatched)

    return dispatched
  }

  getModifierKeyDetails (key: KeyDetails) {
    const modifiers = getActiveModifiers(this.state)
    const details = { ...key, modifiers: getModifiersValue(modifiers) }

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
    if (hasModifierBesidesShift(modifiers)) {
      details.text = ''
    }

    return details
  }

  flagModifier (key: modifierKeyDetails, setTo = true) {
    debug('handleModifier', key.key)
    const modifier = keyToModifierMap[key.key]

    //# do nothing if already activated
    if (!!getActiveModifiers(this.state)[modifier] === setTo) {
      return false
    }

    const _activeModifiers = getActiveModifiers(this.state)

    _activeModifiers[modifier] = setTo

    this.state('keyboardModifiers', _activeModifiers)

    return true
  }

  simulatedKeydown (el: HTMLElement, _key: KeyDetails, options: any) {
    if (isModifier(_key)) {
      const didFlag = this.flagModifier(_key)

      if (!didFlag) {
        return null
      }

      _key.events.keyup = false
    }

    const key = this.getModifierKeyDetails(_key)

    if (!key.text) {
      key.events.input = false
      key.events.keypress = false
      key.events.textInput = false
    }

    let elToType

    options.id = _.uniqueId('char')

    debug(
      'typeSimulatedKey options:',
      _.pick(options, ['keydown', 'keypress', 'textInput', 'input', 'id'])
    )

    if (
      shouldIgnoreEvent('keydown', key.events) ||
      this.fireSimulatedEvent(el, 'keydown', key, options)
    ) {
      elToType = this.getActiveEl(options)

      if (key.key === 'Enter' && $elements.isInput(elToType)) {
        key.events.textInput = false
      }

      if ($elements.isReadOnlyInputOrTextarea(elToType)) {
        key.events.textInput = false
      }

      if (
        shouldIgnoreEvent('keypress', key.events) ||
        this.fireSimulatedEvent(elToType, 'keypress', key, options)
      ) {
        if (
          shouldIgnoreEvent('textInput', key.events) ||
          this.fireSimulatedEvent(elToType, 'textInput', key, options)
        ) {
          return this.performSimulatedDefault(elToType, key, options)
        }
      }
    }
  }

  typeSimulatedKey (el: HTMLElement, key: KeyDetails, options) {
    debug('typeSimulatedKey', key.key, el)
    _.defaults(options, {
      prevText: null,
    })

    const isFocusable = $elements.isFocusable($dom.wrap(el))
    const isTextLike = $elements.isTextLike(el)

    const isTypeableButNotTextLike = !isTextLike && isFocusable

    if (isTypeableButNotTextLike) {
      key.events.input = false
      key.events.textInput = false
    }

    this.simulatedKeydown(el, key, options)
    const elToKeyup = this.getActiveEl(options)

    this.simulatedKeyup(elToKeyup, key, options)
  }

  simulatedKeyup (el: HTMLElement, _key: KeyDetails, options: any) {
    if (shouldIgnoreEvent('keyup', _key.events)) {
      debug('simulatedKeyup: ignoring event')
      delete _key.events.keyup

      return
    }

    if (isModifier(_key)) {
      this.flagModifier(_key, false)
    }

    const key = this.getModifierKeyDetails(_key)

    this.fireSimulatedEvent(el, 'keyup', key, options)
  }

  getSimulatedDefaultForKey (key: KeyDetails) {
    debug('getSimulatedDefaultForKey', key.key)
    if (key.simulatedDefault) return key.simulatedDefault

    let nonShiftModifierPressed = hasModifierBesidesShift(getActiveModifiers(this.state))

    debug({ nonShiftModifierPressed, key })
    if (!nonShiftModifierPressed && simulatedDefaultKeyMap[key.key]) {
      return simulatedDefaultKeyMap[key.key]
    }

    return (el: HTMLElement) => {
      debug('replaceSelectionContents')

      if (!shouldUpdateValue(el, key)) {
        debug('skip typing key', false)
        key.events.input = false

        return
      }

      // noop if not in a text-editable
      const ret = $selection.replaceSelectionContents(el, key.text)

      debug('replaceSelectionContents:', key.text, ret)
    }
  }

  getActiveEl (options) {
    const el = options.$el.get(0)

    if (options.force) {
      return el
    }

    const doc = $document.getDocumentFromElement(el)

    let activeEl = $elements.getActiveElByDocument(doc)

    // TODO: validate activeElement isn't null (aka body is active)
    if (activeEl === null) {
      activeEl = doc.body
    }

    return activeEl
  }

  performSimulatedDefault (el: HTMLElement, key: KeyDetails, options: any) {
    debug('performSimulatedDefault', key.key)
    const simulatedDefault = this.getSimulatedDefaultForKey(key)

    // const isBody = $elements.isBody(el)
    // const isFocusable = $elements.isFocusable($dom.wrap(el))
    // const isTextLike = $elements.isTextLike(el)

    // const isTypeableButNotTextLike = !isTextLike && isFocusable

    if ($elements.isTextLike(el)) {
      if ($elements.isInput(el) || $elements.isTextarea(el)) {
        const curText = $elements.getNativeProp(el, 'value')

        simulatedDefault(el, key, options)
        if (key.events.input !== false) {
          options.onValueChange(curText, el)
        } else {
          // key.events.textInput = false
        }
      } else {
        // el is contenteditable
        simulatedDefault(el, key, options)
      }

      shouldIgnoreEvent('input', key.events) ||
        this.fireSimulatedEvent(el, 'input', key, options)

      return
    }

    return simulatedDefault(el, key, options)
  }

  static toModifiersEventOptions = toModifiersEventOptions
  static getActiveModifiers = getActiveModifiers
  static modifierChars = modifierChars
  static modifiersToString = modifiersToString
  static fromModifierEventOptions = fromModifierEventOptions
  static validateTyping = validateTyping
  getKeymap = getKeymap
  static keyboardMappings = keyboardMappings
}
