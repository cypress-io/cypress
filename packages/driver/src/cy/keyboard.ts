import Promise from 'bluebird'
import Debug from 'debug'
import _ from 'lodash'
import dayjs from 'dayjs'
import $errUtils from '../cypress/error_utils'
import { USKeyboard } from '../cypress/UsKeyboardLayout'
import $dom from '../dom'
import $document from '../dom/document'
import $elements, { HTMLTextLikeInputElement } from '../dom/elements'
// eslint-disable-next-line no-duplicate-imports
import type { HTMLTextLikeElement } from '../dom/elements'
import $selection from '../dom/selection'
import $utils from '../cypress/utils'
import $window from '../dom/window'
import type { Log } from '../cypress/log'
import type { StateFunc } from '../cypress/state'

const debug = Debug('cypress:driver:keyboard')

export interface KeyboardModifiers {
  alt: boolean
  ctrl: boolean
  meta: boolean
  shift: boolean
}

interface KeyDetailsPartial extends Partial<KeyDetails> {
  key: string
}

type SimulatedDefault = (
  el: HTMLElement,
  key: KeyDetails,
  options: typeOptions
) => void

type KeyInfo = KeyDetails | ShortcutDetails

interface KeyDetails {
  type: 'key'
  key: string
  text: string | null
  code: string
  keyCode: number
  location: number
  shiftKey?: string
  shiftText?: string
  shiftKeyCode?: number
  simulatedDefault?: SimulatedDefault
  simulatedDefaultOnly?: boolean
  originalSequence?: string
  events: {
    [key in KeyEventType]?: boolean;
  }
}

interface ShortcutDetails {
  type: 'shortcut'
  modifiers: KeyDetails[]
  key: KeyDetails
  originalSequence: string
}

const dateRe = /^\d{4}-\d{2}-\d{2}/
const monthRe = /^\d{4}-(0\d|1[0-2])/
const weekRe = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])/
const timeRe = /^([0-1]\d|2[0-3]):[0-5]\d(:[0-5]\d)?(\.[0-9]{1,3})?/
const dateTimeRe = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}(:[0-9]{2})?(\.[0-9]{1,3})?/
const numberRe = /^-?(\d+|\d+\.\d+|\.\d+)([eE][-+]?\d+)?$/i
const charsBetweenCurlyBracesRe = /({.+?})/
const isValidNumberInputChar = /[-+eE\d\.]/
const arrowKeysRe = /^\{(ArrowUp|ArrowDown)\}$/

const INITIAL_MODIFIERS = {
  alt: false,
  ctrl: false,
  meta: false,
  shift: false,
}

/**
 * @example {meta: true, ctrl: false, shift: false, alt: true} => 5
 */
const getModifiersValue = (modifiers: KeyboardModifiers) => {
  return _
  .chain(modifiers)
  .map((value, key) => {
    return value && modifierValueMap[key]
  })
  .sum()
  .value()
}

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
  | 'beforeinput'

export type ModifiersEventOptions = {
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
}

const toModifiersEventOptions = (modifiers: KeyboardModifiers) => {
  return {
    altKey: modifiers.alt,
    ctrlKey: modifiers.ctrl,
    metaKey: modifiers.meta,
    shiftKey: modifiers.shift,
  }
}

const fromModifierEventOptions = (eventOptions: {
  [key: string]: string
}): KeyboardModifiers => {
  return _
  .chain({
    alt: eventOptions.altKey,
    ctrl: eventOptions.ctrlKey,
    meta: eventOptions.metaKey,
    shift: eventOptions.shiftKey,
  })
  .pickBy() // remove falsy values
  .defaults({
    alt: false,
    ctrl: false,
    meta: false,
    shift: false,
  })
  .value()
}

const modifiersToString = (modifiers: KeyboardModifiers) => {
  return _.keys(_.pickBy(modifiers, (val) => {
    return val
  })).join(', ')
}

const joinKeyArrayToString = (keyArr: KeyInfo[]) => {
  return _.map(keyArr, (key) => {
    if (key.type === 'key') {
      if (key.text) return key.key

      return `{${key.key}}`
    }

    return `{${key.originalSequence}}`
  }).join('')
}

type KeyModifiers = {
  key: keyof typeof keyToModifierMap
}

const isModifier = (details: KeyInfo): details is KeyDetails & KeyModifiers => {
  return details.type === 'key' && !!keyToModifierMap[details.key]
}

const getFormattedKeyString = (details: KeyDetails) => {
  let foundKeyString = _.findKey(keyboardMappings, { key: details.key })

  if (foundKeyString) {
    return `{${details.originalSequence}}`
  }

  foundKeyString = keyToModifierMap[details.key]

  if (foundKeyString) {
    return `{${details.originalSequence}}`
  }

  return details.originalSequence
}

const countNumIndividualKeyStrokes = (keys: KeyInfo[]) => {
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
  return (key: string): KeyDetails | ShortcutDetails => {
    let foundKey: KeyDetailsPartial

    if (getTextLength(key) === 1) {
      foundKey = USKeyboard[key] || { key }
    } else {
      foundKey = findKeyDetailsOrLowercase(key)
    }

    if (foundKey) {
      const details = _.defaults({}, foundKey, {
        type: 'key',
        key: '',
        keyCode: 0,
        code: '',
        text: null,
        location: 0,
        events: {},
      }) as KeyDetails

      if (getTextLength(details.key) === 1) {
        details.text = details.key
      }

      details.type = 'key'
      details.originalSequence = key

      return details
    }

    if (key.includes('+')) {
      if (key.endsWith('++')) {
        key = key.replace('++', '+plus')
      }

      const keys = key.split('+')
      let lastKey = _.last(keys)

      if (lastKey === 'plus') {
        keys[keys.length - 1] = '+'
        lastKey = '+'
      }

      if (!lastKey) {
        return onKeyNotFound(key, _.keys(getKeymap()).join(', '))
      }

      const keyWithModifiers = getKeyDetails(onKeyNotFound)(lastKey) as KeyDetails

      let hasModifierBesidesShift = false

      const modifiers = keys.slice(0, -1)
      .map((m) => {
        if (!Object.keys(modifierChars).includes(m)) {
          $errUtils.throwErrByPath('type.not_a_modifier', {
            args: {
              key: m,
            },
          })
        }

        if (m !== 'shift') {
          hasModifierBesidesShift = true
        }

        return getKeyDetails(onKeyNotFound)(m)
      }) as KeyDetails[]

      const details: ShortcutDetails = {
        type: 'shortcut',
        modifiers,
        key: keyWithModifiers,
        originalSequence: key,
      }

      // if we are going to type {ctrl+b}, the 'b' shouldn't be input as text
      // normally we don't bypass text input but for shortcuts it's definitely what the user wants
      // since the modifiers only apply to this single key.
      if (hasModifierBesidesShift) {
        details.key.text = null
      }

      return details
    }

    onKeyNotFound(key, _.keys(getKeymap()).join(', '))

    throw new Error('this can never happen')
  }
}

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
  options: K,
) => {
  return options[eventName] === false
}

const shouldUpdateValue = (el: HTMLElement, key: KeyDetails, options: typeOptions) => {
  if (!key.text) return false

  const bounds = $selection.getSelectionBounds(el)
  const noneSelected = bounds.start === bounds.end

  if ($elements.isInput(el) || $elements.isTextarea(el)) {
    if ($elements.isReadOnlyInputOrTextarea(el) && !options.force) {
      return false
    }

    if ($elements.isButtonLike(el) && !options.force) {
      return false
    }

    const isNumberInputType = $elements.isInput(el) && $elements.isInputType(el, 'number')

    if (isNumberInputType) {
      const needsValue = options.prevValue || ''
      const needsValueLength = (needsValue && needsValue.length) || 0
      const curVal = $elements.getNativeProp(el, 'value')
      const bounds = $selection.getSelectionBounds(el)

      // We need to see if the number we're about to type is a valid number, since setting a number input
      // to an invalid number will not set the value and possibly throw a warning in the console
      const potentialValue = $selection.insertSubstring(curVal + needsValue, key.text, [bounds.start + needsValueLength, bounds.end + needsValueLength])

      if (!(numberRe.test(potentialValue))) {
        debug('skipping inserting value since number input would be invalid', key.text, potentialValue)
        // when typing in a number input, only certain allowed chars will insert text
        if (!key.text.match(isValidNumberInputChar)) {
          // https://github.com/cypress-io/cypress/issues/6055
          // Should not remove old valid values when a new one is not a valid number char, just dismiss it with return

          return
        }

        options.prevValue = needsValue + key.text

        return
      }

      key.text = (options.prevValue || '') + key.text
      options.prevValue = undefined
    }

    if (noneSelected) {
      const ml = $elements.getNativeProp(el, 'maxLength')

      // maxlength is -1 by default when omitted
      // but could also be null or undefined :-/
      // only care if we are trying to type a key
      if (ml === 0 || ml > 0) {
        // check if we should update the value
        // and fire the input event
        // as long as we're under maxlength
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
  keys: KeyInfo[],
  currentIndex: number,
  onFail: Function,
  skipCheckUntilIndex: number | undefined,
  force: boolean,
) => {
  const chars = joinKeyArrayToString(keys.slice(currentIndex))
  const allChars = joinKeyArrayToString(keys)

  if (skipCheckUntilIndex) {
    return { skipCheckUntilIndex: skipCheckUntilIndex-- }
  }

  debug('validateTyping:', chars, el)

  const $el = $dom.wrap(el)
  const numElements = $el.length
  const isBody = $el.is('body')
  const isTextLike = $dom.isTextLike(el)

  const arrowKeyChars = arrowKeysRe.exec(chars)

  let dateChars
  let monthChars
  let weekChars
  let timeChars
  let dateTimeChars

  let isDate = false
  let isTime = false
  let isMonth = false
  let isWeek = false
  let isDateTime = false

  // use 'type' attribute instead of prop since browsers without
  // support for attribute input type will have type prop of 'text'
  if ($elements.isInput(el)) {
    isDate = $elements.isAttrType(el, 'date')
    isTime = $elements.isAttrType(el, 'time')
    isMonth = $elements.isAttrType(el, 'month')
    isWeek = $elements.isAttrType(el, 'week')
    isDateTime =
      $elements.isAttrType(el, 'datetime') || $elements.isAttrType(el, 'datetime-local')
  }

  const isFocusable = $elements.isFocusable($el)
  const clearChars = '{selectall}{delete}'
  const isClearChars = _.startsWith(chars.toLowerCase(), clearChars)

  // TODO: tabindex can't be -1
  // TODO: can't be readonly

  if (isBody) {
    return {}
  }

  // throw error if element, which is normally typeable, is disabled for some reason
  // don't throw if force: true
  if (!isFocusable && isTextLike && !force) {
    const node = $dom.stringify($el)

    $errUtils.throwErrByPath('type.not_actionable_textlike', {
      onFail,
      args: { node },
    })
  }

  // throw error if element cannot receive keyboard events under any conditions
  if (!isFocusable && !isTextLike) {
    const node = $dom.stringify($el)

    $errUtils.throwErrByPath('type.not_on_typeable_element', {
      onFail,
      args: { node },
    })
  }

  if (numElements > 1) {
    $errUtils.throwErrByPath('type.multiple_elements', {
      onFail,
      args: { num: numElements },
    })
  }

  if (isClearChars) {
    skipCheckUntilIndex = 2 // {selectAll}{del} is two keys

    return { skipCheckUntilIndex, isClearChars: true }
  }

  if (isDate) {
    dateChars = dateRe.exec(chars)

    const dateExists = (date) => {
      // dayjs rounds up dates that don't exist to valid dates
      return dayjs(date, 'YYYY-MM-DD').format('YYYY-MM-DD') === date
    }

    if (_.isString(chars) && arrowKeyChars) {
      return {}
    }

    if (
      _.isString(chars) &&
      dateChars &&
      dateExists(dateChars[0])
    ) {
      skipCheckUntilIndex = _getEndIndex(chars, dateChars[0])

      return { skipCheckUntilIndex }
    }

    $errUtils.throwErrByPath('type.invalid_date', {
      onFail,
      // set matched date or entire char string
      args: { chars: allChars },
    })
  }

  if (isMonth) {
    monthChars = monthRe.exec(chars)

    if (_.isString(chars) && arrowKeyChars) {
      return {}
    }

    if (_.isString(chars) && monthChars) {
      skipCheckUntilIndex = _getEndIndex(chars, monthChars[0])

      return { skipCheckUntilIndex }
    }

    $errUtils.throwErrByPath('type.invalid_month', {
      onFail,
      args: { chars: allChars },
    })
  }

  if (isWeek) {
    weekChars = weekRe.exec(chars)

    if (_.isString(chars) && arrowKeyChars) {
      return {}
    }

    if (_.isString(chars) && weekChars) {
      skipCheckUntilIndex = _getEndIndex(chars, weekChars[0])

      return { skipCheckUntilIndex }
    }

    $errUtils.throwErrByPath('type.invalid_week', {
      onFail,
      args: { chars: allChars },
    })
  }

  if (isTime) {
    timeChars = timeRe.exec(chars)

    if (_.isString(chars) && arrowKeyChars) {
      return {}
    }

    if (_.isString(chars) && timeChars) {
      skipCheckUntilIndex = _getEndIndex(chars, timeChars[0])

      return { skipCheckUntilIndex }
    }

    $errUtils.throwErrByPath('type.invalid_time', {
      onFail,
      args: { chars: allChars },
    })
  }

  if (isDateTime) {
    dateTimeChars = dateTimeRe.exec(chars)

    if (_.isString(chars) && arrowKeyChars) {
      return {}
    }

    if (_.isString(chars) && dateTimeChars) {
      skipCheckUntilIndex = _getEndIndex(chars, dateTimeChars[0])

      return { skipCheckUntilIndex }
    }

    $errUtils.throwErrByPath('type.invalid_datetime', {
      onFail,
      args: { chars: allChars },
    })
  }

  return {}
}

function _getEndIndex (str, substr) {
  return str.indexOf(substr) + substr.length
}

// Simulated default actions for select few keys.
const simulatedDefaultKeyMap: { [key: string]: SimulatedDefault } = {
  Enter: (el, key, options) => {
    // if input element, Enter key does not insert text
    if (!$elements.isInput(el)) {
      $selection.replaceSelectionContents(el, '\n')
    }

    options.onEnterPressed && options.onEnterPressed(el)
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
      $selection.selectAll(el)
    },
    simulatedDefaultOnly: true,
  },
  moveToStart: {
    key: 'moveToStart',
    simulatedDefault: (el) => {
      $selection.moveSelectionToStart(el)
    },
    simulatedDefaultOnly: true,
  },
  moveToEnd: {
    key: 'moveToEnd',
    simulatedDefault: (el) => {
      $selection.moveSelectionToEnd(el)
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
  id: string
  $el: JQuery
  chars: string
  force?: boolean
  simulated?: boolean
  release?: boolean
  _log?: Log
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
  prevValue?: string
}

export class Keyboard {
  constructor (private state: StateFunc) {}

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

    let keys: string[]

    if (!options.parseSpecialCharSequences) {
      keys = options.chars.split('')
    } else {
      keys = _.flatMap(
        options.chars.split(charsBetweenCurlyBracesRe),
        (chars) => {
          if (charsBetweenCurlyBracesRe.test(chars)) {
            // allow special chars and modifiers to be case-insensitive
            return parseCharsBetweenCurlyBraces(chars) //.toLowerCase()
          }

          // ignore empty strings
          return _.filter(_.split(chars, ''))
        },
      )
    }

    const keyDetailsArr = _.map(
      keys,
      getKeyDetails(options.onNoMatchingSpecialChars),
    )

    const numKeys = countNumIndividualKeyStrokes(keyDetailsArr)

    options.onBeforeType(numKeys)

    let _skipCheckUntilIndex: number | undefined = 0

    const typeKeyFns = _.map(
      keyDetailsArr,
      (key: KeyInfo, currentKeyIndex: number) => {
        return () => {
          const activeEl = this.getActiveEl(options)

          if (key.type === 'shortcut') {
            this.simulateShortcut(activeEl, key, options)

            return null
          }

          debug('typing key:', key.key)

          _skipCheckUntilIndex = _skipCheckUntilIndex && _skipCheckUntilIndex - 1

          if (!_skipCheckUntilIndex) {
            const { skipCheckUntilIndex, isClearChars } = validateTyping(
              activeEl,
              keyDetailsArr,
              currentKeyIndex,
              options.onFail,
              _skipCheckUntilIndex,
              options.force,
            )

            _skipCheckUntilIndex = skipCheckUntilIndex

            if (
              _skipCheckUntilIndex
              && $elements.isNeedSingleValueChangeInputElement(activeEl)
            ) {
              const originalText = $elements.getNativeProp(activeEl, 'value')

              debug('skip validate until:', _skipCheckUntilIndex)
              const keysToType = keyDetailsArr.slice(currentKeyIndex, currentKeyIndex + _skipCheckUntilIndex)

              _.each(keysToType, (key) => {
                // singleValueChange inputs must have their value set once at the end
                // performing the simulatedDefault for a key would try to insert text on each character
                // we still send all the events as normal, however
                if (key.type === 'key') {
                  key.simulatedDefault = _.noop
                }
              })

              const lastKeyToType = _.last(keysToType)!

              if (lastKeyToType.type === 'key') {
                lastKeyToType.simulatedDefault = () => {
                  options.onValueChange(originalText, activeEl)

                  const valToSet = isClearChars ? '' : joinKeyArrayToString(keysToType)

                  debug('setting element value', valToSet, activeEl)

                  return $elements.setNativeProp(
                    activeEl as HTMLTextLikeInputElement,
                    'value',
                    valToSet,
                  )
                }
              }
            }
          } else {
            debug('skipping validation due to *skipCheckUntilIndex*', _skipCheckUntilIndex)
          }

          // simulatedDefaultOnly keys will not send any events, and cannot be canceled
          if (key.simulatedDefaultOnly) {
            key.simulatedDefault!(activeEl as HTMLTextLikeElement, key, options)

            return null
          }

          this.typeSimulatedKey(activeEl, key, options)

          return null
        }
      },
    )

    // we will only press each modifier once, so only find unique modifiers
    const modifierKeys = _
    .chain(keyDetailsArr)
    .filter(isModifier)
    .uniqBy('key')
    .value()

    return Promise
    .each(typeKeyFns, (fn) => {
      if (options.delay) {
        return Promise
        .try(fn)
        .delay(options.delay)
      }

      return Promise
      .try(fn)
    })
    .then(() => {
      if (options.release !== false) {
        return Promise.map(modifierKeys, (key) => {
          options.id = _.uniqueId('char')

          return this.simulatedKeyup(this.getActiveEl(options), key, options)
        })
      }

      return []
    })
    .then(options.onAfterType)
  }

  fireSimulatedEvent (
    el: HTMLElement,
    eventType: KeyEventType,
    keyDetails: KeyDetails,
    opts: typeOptions,
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
    let data: Cypress.Nullable<string> | undefined
    let location: number | undefined = keyDetails.location || 0
    let key: string | undefined
    let code: string | undefined = keyDetails.code
    let eventConstructor = 'KeyboardEvent'
    let cancelable = true
    let addModifiers = true
    let inputType: string | undefined

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
        const charCodeAt = text!.charCodeAt(0)

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

        // WebKit will insert characters on a textInput event, resulting
        // in double char entry when the default handler is executed. But values
        // inserted by textInput aren't always correct/aren't filtered
        // through our shouldUpdateValue logic, so we prevent textInput's
        // default logic by removing the key data from the event.
        if (Cypress.isBrowser('webkit')) {
          data = ''
        } else {
          data = text === '\r' ? '↵' : text
        }

        break

      case 'beforeinput':
        eventConstructor = 'InputEvent'
        addModifiers = false
        data = text === '\r' ? null : text
        code = undefined
        location = undefined
        cancelable = true
        inputType = this.getInputType(keyDetails.code, $elements.isContentEditable(el))
        break

      case 'input':
        eventConstructor = 'InputEvent'
        addModifiers = false
        data = text === '\r' ? null : text
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
      const modifierEventOptions = toModifiersEventOptions(this.getActiveModifiers())

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
          // allow propagation out of root of shadow-dom
          // https://developer.mozilla.org/en-US/docs/Web/API/Event/composed
          composed: true,
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
          inputType,
        },
        _.isUndefined,
      ),
    }

    let event: Event

    debug('event options:', eventType, eventOptions)
    if (eventConstructor === 'TextEvent' && win[eventConstructor]) {
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
      let constructor = win[eventConstructor]

      // When event constructor doesn't exist, fallback to KeyboardEvent.
      // It's necessary because Firefox doesn't support InputEvent.
      if (typeof constructor !== 'function') {
        constructor = win['KeyboardEvent']
      }

      event = new constructor(eventType, eventOptions)
      _.extend(event, eventOptions)
    }

    const dispatched = el.dispatchEvent(event)

    debug(`dispatched [${eventType}] on ${el}`)
    const formattedKeyString = getFormattedKeyString(keyDetails)

    options.onEvent(options.id, formattedKeyString, event, dispatched)

    return dispatched
  }

  getInputType (code, isContentEditable) {
  // TODO: we DO set inputType for the following but DO NOT perform the correct default action
  // e.g: we don't delete the entire word with `{ctrl}{del}` but send correct inputType:
  // - deleteWordForward
  // - deleteWordBackward
  // - deleteHardLineForward
  // - deleteHardLineBackward
  //
  // TODO: we do NOT set the following input types at all, since we don't yet support copy/paste actions
  // e.g. we dont actually paste clipboard contents when typing '{ctrl}v':
  // - insertFromPaste
  // - deleteByCut
  // - historyUndo
  // - historyRedo
  //
  // @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/beforeinput_event

    const { shift, ctrl } = this.getActiveModifiers()

    if (code === 'Enter') {
      return isContentEditable ? 'insertParagraph' : 'insertLineBreak'
    }

    if (code === 'Backspace') {
      if (shift && ctrl) {
        return 'deleteHardLineBackward'
      }

      if (ctrl) {
        return 'deleteWordBackward'
      }

      return 'deleteContentBackward'
    }

    if (code === 'Delete') {
      if (shift && ctrl) {
        return 'deleteHardLineForward'
      }

      if (ctrl) {
        return 'deleteWordForward'
      }

      return 'deleteContentForward'
    }

    return 'insertText'
  }

  getActiveModifiers () {
    return _.clone(this.state('keyboardModifiers')) || _.clone(INITIAL_MODIFIERS)
  }

  getModifierKeyDetails (key: KeyDetails) {
    const modifiers = this.getActiveModifiers()
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

    // TODO: Re-think skipping text insert if non-shift modifiers
    // @see https://github.com/cypress-io/cypress/issues/5622
    // if (hasModifierBesidesShift(modifiers)) {
    //   details.text = ''
    // }

    return details
  }

  flagModifier (key: KeyModifiers, setTo = true) {
    debug('handleModifier', key.key)
    const modifier = keyToModifierMap[key.key]

    // do nothing if already activated
    if (Boolean(this.getActiveModifiers()[modifier]) === setTo) {
      return false
    }

    const _activeModifiers = this.getActiveModifiers()

    _activeModifiers[modifier] = setTo

    this.state('keyboardModifiers', _activeModifiers)

    return true
  }

  simulatedKeydown (el: HTMLElement, _key: KeyDetails, options: typeOptions) {
    if (isModifier(_key)) {
      const didFlag = this.flagModifier(_key)

      if (!didFlag) {
        // we've already pressed this modifier, so ignore it and don't fire keydown or keyup
        _key.events.keydown = false
      }

      // don't fire keyup for modifier keys, this will happen after all other keys are typed
      _key.events.keyup = false
    }

    const key = this.getModifierKeyDetails(_key)

    if (!key.text) {
      key.events.keypress = false
      key.events.textInput = false
      if (key.key !== 'Backspace' && key.key !== 'Delete') {
        key.events.input = false
        key.events.beforeinput = false
      }
    }

    let elToType

    options.id = _.uniqueId('char')

    debug(
      'typeSimulatedKey options:',
      _.pick(options, ['keydown', 'keypress', 'textInput', 'input', 'id']),
    )

    if (
      shouldIgnoreEvent('keydown', key.events) ||
      this.fireSimulatedEvent(el, 'keydown', key, options)
    ) {
      elToType = this.getActiveEl(options)

      if (key.key === 'Enter' && $elements.isInput(elToType)) {
        key.events.textInput = false
        key.events.input = false
      }

      if ($elements.isContentEditable(elToType)) {
        key.events.input = false

        if (Cypress.isBrowser('webkit')) {
          // WebKit will emit beforeinput itself when the text is
          // inserted into a contenteditable input using `execCommand('insertText')`.
          // We prevent the simulated event from firing to avoid duplicative events.
          key.events.beforeinput = false
        }
      } else if ($elements.isReadOnlyInputOrTextarea(elToType)) {
        key.events.textInput = false
      }

      if (
        shouldIgnoreEvent('keypress', key.events) ||
        this.fireSimulatedEvent(elToType, 'keypress', key, options)
      ) {
        if (
          shouldIgnoreEvent('beforeinput', key.events) ||
          this.fireSimulatedEvent(elToType, 'beforeinput', key, options)
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

  simulateShortcut (el: HTMLElement, key: ShortcutDetails, options) {
    key.modifiers.forEach((key) => {
      this.simulatedKeydown(el, key, options)
    })

    this.simulatedKeydown(el, key.key, options)
    this.simulatedKeyup(el, key.key, options)

    options.id = _.uniqueId('char')

    const elToKeyup = this.getActiveEl(options)

    key.modifiers.reverse().forEach((key) => {
      delete key.events.keyup
      options.id = _.uniqueId('char')
      this.simulatedKeyup(elToKeyup, key, options)
    })
  }

  simulatedKeyup (el: HTMLElement, _key: KeyDetails, options: typeOptions) {
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

  getSimulatedDefaultForKey (key: KeyDetails, options) {
    debug('getSimulatedDefaultForKey', key.key)
    if (key.simulatedDefault) return key.simulatedDefault

    if (simulatedDefaultKeyMap[key.key]) {
      return simulatedDefaultKeyMap[key.key]
    }

    return (el: HTMLElement) => {
      if (!shouldUpdateValue(el, key, options)) {
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

    // If focus has changed to a new element, use the new element
    // however, if the new element is the body (aka the current element was blurred) continue with the same element.
    // this is to prevent strange edge cases where an element loses focus due to framework rerender or page load.
    // https://github.com/cypress-io/cypress/issues/5480
    options.targetEl = $elements.getActiveElByDocument(options.$el) || options.targetEl || doc.body

    return options.targetEl
  }

  performSimulatedDefault (el: HTMLElement, key: KeyDetails, options: any) {
    debug('performSimulatedDefault', key.key)
    const simulatedDefault = this.getSimulatedDefaultForKey(key, options)

    if ($elements.isTextLike(el)) {
      if ($elements.isInput(el) || $elements.isTextarea(el)) {
        const curText = $elements.getNativeProp(el, 'value')

        simulatedDefault(el, key, options)
        if (key.events.input !== false) {
          options.onValueChange(curText, el)
        }
      } else {
        // el is contenteditable
        simulatedDefault(el, key, options)
      }

      debug({ key })

      shouldIgnoreEvent('input', key.events) ||
        this.fireSimulatedEvent(el, 'input', key, options)

      return
    }

    return simulatedDefault(el as HTMLTextLikeElement, key, options)
  }
}

let _defaults

const reset = () => {
  _defaults = {
    keystrokeDelay: 10,
  }
}

reset()

const getConfig = () => {
  return _.clone(_defaults)
}

const defaults = (props: Partial<Cypress.KeyboardDefaultsOptions>) => {
  if (!_.isPlainObject(props)) {
    $errUtils.throwErrByPath('keyboard.invalid_arg', {
      args: { arg: $utils.stringify(props) },
    })
  }

  if (!('keystrokeDelay' in props)) {
    return getConfig()
  }

  if (!_.isNumber(props.keystrokeDelay) || props.keystrokeDelay! < 0) {
    $errUtils.throwErrByPath('keyboard.invalid_delay', {
      args: {
        cmd: 'Cypress.Keyboard.defaults',
        docsPath: 'keyboard-api',
        option: 'keystrokeDelay',
        delay: $utils.stringify(props.keystrokeDelay),
      },
    })
  }

  _.extend(_defaults, {
    keystrokeDelay: props.keystrokeDelay,
  })

  return getConfig()
}

export default {
  defaults,
  getConfig,
  getKeymap,
  modifiersToString,
  reset,
  toModifiersEventOptions,
  fromModifierEventOptions,
}
