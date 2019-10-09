import _ from 'lodash'
import cdp from 'devtools-protocol'
import tough from 'tough-cookie'

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

const cors = require('../util/cors')

export function CdpAutomation (opts : {
  invokeViaDebugger: (message: string, data?: any) => Promise<any>
  takeScreenshot: () => Promise<string>
}) {
  const { invokeViaDebugger, takeScreenshot } = opts

  const normalizeGetCookieProps = function (cookie: cdp.Network.Cookie): CyCookie {
    if (cookie.expires === -1) {
      delete cookie.expires
    }

    // @ts-ignore
    cookie.expirationDate = cookie.expires
    delete cookie.expires

    // @ts-ignore
    return cookie
  }

  const normalizeGetCookies = function (cookies: cdp.Network.Cookie[]) {
    return _.map(cookies, normalizeGetCookieProps)
  }

  const normalizeSetCookieProps = function (cookie: CyCookie): cdp.Network.SetCookieRequest {
    cookie.name || (cookie.name = '') // name can't be undefined/null
    cookie.value || (cookie.value = '') // ditto
    // @ts-ignore
    cookie.expires = cookie.expirationDate
    if (!cookie.hostOnly && cookie.domain[0] !== '.') {
      let parsedDomain = cors.parseDomain(cookie.domain)

      // not a top-level domain (localhost, ...) or IP address
      if (parsedDomain && parsedDomain.tld !== cookie.domain) {
        cookie.domain = `.${cookie.domain}`
      }
    }

    delete cookie.hostOnly
    delete cookie.expirationDate

    return cookie
  }

  const getAllCookies = function (data) {
    return invokeViaDebugger('Network.getAllCookies').then(function (result: cdp.Network.GetAllCookiesResponse) {
      return normalizeGetCookies(result.cookies).filter(function (cookie: CyCookie) {
        return _.every([
          !data.domain || tough.domainMatch(cookie.domain, data.domain),
          !data.path || tough.pathMatch(cookie.path, data.path),
          !data.name || data.name === cookie.name,
        ])
      })
    })
  }

  const getCookiesByUrl = function (url) {
    return invokeViaDebugger('Network.getCookies', {
      urls: [url],
    }).then(function (result: cdp.Network.GetCookiesResponse) {
      return normalizeGetCookies(result.cookies)
    })
  }

  const getCookie = function (data): Promise<cdp.Network.Cookie> {
    return getAllCookies(data).then(_.partialRight(_.get, 0, null))
  }

  const onRequest = function (message, data) {
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

        return invokeViaDebugger('Network.setCookie', setCookie).then(function (result: cdp.Network.SetCookieResponse) {
          if (!result.success) {
            // i wish CDP provided some more detail here, but this is really it in v1.3
            // @see https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-setCookie
            throw new Error('Failed to set cookie via Network.setCookie.')
          }

          return getCookie(data)
        })
      case 'clear:cookie':
        return getCookie(data).then(function (cookieToBeCleared) { // so we can resolve with the value of the removed cookie
          return invokeViaDebugger('Network.deleteCookies', data).then(function () {
            return cookieToBeCleared
          })
        })
      case 'is:automation:client:connected':
        return true
      case 'take:screenshot':
        return takeScreenshot()
      default:
        throw new Error(`No automation handler registered for: '${message}'`)
    }
  }

  return { onRequest }
}
