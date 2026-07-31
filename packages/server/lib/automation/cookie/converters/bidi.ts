import debugModule from 'debug'
import toInteger from 'lodash/toInteger'
import isNumber from 'lodash/isNumber'
import type { NetworkCookie, NetworkSameSite } from 'webdriver/build/bidi/localTypes'
import { isHostOnlyCookie } from '../util'
import type { CyCookie, ExtensionSameSiteStatus } from '../util'

const debugCookies = debugModule('cypress:server:browsers:bidi_automation:cookies')

// BiDi reports 'unspecified' where the extension shape uses `undefined`, so this widens
// CyCookie's sameSite back to the full extension vocabulary
export type BidiCyCookie = Omit<CyCookie, 'sameSite'> & {
  sameSite: ExtensionSameSiteStatus
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
    return 'unspecified'
  }

  return str
}

// @see https://www.w3.org/TR/webdriver-bidi/#type-network-Cookie
// BiDi expresses a cookie with no sameSite attribute as 'default'
export function convertSameSiteExtensionToBiDi (str: BidiCyCookie['sameSite']) {
  if (str === 'no_restriction') {
    return 'none'
  }

  if (str === 'unspecified' || str === undefined) {
    return 'default'
  }

  return str
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

export const convertCyCookieToBiDiCookie = (cookie: BidiCyCookie): StoragePartialCookie => {
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
    sameSite: convertSameSiteExtensionToBiDi(cookie.sameSite),
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
