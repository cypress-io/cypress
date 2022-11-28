import { URL } from 'url'
import path from 'path'
import * as _ from 'lodash'
import * as is from 'check-more-types'
import { commaListsOr } from 'common-tags'
import Debug from 'debug'
import { BROWSER_FAMILY } from '@packages/types'

const debug = Debug('cypress:server:validation')

// validation functions take a key and a value and should:
//  - return true if it passes validation
//  - return a error message if it fails validation

const str = JSON.stringify

export type ErrResult = {
  key: string
  value: any
  type: string
  list?: string
}

const errMsg = (key: string, value: any, type: string): ErrResult => {
  return {
    key,
    value,
    type,
  }
}

const _isFullyQualifiedUrl = (value: any): ErrResult | boolean => {
  return _.isString(value) && /^https?\:\/\//.test(value)
}

const isArrayOfStrings = (value: any): ErrResult | boolean => {
  return _.isArray(value) && _.every(value, _.isString)
}

const isFalse = (value: any): boolean => {
  return value === false
}

/**
 * Validates a single browser object.
 * @returns {string|true} Returns `true` if the object is matching browser object schema. Returns an error message if it does not.
 */
export const isValidBrowser = (browser: any): ErrResult | true => {
  if (!is.unemptyString(browser.name)) {
    return errMsg('name', browser, 'a non-empty string')
  }

  if (!is.oneOf(BROWSER_FAMILY)(browser.family)) {
    return errMsg('family', browser, commaListsOr`either ${BROWSER_FAMILY}`)
  }

  if (!is.unemptyString(browser.displayName)) {
    return errMsg('displayName', browser, 'a non-empty string')
  }

  if (!is.unemptyString(browser.version)) {
    return errMsg('version', browser, 'a non-empty string')
  }

  if (typeof browser.path !== 'string') {
    return errMsg('path', browser, 'a string')
  }

  if (typeof browser.majorVersion !== 'string' && !(is.number(browser.majorVersion) && browser.majorVersion > 0)) {
    return errMsg('majorVersion', browser, 'a string or a positive number')
  }

  return true
}

/**
 * Validates the list of browsers.
 */
export const isValidBrowserList = (_key: string, browsers: any): ErrResult | true | string => {
  debug('browsers %o', browsers)
  if (!browsers) {
    return 'Missing browsers list'
  }

  if (!Array.isArray(browsers)) {
    debug('browsers is not an array', typeof browsers)

    return 'Browsers should be an array'
  }

  if (!browsers.length) {
    return 'Expected at least one browser'
  }

  for (let k = 0; k < browsers.length; k += 1) {
    const validationResult: boolean | {key: string, value: string, type: string, list?: string} = isValidBrowser(browsers[k])

    if (validationResult !== true) {
      validationResult.list = 'browsers'

      return validationResult
    }
  }

  return true
}

export const isValidRetriesConfig = (key: string, value: any): ErrResult | true => {
  const optionalKeys = ['runMode', 'openMode']
  const isValidRetryValue = (val: any) => _.isNull(val) || (Number.isInteger(val) && val >= 0)
  const optionalKeysAreValid = (val: any, k: string) => optionalKeys.includes(k) && isValidRetryValue(val)

  if (isValidRetryValue(value)) {
    return true
  }

  if (_.isObject(value) && _.every(value, optionalKeysAreValid)) {
    return true
  }

  return errMsg(key, value, 'a positive number or null or an object with keys "openMode" and "runMode" with values of numbers or nulls')
}

/**
 * Checks if given value for a key is equal to one of the provided values.
 * @example
  ```
  validate = v.isOneOf("foo", "bar")
  validate("example", "foo") // true
  validate("example", "else") // error message string
  ```
  */
export const isOneOf = (...values: any[]): ((key: string, value: any) => ErrResult | true) => {
  return (key, value) => {
    if (values.some((v) => {
      if (typeof value === 'function') {
        return value(v)
      }

      return v === value
    })) {
      return true
    }

    const strings = values.map((a) => str(a)).join(', ')

    return errMsg(key, value, `one of these values: ${strings}`)
  }
}

/**
 * Validates whether the supplied set of cert information is valid
 * @returns {string|true} Returns `true` if the information set is valid. Returns an error message if it is not.
 */
// _key: string, certsForUrls: any[]): ErrResult | true {}
export const isValidClientCertificatesSet = (_key: string, certsForUrls: Array<{
  name?: string
  url?: string
  ca?: string[]
  certs?: Array<{
    key: string
    cert: string
    pfx: string
  }>}>): ErrResult | true | string => {
  debug('clientCerts: %o', certsForUrls)

  if (!Array.isArray(certsForUrls)) {
    return errMsg(`clientCertificates.certs`, certsForUrls, 'an array of certs for URLs')
  }

  let urls: string[] = []

  for (let i = 0; i < certsForUrls.length; i++) {
    debug(`Processing clientCertificates: ${i}`)
    let certsForUrl = certsForUrls[i]

    if (!certsForUrl) {
      continue
    }

    if (!certsForUrl.url) {
      return errMsg(`clientCertificates[${i}].url`, certsForUrl.url, 'a URL matcher')
    }

    if (certsForUrl.url !== '*') {
      try {
        let parsed = new URL(certsForUrl.url)

        if (parsed.protocol !== 'https:') {
          return errMsg(`clientCertificates[${i}].url`, certsForUrl.url, 'an https protocol')
        }
      } catch (e) {
        return errMsg(`clientCertificates[${i}].url`, certsForUrl.url, 'a valid URL')
      }
    }

    if (urls.includes(certsForUrl.url)) {
      return `clientCertificates has duplicate client certificate URL: ${certsForUrl.url}`
    }

    urls.push(certsForUrl.url)

    if (certsForUrl.ca && !Array.isArray(certsForUrl.ca)) {
      return errMsg(`clientCertificates[${i}].ca`, certsForUrl.ca, 'an array of CA filepaths')
    }

    if (!Array.isArray(certsForUrl.certs)) {
      return errMsg(`clientCertificates[${i}].certs`, certsForUrl.certs, 'an array of certs')
    }

    for (let j = 0; j < certsForUrl.certs.length; j++) {
      let certInfo = certsForUrl.certs[j]!

      // Only one of PEM or PFX cert allowed
      if (certInfo.cert && certInfo.pfx) {
        return `\`clientCertificates[${i}].certs[${j}]\` has both PEM and PFX defined`
      }

      if (!certInfo.cert && !certInfo.pfx) {
        return `\`clientCertificates[${i}].certs[${j}]\` must have either PEM or PFX defined`
      }

      if (certInfo.pfx) {
        if (path.isAbsolute(certInfo.pfx)) {
          return errMsg(`clientCertificates[${i}].certs[${j}].pfx`, certInfo.pfx, 'a relative filepath')
        }
      }

      if (certInfo.cert) {
        if (path.isAbsolute(certInfo.cert)) {
          return errMsg(`clientCertificates[${i}].certs[${j}].cert`, certInfo.cert, 'a relative filepath')
        }

        if (!certInfo.key) {
          return errMsg(`clientCertificates[${i}].certs[${j}].key`, certInfo.key, 'a key filepath')
        }

        if (path.isAbsolute(certInfo.key)) {
          return errMsg(`clientCertificates[${i}].certs[${j}].key`, certInfo.key, 'a relative filepath')
        }
      }
    }

    if (certsForUrl.ca) {
      for (let k = 0; k < certsForUrl.ca.length; k++) {
        if (path.isAbsolute(certsForUrl.ca[k] || '')) {
          return errMsg(`clientCertificates[${k}].ca[${k}]`, certsForUrl.ca[k], 'a relative filepath')
        }
      }
    }
  }

  return true
}

export const isPlainObject = (key: string, value: any) => {
  if (value == null || _.isPlainObject(value)) {
    return true
  }

  return errMsg(key, value, 'a plain object')
}

export function isBoolean (key: string, value: any): ErrResult | true {
  if (value == null || _.isBoolean(value)) {
    return true
  }

  return errMsg(key, value, 'a boolean')
}

export function isNumber (key: string, value: any): ErrResult | true {
  if (value == null || _.isNumber(value)) {
    return true
  }

  return errMsg(key, value, 'a number')
}

export function isString (key: string, value: any): ErrResult | true {
  if (value == null || _.isString(value)) {
    return true
  }

  return errMsg(key, value, 'a string')
}

export function isArray (key: string, value: any) {
  if (value == null || _.isArray(value)) {
    return true
  }

  return errMsg(key, value, 'an array')
}

export function isNumberOrFalse (key: string, value: any): ErrResult | true {
  if (_.isNumber(value) || isFalse(value)) {
    return true
  }

  return errMsg(key, value, 'a number or false')
}

export function isStringOrFalse (key: string, value: any): ErrResult | true {
  if (_.isString(value) || isFalse(value)) {
    return true
  }

  return errMsg(key, value, 'a string or false')
}

export function isFullyQualifiedUrl (key: string, value: any): ErrResult | true {
  if (value == null || _isFullyQualifiedUrl(value)) {
    return true
  }

  return errMsg(
    key,
    value,
    'a fully qualified URL (starting with `http://` or `https://`)',
  )
}

export function isStringOrArrayOfStrings (key: string, value: any): ErrResult | true {
  if (_.isString(value) || isArrayOfStrings(value)) {
    return true
  }

  return errMsg(key, value, 'a string or an array of strings')
}
