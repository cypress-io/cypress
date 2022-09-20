import $utils from '../../../cypress/utils'
import $errUtils from '../../../cypress/error_utils'
import { difference, isPlainObject, isString } from 'lodash'

const validOptionKeys = Object.freeze(['args'])

export class Validator {
  log: Cypress.Log

  constructor ({ log }) {
    this.log = log
  }

  validate ({ callbackFn, options, urlOrDomain }) {
    if (!isString(urlOrDomain)) {
      $errUtils.throwErrByPath('origin.invalid_url_argument', {
        onFail: this.log,
        args: { arg: $utils.stringify(urlOrDomain) },
      })
    }

    if (options) {
      if (!isPlainObject(options)) {
        $errUtils.throwErrByPath('origin.invalid_options_argument', {
          onFail: this.log,
          args: { arg: $utils.stringify(options) },
        })
      }

      const extraneousKeys = difference(Object.keys(options), validOptionKeys)

      if (extraneousKeys.length) {
        $errUtils.throwErrByPath('origin.extraneous_options_argument', {
          onFail: this.log,
          args: {
            extraneousKeys: extraneousKeys.join(', '),
            validOptionKeys: validOptionKeys.join(', '),
          },
        })
      }
    }

    if (!this._isValidCallbackFn(callbackFn)) {
      $errUtils.throwErrByPath('origin.invalid_fn_argument', {
        onFail: this.log,
        args: { arg: $utils.stringify(callbackFn) },
      })
    }
  }

  _isValidCallbackFn (callbackFn) {
    if (_.isFunction(callbackFn)) return true

    // the user must pass a function, but at runtime the function may be
    // replaced with an object in the form
    // { callbackName: string, outputFilePath: string }
    // by the webpack-preprocessor. if it doesn't have that form, it's
    // an invalid input by the user
    if (_.isPlainObject(callbackFn)) {
      return (
        Object.keys(callbackFn).length === 2
        && _.isString(callbackFn.callbackName)
        && _.isString(callbackFn.outputFilePath)
      )
    }

    return false
  }

  validateLocation (location, urlOrDomain) {
    // we don't support query params
    if (location.search.length > 0) {
      $errUtils.throwErrByPath('origin.invalid_url_argument', {
        onFail: this.log,
        args: { arg: $utils.stringify(urlOrDomain) },
      })
    }
  }
}
