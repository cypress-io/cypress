
import _ from 'lodash'
import moment from 'moment'
import Promise from '../config/bluebird'

import $selection from '../dom/selection'
import $window from '../dom/window'
import * as $elements from '../dom/elements'
import * as $document from '../dom/document'
import { keyboardMappings as USKeyboard } from '../cypress/UsKeyboardLayout'
import * as $dom from '../dom'
import $utils from '../cypress/utils.coffee'
import $native from '../cypress/native_events'
import { HTMLTextLikeElement, HTMLTextLikeInputElement } from '../dom/elements'
import Debug from 'debug'

const debug = Debug('driver:keyboard')

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
type SimulatedDefault = (el: HTMLTextLikeElement, key: KeyDetails, options: any) => void

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
  events: {
    [key in KeyEventType]?: boolean
  }
}
// const $Cypress = require('../cypress')

const dateRegex = /^\d{4}-\d{2}-\d{2}/
const monthRegex = /^\d{4}-(0\d|1[0-2])/
const weekRegex = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])/
const timeRegex = /^([0-1]\d|2[0-3]):[0-5]\d(:[0-5]\d)?(\.[0-9]{1,3})?/
const dateTimeRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}/
const clearRegex = /^{selectall}{del}/i
const isSingleDigitRe = /^\d$/
const isStartingDigitRe = /^\d/
const charsBetweenCurlyBracesRe = /({.+?})/

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

export type KeyEventType = 'keydown' | 'keyup' | 'keypress' | 'input' | 'textInput'

const toModifiersEventOptions = (modifiers: keyboardModifiers) => {
  return {
    altKey: modifiers.alt,
    ctrlKey: modifiers.ctrl,
    metaKey: modifiers.meta,
    shiftKey: modifiers.shift,
  }
}

const fromModifierEventOptions = (eventOptions: { [key: string]: string }): keyboardModifiers => {
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
  return _.keys(
    _.pickBy(modifiers, (val) => {
      return val
    })
  ).join(', ')
}

const joinKeyArrayToString = (keyArr: KeyDetails[]) => {
  return _.map(keyArr, (keyDetails) => {
    if (keyDetails.text) return keyDetails.key
    return `{${keyDetails.key}}`
  }).join('')
}

// const isSpecialChar = (chars) => {
//   return !!kb.specialChars[chars]
// }

type modifierKeyDetails = KeyDetails & {
  key: keyof typeof keyToModifierMap
}

const isModifier = (details: KeyDetails): details is modifierKeyDetails => {
  return !!keyToModifierMap[details.key]
}

const countNumIndividualKeyStrokes = (keys: KeyDetails[]) => {
  return _.countBy(keys, isModifier)['false']
}

const findKeyDetailsOrLowercase = (key: string) => {

  const foundKey = keyboardMappings[key]
  if (foundKey) return foundKey
  return _.mapKeys(keyboardMappings, (val, key) => _.toLower(key))[_.toLower(key)]
}

const getKeyDetails = (key: string) => {
  const foundKey = findKeyDetailsOrLowercase(key)
  if (foundKey) {
    const details = _.defaults({}, foundKey, {
      key: '',
      keyCode: 0,
      code: '',
      text: '',
      location: 0,
      events: {},
    })

    if (details.key.length === 1) {
      details.text = details.key
    }

    return details
  }

  throw Error(`Not a valid key: ${key}`)
}

const getStatefulKeyDetails = (keyDetails: KeyDetails, modifiers: keyboardModifiers) => {
  const details = _.defaults(keyDetails)

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

// type shouldBe = <K extends Function,T>(fn:K, a:T): re
// const shouldBeNumber = (a) => (_.isNumber(a) ? a : throwError())
// const shouldBe = (fn: (t1)=>t1 is number, a)=>fn(a)?a:throwError()

/**
 * @example '{foo}' => 'foo'
 */
const parseCharsBetweenCurlyBraces = (chars: string) => {
  return /{(.+?)}/.exec(chars)![1]
}

const simulateTextKey = (keyDetails: KeyDetails) => { }

const shouldIgnoreEvent = <T extends KeyEventType, K extends { [key in T]?: boolean }>(eventName: T, options: K) => {
  return options[eventName] === false
}

const getSimulatedDefaultForKey = (el, key: KeyDetails) => {
  const simulatedDefault = simulatedDefaultKeyMap[key.key]
  if (simulatedDefault) return simulatedDefault
  return () => {
    debug('replaceSelectionContents')
    $selection.replaceSelectionContents(el, key.text)
  }
}

export type typeOptions = {
  $el: JQuery
  chars: string
  simulated: boolean
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
  constructor(private state: State) { }
  type(opts: typeOptions) {
    const options = _.defaults(opts, {
      delay: 0,
      simulated: false,
      force: false,
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
    debug('type:', options.chars, options)

    const el = options.$el.get(0)
    const doc = $document.getDocumentFromElement(el)

    const keys = _.flatMap(options.chars.split(charsBetweenCurlyBracesRe), (chars) => {
      if (charsBetweenCurlyBracesRe.test(chars)) {
        //# allow special chars and modifiers to be case-insensitive
        return parseCharsBetweenCurlyBraces(chars) //.toLowerCase()
      }

      // ignore empty strings
      return _.filter(_.split(chars, ''))
    })

    const keyDetailsArr = _.map(keys, getKeyDetails)

    const numKeys = countNumIndividualKeyStrokes(keyDetailsArr)
    options.onBeforeType(numKeys)

    // # should make each keystroke async to mimic
    //# how keystrokes come into javascript naturally

    let prevElement = $elements.getActiveElByDocument(doc)

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

    //TODO: if simulated, synchronous
    let _skipCheckUntilIndex: number | undefined = 0

    debug('type each key', keyDetailsArr)
    const typeKeyFns = _.map(keyDetailsArr, (key: KeyDetails, i: number) => () => {
      debug('typing key:', key.key)

      const activeEl = getActiveEl(doc)

      if (!_skipCheckUntilIndex) {
        const { skipCheckUntilIndex } = validateTyping(activeEl, joinKeyArrayToString(keyDetailsArr.slice(i)), options._log, _skipCheckUntilIndex)
        _skipCheckUntilIndex = skipCheckUntilIndex
        if (_skipCheckUntilIndex) {
          debug('skip validate until:', _skipCheckUntilIndex)
          const isNeedSingleValueChangeInputElement = $elements.isNeedSingleValueChangeInputElement(activeEl)
          const keysType = keyDetailsArr.slice(0, _skipCheckUntilIndex)
          _.each(keysType, key => key!.simulatedDefault = _.noop)
          _.last(keysType)!.simulatedDefault = (el, options) => {
            return $elements.setNativeProp(el as HTMLTextLikeInputElement, 'value', joinKeyArrayToString(keysType))
          }
        }
      }

      const details = getStatefulKeyDetails(key, getActiveModifiers(this.state))

      if (key.simulatedDefault) {
        key.simulatedDefault(activeEl, key, options)
        return null
      }
      if (options.simulated) {
        this.typeSimulatedKey(activeEl, details, options)
        debug('returning null')
        return null
      }
      return this.typeKey(activeEl, details, options)
    })

    const modifierKeys = _.filter(keyDetailsArr, (key) => isModifier(key))

    if (options.simulated && !options.delay) {
      _.each(typeKeyFns, fn => fn())
      if (options.release !== false) {
        _.each(modifierKeys, (key) => this.simulatedKeyup(getActiveEl(doc), key, options))
      }
      options.onAfterType()
      return
    }

    return Promise.each(typeKeyFns, (fn) => Promise.try(()=>fn()).delay(options.delay))
      .then(() => {
        if (options.release !== false) {
          if (options.simulated) {
            return Promise.map(modifierKeys, (key) => this.simulatedKeyup(getActiveEl(doc), key, options))
          }
          return Promise.map(modifierKeys, (key) => this.keyup(key))
        }
        return []
      })
      .then(()=>{
        options.onAfterType()
      })

  }

  fireSimulatedEvent(
    el: HTMLElement,
    eventType: KeyEventType,
    keyDetails: KeyDetails,
    opts: {
      onBeforeEvent?: (...args) => boolean
      onEvent?: (...args) => boolean
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
    }

    let eventOptions: EventInit & { view?: Window, data?: string } = {}

    if (addModifiers) {
      const modifierEventOptions = toModifiersEventOptions(getActiveModifiers(this.state))
      _.extend(
        eventOptions,
        {
          repeat: false,
        },
        modifierEventOptions
      )
    }

    eventOptions = _.extend(
      eventOptions,
      _.omit(
        {
          bubbles: true,
          cancelable,
          key,
          charCode,
          location,
          keyCode,
          which,
          data,
          detail: 0,
          view: win,
        },
        _.isUndefined as any
      )
    )

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
        1,
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
    const onEventArgs = [key, eventType, which, dispatched]
    options.onEvent.apply(this, onEventArgs)

    return dispatched
  }

  // foo('a')(1)

  // const maybeFireSimulatedEvent:Curry = (shouldFire:boolean | undefined, fireSimulatedEvent) => {

  getModifierKeyDetails(key: KeyDetails) {
    return _.extend(key, { modifiers: getModifiersValue(getActiveModifiers(this.state)) })
  }

  releaseModifiers(modifiers: KeyDetails[]) {
    return Promise.each(modifiers, this.releaseKey.bind(this))
  }

  releaseKey(key: KeyDetails) {
    const keyWithModifiers = this.getModifierKeyDetails(key)
    return $native.keyup(keyWithModifiers)
  }

  keyup(key: KeyDetails) {
    if (isModifier(key)) {
      const didFlag = this.flagModifier(key, false)
      if (!didFlag) {
        return null
      }
    }
    debug('keyup:', key.key)
    const keyWithModifiers = this.getModifierKeyDetails(key)
    return $native.keyup(keyWithModifiers)
  }

  typeKey(el: HTMLTextLikeElement, key: KeyDetails, options) {

    if (isModifier(key)) {
      const didFlag = this.flagModifier(key, true)
      if (!didFlag) {
        return null
      }
      const keyWithModifiers = this.getModifierKeyDetails(key)
      debug('keydown:', key.key)
      return $native.keydown(keyWithModifiers).return(null)
    }
    debug('native keypress:', key.key)
    const keyWithModifiers = this.getModifierKeyDetails(key)
    return $native.keypress(keyWithModifiers).return(null)

    // const isDigit = isSingleDigitRe.test(key.text)

    // return kb.ensureSimulatedKey(el, key, options, () => {

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
  }

  flagModifier(key: modifierKeyDetails, setTo = true) {
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

  simulatedKeydown(el: HTMLElement, key: KeyDetails, options: any) {
    if (isModifier(key)) {
      this.flagModifier(key)
      key.events.keyup = false
    }

    debug('typeSimulatedKey options:', _.pick(options, ['keydown', 'keypress', 'textInput', 'input']))
    if (shouldIgnoreEvent('keydown', key.events) || this.fireSimulatedEvent(el, 'keydown', key, options)) {
      if (shouldIgnoreEvent('keypress', key.events) || this.fireSimulatedEvent(el, 'keypress', key, options)) {
        this.performSimulatedDefault(el, key, options)
        if (!shouldIgnoreEvent('textInput', key.events)) {
          debugger
          this.fireSimulatedEvent(el, 'textInput', key, options)
        }
      }
    }
  }

  typeSimulatedKey(el: HTMLElement, key: KeyDetails, options) {
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
    this.simulatedKeyup(el, key, options)

  }

  simulatedKeyup(el: HTMLElement, key: KeyDetails, options: any) {
    if (shouldIgnoreEvent('keyup', key.events)) {
      debug('simulatedKeyup: ignoring event')
      delete key.events.keyup
      return
    }

    if (isModifier(key)) {
      this.flagModifier(key, false)
    }

    this.fireSimulatedEvent(el, 'keyup', key, options)

  }

  getActiveEl(options) {
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

  performSimulatedDefault(el: HTMLElement, key: KeyDetails, options: any) {
    debug('performSimulatedDefault', key.key)
    const simulatedDefault = getSimulatedDefaultForKey(el, key)
 

    const shouldUpdateValue = () => {
      if (key.text && ($elements.isInput(el) || $elements.isTextarea(el))) {
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
      return true
    }

    if (!shouldUpdateValue()) {
      debug('performSimulatedDefault:shouldUpdateValue?', false)
      return
    }
    // const isBody = $elements.isBody(el)
    const isFocusable = $elements.isFocusable($dom.wrap(el))
    const isTextLike = $elements.isTextLike(el)

    // const isTypeableButNotTextLike = !isTextLike && isFocusable

    if (isTextLike) {
      let curText

      let isValueChangeElement = false
      if ($elements.isInput(el) || $elements.isTextarea(el)) {
        isValueChangeElement = true
        curText = $elements.getNativeProp(el, 'value')
      }
      
      simulatedDefault(el, key, options)

      if (!key.text) {
        key.events.input = false
        key.events.textInput = false
      }

      if (options.prevText === null && isValueChangeElement) {
        options.prevText = curText
        options.onValueChange(options.prevText, el)
      }

      return shouldIgnoreEvent('input', key.events) || this.fireSimulatedEvent(el, 'input', key, options)
    }
    debug('not textlike', el)
    return
  }


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
  //   return kb.fireSimulatedEvent(el, eventType, null, _.extend(options, {
  //     charCode: modifierCodeMap[modifier],
  //     id: _.uniqueId('char'),
  //     key: `<${modifier}>`,
  //   }))
  // },

  // keyup should be sent to the activeElement or body if null
  resetModifiers(doc: Document) {
    // const activeEl = $elements.getActiveElByDocument(doc)
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
  }

  // const maybeFireSimulatedEvent = _.wrap(this.fireSimulatedEvent, (fn, ...args) => {

  // })

  // return {
  //   type,
  //   resetModifiers,
  //   toModifiersEventOptions,
  //   modifiersToString,
  //   getActiveModifiers,
  //   // typeKey,
  //   // handleModifier,
  //   // performSimulatedDefault,
  //   // ensureSimulatedKey,
  //   // maybePerformSimulatedDefault,
  // }
}

const validateTyping = (el: HTMLElement, chars: string, onFail: Function, skipCheckUntilIndex?: number) => {
  if (skipCheckUntilIndex) {
    return { skipCheckUntilIndex: skipCheckUntilIndex-- }
  }
  // debug('validateTyping', el, chars)
  const $el = $dom.wrap(el)
  const numElements = $el.length
  const isBody = $el.is('body')
  const isTextLike = $dom.isTextLike(el)
  let isInput = false
  let isDate = false
  let isTime = false
  let isMonth = false
  let isWeek = false
  let isDateTime = false
  if ($elements.isInput(el)) {
    isInput = true
    isDate = $dom.isType(el, 'date')
    isTime = $dom.isType(el, 'time')
    isMonth = $dom.isType(el, 'month')
    isWeek = $dom.isType(el, 'week')
    isDateTime = $dom.isType(el, 'datetime') || $dom.isType(el, 'datetime-local')
  }
  const isFocusable = $elements.isFocusable($el)
  const isEmptyChars = _.isEmpty(chars)
  const clearChars = '{selectall}{del}'
  const isClearChars = _.startsWith(_.lowerCase(chars), clearChars)

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
    skipCheckUntilIndex = 2 // {selectAll}{del} is two keys
    return { skipCheckUntilIndex }
  }
  if (isDate) {
    let dateChars

    if (_.isString(chars) && (dateChars = dateRegex.exec(chars)) !== null && moment(dateChars[0]).isValid()) {
      skipCheckUntilIndex = _getEndIndex(chars, dateChars[0])
      return { skipCheckUntilIndex }
    }

    $utils.throwErrByPath('type.invalid_date', {
      onFail,
      // set matched date or entire char string
      args: { chars: dateChars ? dateChars[0] : chars },
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
      args: { chars },
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
      args: { chars },
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
      args: { chars },
    })
  }

  if (isDateTime) {
    let dateTimeChars

    if (_.isString(chars) && (dateTimeChars = dateTimeRegex.exec(chars)) !== null) {
      skipCheckUntilIndex = _getEndIndex(chars, dateTimeChars[0])
      return { skipCheckUntilIndex }
    }

    $utils.throwErrByPath('type.invalid_dateTime', {
      onFail,
      args: { chars },
    })
  }

  return {}
}




function _getEndIndex(str, substr) {
  return str.indexOf(substr) + substr.length
}

// function _splitChars(chars, index) {
//   return [chars.slice(0, index), chars.slice(index)]
// }

// Simulated default actions for select few keys.
const simulatedDefaultKeyMap: { [key: string]: SimulatedDefault } = {
  Enter: (el, key, options) => {
    key.events.input = false
    if ($elements.isContentEditable(el) || $elements.isTextarea(el)) {
      $selection.replaceSelectionContents(el, '\n')
      key.events.input = true
    }
    options.onEnterPressed()
  },
  Delete: (el, key) => {
    if ($selection.isCollapsed(el)) {
      //# if there's no text selected, delete the prev char
      //# if deleted char, send the input event
      key.events.input = $selection.deleteRightOfCursor(el)

      return
    }

    //# text is selected, so delete the selection
    //# contents and send the input event
    $selection.deleteSelectionContents(el)
    key.events.input = true
  },
  Backspace: (el, key) => {
    if ($selection.isCollapsed(el)) {
      //# if there's no text selected, delete the prev char
      //# if deleted char, send the input event
      key.events.input = $selection.deleteLeftOfCursor(el)
      return
    }

    //# text is selected, so delete the selection
    //# contents and send the input event
    $selection.deleteSelectionContents(el)
    key.events.input = true
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
}

const keyboardMappings: { [key: string]: KeyDetailsPartial } = {
  selectall: {
    key: 'selectAll',
    simulatedDefault: (el) => {
      const doc = $document.getDocumentFromElement(el)
      return $selection.selectAll(doc)
    }
  },
  movetostart: {
    key: 'moveToStart',
    simulatedDefault: (el) => {
      const doc = $document.getDocumentFromElement(el)
      return $selection.moveSelectionToStart(doc)
    }
  },
  movetoend: {
    key: 'moveToEnd',
    simulatedDefault: (el) => {
      const doc = $document.getDocumentFromElement(el)
      return $selection.moveSelectionToEnd(doc)
    }
  },

  del: USKeyboard.Delete,
  backspace: USKeyboard.Backspace,
  esc: USKeyboard.Escape,
  enter: USKeyboard.Enter,
  rightarrow: USKeyboard.ArrowRight,
  leftarrow: USKeyboard.ArrowLeft,
  uparrow: USKeyboard.ArrowUp,
  downarrow: USKeyboard.ArrowDown,
  '{': USKeyboard.BracketLeft,
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

const keyToModifierMap = {
  Alt: 'alt',
  Control: 'ctrl',
  Meta: 'meta',
  Shift: 'shift'
}

_.extend(keyboardMappings, USKeyboard, modifierChars)


export { toModifiersEventOptions, getActiveModifiers, modifierChars, modifiersToString, fromModifierEventOptions, validateTyping }
