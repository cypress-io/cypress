// tests in driver/test/cypress/integration/commands/assertions_spec.coffee

const _ = require('lodash')
const $ = require('jquery')
const chai = require('chai')
const sinonChai = require('@cypress/sinon-chai')

const $dom = require('../dom')
const $utils = require('../cypress/utils')
const $chaiJquery = require('../cypress/chai_jquery')

// all words between single quotes which are at
// the end of the string
const allPropertyWordsBetweenSingleQuotes = /('.*?')$/g

// grab all words between single quotes except
// when the single quote word is the LAST word
const allButLastWordsBetweenSingleQuotes = /('.*?')(.+)/g

const allBetweenFourStars = /\*\*.*\*\*/
const allSingleQuotes = /'/g
const allEscapedSingleQuotes = /\\'/g
const allQuoteMarkers = /__quote__/g
const allWordsBetweenCurlyBraces = /(#{.+?})/g
const allQuadStars = /\*\*\*\*/g

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
      const err = $utils.cypressErr(
        $utils.errMessageByPath(
          'chai.invalid_jquery_obj', {
            assertion: method,
            subject: $utils.stringifyActual(obj),
          }
        )
      )

      throw err
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
  existProto = Object.getOwnPropertyDescriptor(chai.Assertion.prototype, 'exist').get;
  ({ getMessage } = chaiUtils)

  // remove any single quotes between our **, preserving escaped quotes
  // and if an empty string, put the quotes back
  const removeOrKeepSingleQuotesBetweenStars = (message) => {
    return message.replace(allBetweenFourStars, (match) => {
      return match
      .replace(allEscapedSingleQuotes, '__quote__') // preserve escaped quotes
      .replace(allSingleQuotes, '')
      .replace(allQuoteMarkers, '\'') // put escaped quotes back
      .replace(allQuadStars, '**\'\'**')
    })
  } // fix empty strings that end up as ****

  const replaceArgMessages = (args, str) => {
    return _.reduce(args, (memo, value, index) => {
      if (_.isString(value)) {
        value = value
        .replace(allWordsBetweenCurlyBraces, '**$1**')
        .replace(allEscapedSingleQuotes, '__quote__')
        .replace(allButLastWordsBetweenSingleQuotes, '**$1**$2')
        .replace(allPropertyWordsBetweenSingleQuotes, '**$1**')

        memo.push(value)
      } else {
        memo.push(value)
      }

      return memo
    }, [])
  }

  const restoreAsserts = function () {
    chaiUtils.getMessage = getMessage

    chai.Assertion.prototype.assert = assertProto
    chai.Assertion.prototype.match = matchProto
    chai.Assertion.prototype.__methods.length.method = lengthProto
    chai.Assertion.prototype.__methods.contain.method = containProto

    return Object.defineProperty(chai.Assertion.prototype, 'exist', { get: existProto })
  }

  const overrideChaiAsserts = function (assertFn) {
    chai.Assertion.prototype.assert = createPatchedAssert(assertFn)

    chaiUtils.getMessage = function (assert, args) {
      const obj = assert._obj

      // if we are formatting a DOM object
      if ($dom.isDom(obj)) {
        // replace object with our formatted one
        assert._obj = $dom.stringify(obj, 'short')
      }

      const msg = getMessage.call(this, assert, args)

      // restore the real obj if we changed it
      if (obj !== assert._obj) {
        assert._obj = obj
      }

      return msg
    }

    chai.Assertion.overwriteMethod('match', (_super) => {
      return (function (regExp, ...args) {
        if (_.isRegExp(regExp) || $dom.isDom(this._obj)) {
          return _super.apply(this, [regExp, ...args])
        }

        const err = $utils.cypressErr($utils.errMessageByPath('chai.match_invalid_argument', { regExp }))

        err.retry = false
        throw err
      })
    })

    const containFn1 = (_super) => {
      return (function (text, ...args) {
        let obj = this._obj

        if (!($dom.isJquery(obj) || $dom.isElement(obj))) {
          return _super.apply(this, [text, ...args])
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
          text
        )
      })
    }

    const containFn2 = (_super) => {
      return (function (...args) {
        _super.apply(this, args)
      })
    }

    chai.Assertion.overwriteChainableMethod('contain', containFn1, containFn2)

    chai.Assertion.overwriteChainableMethod('length',
      (_super) => {
        return (function (length, ...args) {
          let obj = this._obj

          if (!($dom.isJquery(obj) || $dom.isElement(obj))) {
            return _super.apply(this, [length, ...args])
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
              obj.length
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

              e1.displayMessage = getLongLengthMessage(obj.length, length)
              throw e1
            }

            const e2 = $utils.cypressErr($utils.errMessageByPath('chai.length_invalid_argument', { length }))

            e2.retry = false
            throw e2
          }
        })
      },
      (_super) => {
        return (function (...args) {
          return _super.apply(this, args)
        })
      })

    return chai.Assertion.overwriteProperty('exist', (_super) => {
      return (function (...args) {
        const obj = this._obj

        if (!($dom.isJquery(obj) || $dom.isElement(obj))) {
          try {
            return _super.apply(this, args)
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
              node
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

              return `Expected to find element: '${obj.selector}', but never found it.`
            }

            e1.displayMessage = getLongExistsMessage(obj)
            throw e1
          }
        }
      })
    })
  }

  const createPatchedAssert = (assertFn) => {
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

      if (err) {
        throw err
      }
    })
  }

  // only override assertions for this specific
  // expect function instance so we do not affect
  // the outside world
  const overrideExpect = () => {
    // make the assertion
    return (val, message) => {
      return new chai.Assertion(val, message)
    }
  }

  const overrideAssert = function () {
    const fn = (express, errmsg) => {
      return chai.assert(express, errmsg)
    }

    const fns = _.functions(chai.assert)

    _.each(fns, (name) => {
      return fn[name] = function (...args) {
        return chai.assert[name].apply(this, args)
      }
    })

    return fn
  }

  const setSpecWindowGlobals = function (specWindow, assertFn) {
    const expect = overrideExpect()
    const assert = overrideAssert()

    specWindow.chai = chai
    specWindow.expect = expect
    specWindow.assert = assert

    return {
      chai,
      expect,
      assert,
    }
  }

  const create = function (specWindow, assertFn) {
    // restoreOverrides()
    restoreAsserts()

    // overrideChai()
    overrideChaiAsserts(assertFn)

    return setSpecWindowGlobals(specWindow)
  }

  module.exports = {
    replaceArgMessages,

    removeOrKeepSingleQuotesBetweenStars,

    setSpecWindowGlobals,

    // overrideChai: overrideChai

    restoreAsserts,

    overrideExpect,

    overrideChaiAsserts,

    create,
  }
})
