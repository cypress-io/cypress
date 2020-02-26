import _ from 'lodash'
import Bluebird from 'bluebird'
import cdp from 'devtools-protocol'
import { cors } from '@packages/network'
import debugModule from 'debug'

const debugVerbose = debugModule('cypress-verbose:server:browsers:cdp_automation')

interface CyCookie {
  name: string
  value: string
  expirationDate: number
  hostOnly: boolean
  domain: string
  path: string
  secure: boolean
  httpOnly: boolean
}

// Cypress uses the webextension-style filtering
// https://developer.chrome.com/extensions/cookies#method-getAll
type CyCookieFilter = chrome.cookies.GetAllDetails

type SendDebuggerCommand = (message: string, data?: any) => Bluebird<any>

export const _domainIsWithinSuperdomain = (domain: string, suffix: string) => {
  const suffixParts = suffix.split('.').filter(_.identity)
  const domainParts = domain.split('.').filter(_.identity)

  return _.isEqual(suffixParts, domainParts.slice(domainParts.length - suffixParts.length))
}

export const _cookieMatches = (cookie: CyCookie, filter: CyCookieFilter) => {
  if (filter.domain && !(cookie.domain && _domainIsWithinSuperdomain(cookie.domain, filter.domain))) {
    return false
  }

  if (filter.path && filter.path !== cookie.path) {
    return false
  }

  if (filter.name && filter.name !== cookie.name) {
    return false
  }

  return true
}

export const CdpAutomation = (sendDebuggerCommandFn: SendDebuggerCommand) => {
  const normalizeGetCookieProps = (cookie: cdp.Network.Cookie): CyCookie => {
    if (cookie.expires === -1) {
      delete cookie.expires
    }

    // @ts-ignore
    cookie.expirationDate = cookie.expires
    delete cookie.expires

    // @ts-ignore
    return cookie
  }

  const normalizeGetCookies = (cookies: cdp.Network.Cookie[]) => {
    return _.map(cookies, normalizeGetCookieProps)
  }

  const normalizeSetCookieProps = (cookie: CyCookie): cdp.Network.SetCookieRequest => {
    // this logic forms a SetCookie request that will be received by Chrome
    // see MakeCookieFromProtocolValues for information on how this cookie data will be parsed
    // @see https://cs.chromium.org/chromium/src/content/browser/devtools/protocol/network_handler.cc?l=246&rcl=786a9194459684dc7a6fded9cabfc0c9b9b37174

    _.defaults(cookie, {
      name: '',
      value: '',
    })

    // @ts-ignore
    cookie.expires = cookie.expirationDate

    // without this logic, a cookie being set on 'foo.com' will only be set for 'foo.com', not other subdomains
    if (!cookie.hostOnly && cookie.domain[0] !== '.') {
      let parsedDomain = cors.parseDomain(cookie.domain)

      // normally, a non-hostOnly cookie should be prefixed with a .
      // so if it's not a top-level domain (localhost, ...) or IP address
      // prefix it with a . so it becomes a non-hostOnly cookie
      if (parsedDomain && parsedDomain.tld !== cookie.domain) {
        cookie.domain = `.${cookie.domain}`
      }
    }

    // not used by Chrome
    delete cookie.hostOnly
    delete cookie.expirationDate

    return cookie
  }

  const getAllCookies = (filter: CyCookieFilter) => {
    return sendDebuggerCommandFn('Network.getAllCookies')
    .then((result: cdp.Network.GetAllCookiesResponse) => {
      return normalizeGetCookies(result.cookies)
      .filter((cookie: CyCookie) => {
        const matches = _cookieMatches(cookie, filter)

        debugVerbose('cookie matches filter? %o', { matches, cookie, filter })

        return matches
      })
    })
  }

  const getCookiesByUrl = (url): Bluebird<CyCookie[]> => {
    return sendDebuggerCommandFn('Network.getCookies', {
      urls: [url],
    })
    .then((result: cdp.Network.GetCookiesResponse) => {
      return normalizeGetCookies(result.cookies)
    })
  }

  const getCookie = (filter: CyCookieFilter): Bluebird<CyCookie | null> => {
    return getAllCookies(filter)
    .then((cookies) => {
      return _.get(cookies, 0, null)
    })
  }

  const onRequest = (message, data) => {
    let setCookie

    switch (message) {
      case 'get:cookies':
        if (data.url) {
          return getCookiesByUrl(data.url)
        }

        return getAllCookies(data)
      case 'get:cookie':
        return getCookie(data)
      case 'set:cookie':
        setCookie = normalizeSetCookieProps(data)

        return sendDebuggerCommandFn('Network.setCookie', setCookie)
        .then((result: cdp.Network.SetCookieResponse) => {
          if (!result.success) {
            // i wish CDP provided some more detail here, but this is really it in v1.3
            // @see https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-setCookie
            throw new Error(`Network.setCookie failed to set cookie: ${JSON.stringify(setCookie)}`)
          }

          return getCookie(data)
        })
      case 'clear:cookie':
        return getCookie(data)
        // tap, so we can resolve with the value of the removed cookie
        // also, getting the cookie via CDP first will ensure that we send a cookie `domain` to CDP
        // that matches the cookie domain that is really stored
        .tap((cookieToBeCleared) => {
          if (!cookieToBeCleared) {
            return
          }

          return sendDebuggerCommandFn('Network.deleteCookies', _.pick(cookieToBeCleared, 'name', 'domain'))
        })
      case 'is:automation:client:connected':
        return true
      case 'remote:debugger:protocol':
        return sendDebuggerCommandFn(data.command, data.params)
      case 'take:screenshot':
        return sendDebuggerCommandFn('Page.captureScreenshot')
        .catch((err) => {
          throw new Error(`The browser responded with an error when Cypress attempted to take a screenshot.\n\nDetails:\n${err.message}`)
        })
        .then(({ data }) => {
          return `data:image/png;base64,${data}`
        })
      default:
        throw new Error(`No automation handler registered for: '${message}'`)
    }
  }

  return { onRequest }
}
