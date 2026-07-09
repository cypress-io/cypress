/// <reference types='chrome'/>

import _ from 'lodash'
import type { Protocol } from 'devtools-protocol'
import { isHostOnlyCookie } from '../util'
import type { CyCookie } from '../util'

function convertSameSiteExtensionToCdp (str: CyCookie['sameSite']): Protocol.Network.CookieSameSite | undefined {
  return str ? ({
    'no_restriction': 'None',
    'lax': 'Lax',
    'strict': 'Strict',
  })[str] as Protocol.Network.CookieSameSite : str as undefined
}

function convertSameSiteCdpToExtension (str: Protocol.Network.CookieSameSite): chrome.cookies.SameSiteStatus {
  if (_.isUndefined(str)) {
    return str
  }

  if (str === 'None') {
    return 'no_restriction'
  }

  return str.toLowerCase() as chrome.cookies.SameSiteStatus
}

const normalizeGetCookieProps = (cookie: Protocol.Network.Cookie): CyCookie => {
  if (cookie.expires === -1) {
    // @ts-ignore
    delete cookie.expires
  }

  if (isHostOnlyCookie(cookie)) {
    // @ts-ignore
    cookie.hostOnly = true
  }

  // @ts-ignore
  cookie.sameSite = convertSameSiteCdpToExtension(cookie.sameSite)

  // @ts-ignore
  cookie.expirationDate = cookie.expires
  // @ts-ignore
  delete cookie.expires

  // @ts-ignore
  return cookie
}

export const normalizeGetCookies = (cookies: Protocol.Network.Cookie[]) => {
  return _.map(cookies, normalizeGetCookieProps)
}

export const normalizeSetCookieProps = (cookie: CyCookie): Protocol.Network.SetCookieRequest => {
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

  if (cookie.hostOnly && !isHostOnlyCookie(cookie)) {
    // @ts-ignore
    delete cookie.hostOnly
  }

  if (setCookieRequest.name.startsWith('__Host-')) {
    setCookieRequest.url = `https://${cookie.domain}`
    delete setCookieRequest.domain
  }

  return setCookieRequest
}
