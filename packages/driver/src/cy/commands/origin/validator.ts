import $utils from '../../../cypress/utils'
import $errUtils from '../../../cypress/error_utils'
import { difference, isPlainObject, isString } from 'lodash'
import type { LocationObject } from '../../../cypress/location'

const validOptionKeys = Object.freeze(['args'])

const strictSameOriginDomains = Object.freeze(['google.com'])

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

  /**
   * Is this super domain in the list of domains that must be validated as strictly same origin?
   * @param superDomain domain, excluding sub domain.
   * @returns boolean answer to the question.
   */
  _isStrictSameOriginDomain (superDomain: string): boolean {
    for (let index = 0; index < strictSameOriginDomains.length; index++) {
      if (superDomain.endsWith(strictSameOriginDomains[0])) {
        return true
      }
    }

    return false
  }

  /**
   * Determines if the origin location is the same superDomain as the spec with excepted domains where we must check strictly for sameOrigin
   * @param originLocation - the location passed into the cy.origin command.
   * @param specLocation - the location of the current spec.
   * @returns boolean answer to the question.
   */
  _isSameSuperDomainOriginWithExceptions ({ originLocation, specLocation }: {originLocation: LocationObject, specLocation: LocationObject}): boolean {
    if (this._isStrictSameOriginDomain(originLocation.superDomainOrigin)) {
      return originLocation.origin === specLocation.origin
    }

    return originLocation.superDomainOrigin === specLocation.superDomainOrigin
  }

  /**
   * Validates the location parameter of the cy.origin call.
   * @param originLocation - the location passed into the cy.origin command.
   * @param urlOrDomain - the original string param passed in.
   * @param specLocation - the location of the current spec.
   */
  validateLocation (originLocation: LocationObject, urlOrDomain: string, specLocation: LocationObject): void {
    // we don't support query params
    if (originLocation.search.length > 0) {
      $errUtils.throwErrByPath('origin.invalid_url_argument', {
        onFail: this.log,
        args: { arg: $utils.stringify(urlOrDomain) },
      })
    }

    // Users would be better off not using cy.origin if the origin is part of the same super domain.
    if (this._isSameSuperDomainOriginWithExceptions({ originLocation, specLocation })) {
      $errUtils.throwErrByPath('origin.invalid_url_argument_same_origin', {
        onFail: this.log,
        args: {
          originUrl: $utils.stringify(urlOrDomain),
          topOrigin: (window.location.origin),
        },
      })
    }
  }
}
