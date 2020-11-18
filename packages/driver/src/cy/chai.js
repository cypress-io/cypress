/* eslint-disable prefer-rest-params */
// tests in driver/cypress/integration/commands/assertions_spec.js

const _ = require('lodash')
const $ = require('jquery')
const chai = require('chai')
const sinonChai = require('@cypress/sinon-chai')

const $dom = require('../dom')
const $utils = require('../cypress/utils')
const $errUtils = require('../cypress/error_utils')
const $stackUtils = require('../cypress/stack_utils')
const $chaiJquery = require('../cypress/chai_jquery')
const chaiInspect = require('./chai/inspect')

// all words between single quotes
const allPropertyWordsBetweenSingleQuotes = /('.*?')/g

const allBetweenFourStars = /\*\*.*\*\*/
const allNumberStrings = /'([0-9]+)'/g
const allEmptyStrings = /''/g
const allSingleQuotes = /'/g
const allEscapedSingleQuotes = /\\'/g
const allQuoteMarkers = /__quote__/g
const allWordsBetweenCurlyBraces = /(#{.+?})/g
const allQuadStars = /\*\*\*\*/g
const leadingWhitespaces = /\*\*'\s*/g
const trailingWhitespaces = /\s*'\*\*/g
const whitespace = /\s/g
const valueHasLeadingOrTrailingWhitespaces = /\*\*'\s+|\s+'\*\*/g

let assertProto = null
let matchProto = null
let lengthProto = null
let containProto = null
let existProto = null
let getMessage = null
let chaiUtils = null

chai.use(sinonChai)

chai.use((chai, u) => {
  chaiUtils = u

  $chaiJquery(chai, chaiUtils, {
    onInvalid (method, obj) {
      $errUtils.throwErrByPath('chai.invalid_jquery_obj', {
        args: {
          assertion: method,
          subject: $utils.stringifyActual(obj),
        },
      })
    },

    onError (err, method, obj, negated) {
      switch (method) {
        case 'visible':
          if (!negated) {
            // add reason hidden unless we expect the element to be hidden
            const reason = $dom.getReasonIsHidden(obj)

            err.message += `\n\n${reason}`
          }

          break
        default:
          break
      }

      // always rethrow the error!
      throw err
    },
  })

  assertProto = chai.Assertion.prototype.assert
  matchProto = chai.Assertion.prototype.match
  lengthProto = chai.Assertion.prototype.__methods.length.method
  containProto = chai.Assertion.prototype.__methods.contain.method
  existProto = Object.getOwnPropertyDescriptor(chai.Assertion.prototype, 'exist').get
  const { objDisplay } = chai.util;

  ({ getMessage } = chai.util)
  const _inspect = chai.util.inspect

  const { inspect, setFormatValueHook } = chaiInspect.create(chai)

  // prevent tunneling into Window objects (can throw cross-origin errors)
  setFormatValueHook((ctx, val) => {
    // https://github.com/cypress-io/cypress/issues/5270
    // When name attribute exists in <iframe>,
    // Firefox returns [object Window] but Chrome returns [object Object]
    // So, we try throwing an error and check the error message.
    try {
      val && val.document
      val && val.inspect
    } catch (e) {
      if (e.stack.indexOf('cross-origin') !== -1 || // chrome
      e.message.indexOf('cross-origin') !== -1) { // firefox
        return `[window]`
      }
    }
  })

  // remove any single quotes between our **,
  // except escaped quotes, empty strings and number strings.
  const removeOrKeepSingleQuotesBetweenStars = (message) => {
    // remove any single quotes between our **, preserving escaped quotes
    // and if an empty string, put the quotes back
    return message.replace(allBetweenFourStars, (match) => {
      if (valueHasLeadingOrTrailingWhitespaces.test(match)) {
        // Above we used \s+, but below we use \s*.
        // It's because of the strings like '   love' that have empty spaces on one side only.
        match = match
        .replace(leadingWhitespaces, (match) => {
          return match.replace(`**'`, '**__quote__')
          .replace(whitespace, '&nbsp;')
        })
        .replace(trailingWhitespaces, (match) => {
          return match.replace(`'**`, '__quote__**')
          .replace(whitespace, '&nbsp;')
        })
      }

      return match
      .replace(allEscapedSingleQuotes, '__quote__') // preserve escaped quotes
      .replace(allNumberStrings, '__quote__$1__quote__') // preserve number strings (e.g. '42')
      .replace(allEmptyStrings, '__quote____quote__') // preserve empty strings (e.g. '')
      .replace(allSingleQuotes, '')
      .replace(allQuoteMarkers, '\'') // put escaped quotes back
    })
  }

  const replaceArgMessages = (args, str) => {
    return _.reduce(args, (memo, value, index) => {
      if (_.isString(value)) {
        value = value
        .replace(allWordsBetweenCurlyBraces, '**$1**')
        .replace(allEscapedSingleQuotes, '__quote__')
        .replace(allPropertyWordsBetweenSingleQuotes, '**$1**')
        // when a value has ** in it, **** are sometimes created after the process above.
        // remove them with this.
        .replace(allQuadStars, '**')

        memo.push(value)
      } else {
        memo.push(value)
      }

      return memo
    }
    , [])
  }

  const restoreAsserts = function () {
    chai.util.inspect = _inspect
    chai.util.getMessage = getMessage
    chai.util.objDisplay = objDisplay
    chai.Assertion.prototype.assert = assertProto
    chai.Assertion.prototype.match = matchProto
    chai.Assertion.prototype.__methods.length.method = lengthProto
    chai.Assertion.prototype.__methods.contain.method = containProto

    return Object.defineProperty(chai.Assertion.prototype, 'exist', { get: existProto })
  }

  const overrideChaiInspect = () => {
    return chai.util.inspect = inspect
  }

  const overrideChaiObjDisplay = () => {
    return chai.util.objDisplay = function (obj) {
      const str = chai.util.inspect(obj)
      const type = Object.prototype.toString.call(obj)

      if (chai.config.truncateThreshold && (str.length >= chai.config.truncateThreshold)) {
        if (type === '[object Function]') {
          if (!obj.name || (obj.name === '')) {
            return '[Function]'
          }

          return `[Function: ${obj.name}]`
        }

        if (type === '[object Array]') {
          return `[ Array(${obj.length}) ]`
        }

        if (type === '[object Object]') {
          const keys = Object.keys(obj)
          const kstr = keys.length > 2 ? `${keys.splice(0, 2).join(', ')}, ...` : keys.join(', ')

          return `{ Object (${kstr}) }`
        }

        return str
      }

      return str
    }
  }

  const overrideChaiAsserts = function (specWindow, state, assertFn) {
    chai.Assertion.prototype.assert = createPatchedAssert(specWindow, state, assertFn)

    const _origGetmessage = function (obj, args) {
      const negate = chaiUtils.flag(obj, 'negate')
      const val = chaiUtils.flag(obj, 'object')
      const expected = args[3]
      const actual = chaiUtils.getActual(obj, args)
      let msg = (negate ? args[2] : args[1])
      const flagMsg = chaiUtils.flag(obj, 'message')

      if (typeof msg === 'function') {
        msg = msg()
      }

      msg = msg || ''
      msg = msg
      .replace(/#\{this\}/g, () => {
        return chaiUtils.objDisplay(val)
      })
      .replace(/#\{act\}/g, () => {
        return chaiUtils.objDisplay(actual)
      })
      .replace(/#\{exp\}/g, () => {
        return chaiUtils.objDisplay(expected)
      })

      return (flagMsg ? `${flagMsg}: ${msg}` : msg)
    }

    chaiUtils.getMessage = function (assert, args) {
      const obj = assert._obj

      // if we are formatting a DOM object
      if ($dom.isDom(obj)) {
        // replace object with our formatted one
        assert._obj = $dom.stringify(obj, 'short')
      }

      const msg = _origGetmessage.call(this, assert, args)

      // restore the real obj if we changed it
      if (obj !== assert._obj) {
        assert._obj = obj
      }

      return msg
    }

    chai.Assertion.overwriteMethod('match', (_super) => {
      return (function (regExp) {
        if (_.isRegExp(regExp) || $dom.isDom(this._obj)) {
          return _super.apply(this, arguments)
        }

        const err = $errUtils.cypressErrByPath('chai.match_invalid_argument', { args: { regExp } })

        err.retry = false
        throw err
      })
    })

    const containFn1 = (_super) => {
      return (function (text) {
        let obj = this._obj

        if (!($dom.isElement(obj))) {
          return _super.apply(this, arguments)
        }

        const escText = $utils.escapeQuotes(text)

        const selector = `:contains('${escText}'), [type='submit'][value~='${escText}']`

        // the assert checks below only work if $dom.isJquery(obj)
        // https://github.com/cypress-io/cypress/issues/3549
        if (!($dom.isJquery(obj))) {
          obj = $(obj)
        }

        this.assert(
          obj.is(selector) || !!obj.find(selector).length,
          'expected #{this} to contain #{exp}',
          'expected #{this} not to contain #{exp}',
          text,
        )
      })
    }

    const containFn2 = (_super) => {
      return (function () {
        return _super.apply(this, arguments)
      })
    }

    chai.Assertion.overwriteChainableMethod('contain', containFn1, containFn2)

    chai.Assertion.overwriteChainableMethod('length',
      (_super) => {
        return (function (length) {
          let obj = this._obj

          if (!($dom.isJquery(obj) || $dom.isElement(obj))) {
            return _super.apply(this, arguments)
          }

          length = $utils.normalizeNumber(length)

          // filter out anything not currently in our document
          if ($dom.isDetached(obj)) {
            obj = (this._obj = obj.filter((index, el) => {
              return $dom.isAttached(el)
            }))
          }

          const node = obj && obj.length ? $dom.stringify(obj, 'short') : obj.selector

          // if our length assertion fails we need to check to
          // ensure that the length argument is a finite number
          // because if its not, we need to bail on retrying
          try {
            return this.assert(
              obj.length === length,
              `expected '${node}' to have a length of \#{exp} but got \#{act}`,
              `expected '${node}' to not have a length of \#{act}`,
              length,
              obj.length,
            )
          } catch (e1) {
            e1.node = node
            e1.negated = chaiUtils.flag(this, 'negate')
            e1.type = 'length'

            if (_.isFinite(length)) {
              const getLongLengthMessage = function (len1, len2) {
                if (len1 > len2) {
                  return `Too many elements found. Found '${len1}', expected '${len2}'.`
                }

                return `Not enough elements found. Found '${len1}', expected '${len2}'.`
              }

              const newMessage = getLongLengthMessage(obj.length, length)

              $errUtils.modifyErrMsg(e1, newMessage, () => newMessage)

              throw e1
            }

            const e2 = $errUtils.cypressErrByPath('chai.length_invalid_argument', { args: { length } })

            e2.retry = false
            throw e2
          }
        })
      },

      (_super) => {
        return (function () {
          return _super.apply(this, arguments)
        })
      })

    return chai.Assertion.overwriteProperty('exist', (_super) => {
      return (function () {
        const obj = this._obj

        if (!($dom.isJquery(obj) || $dom.isElement(obj))) {
          try {
            return _super.apply(this, arguments)
          } catch (e) {
            e.type = 'existence'
            throw e
          }
        } else {
          let isAttached

          if (!obj.length) {
            this._obj = null
          }

          const node = obj && obj.length ? $dom.stringify(obj, 'short') : obj.selector

          try {
            return this.assert(
              (isAttached = $dom.isAttached(obj)),
              'expected \#{act} to exist in the DOM',
              'expected \#{act} not to exist in the DOM',
              node,
              node,
            )
          } catch (e1) {
            e1.node = node
            e1.negated = chaiUtils.flag(this, 'negate')
            e1.type = 'existence'

            const getLongExistsMessage = function (obj) {
              // if we expected not for an element to exist
              if (isAttached) {
                return `Expected ${node} not to exist in the DOM, but it was continuously found.`
              }

              return `Expected to find element: \`${obj.selector}\`, but never found it.`
            }

            const newMessage = getLongExistsMessage(obj)

            $errUtils.modifyErrMsg(e1, newMessage, () => newMessage)

            throw e1
          }
        }
      })
    })
  }

  const captureUserInvocationStack = (specWindow, state, ssfi) => {
    // we need a user invocation stack with the top line being the point where
    // the error occurred for the sake of the code frame
    // in chrome, stack lines from another frame don't appear in the
    // error. specWindow.Error works for our purposes because it
    // doesn't include anything extra (chai.Assertion error doesn't work
    // because it doesn't have lines from the spec iframe)
    // in firefox, specWindow.Error has too many extra lines at the
    // beginning, but chai.AssertionError helps us winnow those down
    const chaiInvocationStack = $stackUtils.hasCrossFrameStacks(specWindow) && (new chai.AssertionError('uis', {}, ssfi)).stack

    const userInvocationStack = $stackUtils.captureUserInvocationStack(specWindow.Error, chaiInvocationStack)

    state('currentAssertionUserInvocationStack', userInvocationStack)
  }

  const createPatchedAssert = (specWindow, state, assertFn) => {
    return (function (...args) {
      let err
      const passed = chaiUtils.test(this, args)
      const value = chaiUtils.flag(this, 'object')
      const expected = args[3]

      const customArgs = replaceArgMessages(args, this._obj)

      let message = chaiUtils.getMessage(this, customArgs)
      const actual = chaiUtils.getActual(this, customArgs)

      message = removeOrKeepSingleQuotesBetweenStars(message)

      try {
        assertProto.apply(this, args)
      } catch (e) {
        err = e
      }

      assertFn(passed, message, value, actual, expected, err)

      if (!err) return

      // when assert() is used instead of expect(), we override the method itself
      // below in `overrideAssert` and prefer the user invocation stack
      // that we capture there
      if (!state('assertUsed')) {
        captureUserInvocationStack(specWindow, state, chaiUtils.flag(this, 'ssfi'))
      }

      throw err
    })
  }

  const overrideExpect = (specWindow, state) => {
    // only override assertions for this specific
    // expect function instance so we do not affect
    // the outside world
    return (val, message) => {
      captureUserInvocationStack(specWindow, state, overrideExpect)

      // make the assertion
      return new chai.Assertion(val, message)
    }
  }

  const overrideAssert = function (specWindow, state) {
    const fn = (express, errmsg) => {
      state('assertUsed', true)
      captureUserInvocationStack(specWindow, state, fn)

      return chai.assert(express, errmsg)
    }

    const fns = _.functions(chai.assert)

    _.each(fns, (name) => {
      fn[name] = function () {
        state('assertUsed', true)
        captureUserInvocationStack(specWindow, state, overrideAssert)

        return chai.assert[name].apply(this, arguments)
      }
    })

    return fn
  }

  const setSpecWindowGlobals = function (specWindow, state) {
    const expect = overrideExpect(specWindow, state)
    const assert = overrideAssert(specWindow, state)

    specWindow.chai = chai
    specWindow.expect = expect
    specWindow.assert = assert

    return {
      chai,
      expect,
      assert,
    }
  }

  const create = function (specWindow, state, assertFn) {
    restoreAsserts()

    overrideChaiInspect()
    overrideChaiObjDisplay()
    overrideChaiAsserts(specWindow, state, assertFn)

    return setSpecWindowGlobals(specWindow, state)
  }

  module.exports = {
    replaceArgMessages,

    removeOrKeepSingleQuotesBetweenStars,

    setSpecWindowGlobals,

    restoreAsserts,

    overrideExpect,

    overrideChaiAsserts,

    create,
  }
})
