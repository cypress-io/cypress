import $utils from '../../cypress/utils'
import $errUtils from '../../cypress/error_utils'
import { difference, isPlainObject, isString } from 'lodash'

const validOptionKeys = Object.freeze(['args'])

export class Validator {
  log: Cypress.Log
  onFailure: () => {}

  constructor ({ log, onFailure }) {
    this.log = log
    this.onFailure = onFailure
  }

  validate ({ callbackFn, options, originOrDomain }) {
    if (!isString(originOrDomain)) {
      this.onFailure()

      $errUtils.throwErrByPath('origin.invalid_origin_argument', {
        onFail: this.log,
        args: { arg: $utils.stringify(originOrDomain) },
      })
    }

    if (options) {
      if (!isPlainObject(options)) {
        this.onFailure()

        $errUtils.throwErrByPath('origin.invalid_options_argument', {
          onFail: this.log,
          args: { arg: $utils.stringify(options) },
        })
      }

      const extraneousKeys = difference(Object.keys(options), validOptionKeys)

      if (extraneousKeys.length) {
        this.onFailure()

        $errUtils.throwErrByPath('origin.extraneous_options_argument', {
          onFail: this.log,
          args: {
            extraneousKeys: extraneousKeys.join(', '),
            validOptionKeys: validOptionKeys.join(', '),
          },
        })
      }
    }

    if (typeof callbackFn !== 'function') {
      this.onFailure()

      $errUtils.throwErrByPath('origin.invalid_fn_argument', {
        onFail: this.log,
        args: { arg: $utils.stringify(callbackFn) },
      })
    }
  }

  validateLocation (location, originOrDomain) {
    // we don't support query params, hashes, or paths (except for '/')
    if (location.search.length > 0 || location.pathname.length > 1 || location.hash.length > 0) {
      this.onFailure()

      $errUtils.throwErrByPath('origin.invalid_origin_argument', {
        onFail: this.log,
        args: { arg: $utils.stringify(originOrDomain) },
      })
    }
  }
}
