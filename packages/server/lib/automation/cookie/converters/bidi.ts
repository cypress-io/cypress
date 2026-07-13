import debugModule from 'debug'
import toInteger from 'lodash/toInteger'
import isNumber from 'lodash/isNumber'
import type { NetworkCookie, NetworkSameSite } from 'webdriver/build/bidi/localTypes'
import { isHostOnlyCookie } from '../util'
import type { CyCookie } from '../util'

const debugCookies = debugModule('cypress:server:browsers:bidi_automation:cookies')

export type BidiCyCookie = Omit<CyCookie, 'sameSite'> & {
  sameSite: 'no_restriction' | 'lax' | 'strict' | 'unspecified'
}

// if the filter is not an exact match OR, if looselyMatchCookiePath is enabled, doesn't include the path.
// ex: /foo/bar/baz path should include cookies for /foo/bar/baz, /foo/bar, /foo, and /
// this is shipped in remoteTypes within webdriver but it isn't exported, so we need to redefine the type
export interface StoragePartialCookie extends Record<string, unknown> {
  name: string
  value: {
    type: 'string'
    value: string
  }
  domain: string
  path: string
  httpOnly: boolean
  hostOnly?: boolean
  secure: boolean
  sameSite: NetworkSameSite | 'default'
  expiry?: number
}

function convertSameSiteBiDiToExtension (str: NetworkSameSite | 'default') {
  if (str === 'none') {
    return 'no_restriction'
  }

  if (str === 'default') {
    // put firefox version check here, under 140 we need to return 'no_restriction'
    return 'unspecified'
  }

  return str
}

export function convertSameSiteExtensionToBiDi (str: BidiCyCookie['sameSite'], majorFirefoxVersion?: number) {
  if (str === 'no_restriction') {
    return 'none'
  }

  if (str === 'unspecified') {
    // put firefox version check here, under 140 we need to return 'no_restriction'
    return 'default'
  }

  // @see https://www.w3.org/TR/webdriver-bidi/#type-network-Cookie
  // in Firefox 140, BiDi added the 'default' value to be able to assign 'unspecified', which was also added in Firefox 140.
  const defaultValue = majorFirefoxVersion && majorFirefoxVersion < 140 ? 'none' : 'default'

  // if no value, default to 'none' as this is the browser default in firefox specifically.
  // Every other browser defaults to 'lax'
  return str === undefined ? defaultValue : str
}

// used to normalize cookies to CyCookie before returning them through the automation client
export const convertBiDiCookieToCyCookie = (cookie: NetworkCookie): BidiCyCookie => {
  const cyCookie: BidiCyCookie = {
    name: cookie.name,
    value: cookie.value.value,
    domain: cookie.domain,
    path: cookie.path,
    httpOnly: cookie.httpOnly,
    hostOnly: !!isHostOnlyCookie(cookie),
    expirationDate: cookie.expiry ?? undefined,
    secure: cookie.secure,
    sameSite: convertSameSiteBiDiToExtension(cookie.sameSite),
  }

  debugCookies(`parsed BiDi cookie %o to cy cookie %o`, cookie, cyCookie)

  return cyCookie
}

export const convertCyCookieToBiDiCookie = (cookie: BidiCyCookie, majorFirefoxVersion?: number): StoragePartialCookie => {
  const cookieToSet: StoragePartialCookie = {
    name: cookie.name,
    value: {
      type: 'string',
      value: cookie.value,
    },
    domain: cookie.domain,
    path: cookie.path,
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: convertSameSiteExtensionToBiDi(cookie.sameSite, majorFirefoxVersion),
    // BiDi cookie expiry is in seconds from EPOCH, but sometimes the automation client feeds in a float and BiDi does not know how to handle it.
    // If trying to set a float on the expiry time in BiDi, the setting silently fails.
    expiry: (cookie.expirationDate === -Infinity ? 0 : (isNumber(cookie.expirationDate) ? toInteger(cookie.expirationDate) : null)) ?? undefined,
  }

  if (!cookie.hostOnly && isHostOnlyCookie(cookie)) {
    cookieToSet.domain = `.${cookie.domain}`
  }

  if (cookie.hostOnly && !isHostOnlyCookie(cookie)) {
    cookieToSet.hostOnly = false
  }

  debugCookies(`parsed cy cookie %o to BiDi cookie %o`, cookie, cookieToSet)

  return cookieToSet
}
