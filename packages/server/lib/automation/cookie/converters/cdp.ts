/// <reference types='chrome'/>

import _ from 'lodash'
import type { Protocol } from 'devtools-protocol'
import { isHostOnlyCookie, sameSiteExtensionToProtocolMap } from '../util'
import type { CyCookie } from '../util'

function convertSameSiteExtensionToCdp (str: CyCookie['sameSite']): Protocol.Network.CookieSameSite | undefined {
  return str ? sameSiteExtensionToProtocolMap[str] : undefined
}

function convertSameSiteCdpToExtension (str: Protocol.Network.CookieSameSite | undefined): CyCookie['sameSite'] {
  if (_.isUndefined(str)) {
    return str
  }

  if (str === 'None') {
    return 'no_restriction'
  }

  return str.toLowerCase() as CyCookie['sameSite']
}

const convertCdpCookieToCyCookie = (cookie: Protocol.Network.Cookie): CyCookie => {
  const cyCookie: CyCookie = {
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    sameSite: convertSameSiteCdpToExtension(cookie.sameSite),
    // CDP signals a session cookie with a -1 expiry
    expirationDate: cookie.expires === -1 ? undefined : cookie.expires,
  }

  if (isHostOnlyCookie(cookie)) {
    cyCookie.hostOnly = true
  }

  return cyCookie
}

export const convertCdpCookiesToCyCookies = (cookies: Protocol.Network.Cookie[]) => {
  return _.map(cookies, convertCdpCookieToCyCookie)
}

export const convertCyCookieToCdpCookie = (cookie: CyCookie): Protocol.Network.SetCookieRequest => {
  // this logic forms a SetCookie request that will be received by Chrome
  // see MakeCookieFromProtocolValues for information on how this cookie data will be parsed
  // @see https://cs.chromium.org/chromium/src/content/browser/devtools/protocol/network_handler.cc?l=246&rcl=786a9194459684dc7a6fded9cabfc0c9b9b37174

  const setCookieRequest: Protocol.Network.SetCookieRequest = _({
    domain: cookie.domain,
    path: cookie.path,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    sameSite: convertSameSiteExtensionToCdp(cookie.sameSite),
    expires: cookie.expirationDate,
  })
  // Network.setCookie will error on any undefined/null parameters
  .omitBy(_.isNull)
  .omitBy(_.isUndefined)
  // set name and value at the end to get the correct typing
  .extend({
    name: cookie.name || '',
    value: cookie.value || '',
  })
  .value()

  // without this logic, a cookie being set on 'foo.com' will only be set for 'foo.com', not other subdomains
  if (!cookie.hostOnly && isHostOnlyCookie(cookie)) {
    setCookieRequest.domain = `.${cookie.domain}`
  }

  if (setCookieRequest.name.startsWith('__Host-')) {
    setCookieRequest.url = `https://${cookie.domain}`
    delete setCookieRequest.domain
  }

  return setCookieRequest
}
