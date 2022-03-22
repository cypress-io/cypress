import $utils from '../../cypress/utils'
import $errUtils from '../../cypress/error_utils'
import { isObject, isString } from 'lodash'

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

      $errUtils.throwErrByPath('switchToDomain.invalid_origin_argument', {
        onFail: this.log,
        args: { arg: $utils.stringify(originOrDomain) },
      })
    }

    if (options && (!isObject(options) || Array.isArray(options))) {
      this.onFailure()

      $errUtils.throwErrByPath('switchToDomain.invalid_options_argument', {
        onFail: this.log,
        args: { arg: $utils.stringify(options) },
      })
    } else if (options && !Object.getOwnPropertyDescriptor(options, 'args')) {
      this.onFailure()

      $errUtils.throwErrByPath('switchToDomain.incomplete_options_argument', {
        onFail: this.log,
        args: { arg: $utils.stringify(options) },
      })
    }

    if (typeof callbackFn !== 'function') {
      this.onFailure()

      $errUtils.throwErrByPath('switchToDomain.invalid_fn_argument', {
        onFail: this.log,
        args: { arg: $utils.stringify(callbackFn) },
      })
    }
  }

  validateLocation (location, originOrDomain) {
    // we don't support query params, hashes, or paths (except for '/')
    if (location.search.length > 0 || location.pathname.length > 1 || location.hash.length > 0) {
      this.onFailure()

      $errUtils.throwErrByPath('switchToDomain.invalid_origin_argument', {
        onFail: this.log,
        args: { arg: $utils.stringify(originOrDomain) },
      })
    }
  }
}
