import {
  CookieJar,
  automationCookieToToughCookie,
} from '@packages/server/lib/automation/cookie/jar'
import { isBlockedByExisting, meetsDocumentCookieRules, parseDocumentCookie } from '@packages/server/lib/automation/cookie/document-cookie-rules'
import { isLocalhost } from '@packages/network-tools/lib/uri'
import type { Cookie as ToughCookie,
  SerializableAutomationCookie,
} from '@packages/server/lib/automation/cookie/jar'

function isHostOnlyCookie (domain) {
  return domain[0] !== '.'
}

const parseDocumentCookieString = (documentCookieString: string): SerializableAutomationCookie[] => {
  if (!documentCookieString || !documentCookieString.trim().length) return []

  return documentCookieString.split(';').map((cookieString) => {
    const [name, value] = cookieString.split('=')

    const cookieDomain = location.hostname

    return {
      name: name.trim(),
      value: value.trim(),
      domain: cookieDomain,
      expiry: null,
      httpOnly: false,
      hostOnly: isHostOnlyCookie(cookieDomain),
      maxAge: null,
      path: null,
      sameSite: 'lax',
      secure: false,
    }
  })
}

const sendCookieToServer = (cookieString: string) => {
  window.top!.postMessage({
    event: 'cross:origin:aut:set:cookie',
    data: {
      cookieString,
      url: location.href,
    },
  }, '*')
}

// document.cookie monkey-patching
// -------------------------------
// We monkey-patch document.cookie when in a cross-origin injection, because
// document.cookie runs into cross-origin restrictions when the AUT is on
// a different origin than top. The goal is to make it act like it would
// if the user's app was run in top.
export const patchDocumentCookie = (requestCookies: SerializableAutomationCookie[]) => {
  const url = location.href
  const domain = location.hostname
  const cookieJar = new CookieJar()
  // browsers treat localhost as a secure context, so it may set Secure cookies over http
  const isSecure = location.protocol === 'https:' || isLocalhost(new URL(url))
  const existingCookies = parseDocumentCookieString(document.cookie)

  const getDocumentCookieValue = () => {
    return cookieJar.getCookies(url, undefined, { http: false, secure: isSecure }).map((cookie: ToughCookie) => {
      return cookie.key ? `${cookie.key}=${cookie.value}` : cookie.value
    }).join('; ')
  }

  const addCookies = (cookies: SerializableAutomationCookie[]) => {
    cookies.forEach((cookie) => {
      cookieJar.setCookie(automationCookieToToughCookie(cookie, domain), url, undefined)
    })
  }

  const setCookie = (cookie: ToughCookie | string, { http = false } = {}) => {
    try {
      return cookieJar.setCookie(cookie, url, undefined, { http })
    } catch (err) {
      // it's possible setting the cookie fails because the domain does not
      // match, or because it is or would replace an HttpOnly cookie. this is
      // expected and okay to do nothing, since it wouldn't be set in the
      // browser anyway
      return
    }
  }

  // requestCookies are ones included with the page request that's now being
  // injected into. they're captured by the proxy and included statically in
  // the injection so they can be added here and available before page load
  addCookies(existingCookies.concat(requestCookies))

  Object.defineProperty(window.document, 'cookie', {
    get () {
      return getDocumentCookieValue()
    },

    set (newValue: any) {
      const stringValue = `${newValue}`
      const cookie = parseDocumentCookie(stringValue, location.pathname)

      // the server drops writes that break these rules, so keep them out of document.cookie too
      if (!cookie || !meetsDocumentCookieRules(cookie, isSecure)) return getDocumentCookieValue()

      const stored = { name: cookie.key, domain: cookie.domain || domain, path: cookie.path || '/' }
      const isBlocked = cookieJar.getAllCookies().some((existing) => {
        return isBlockedByExisting({ ...existing, name: existing.key, domain: existing.domain || domain }, stored, isSecure)
      })

      if (isBlocked || !setCookie(cookie)) return getDocumentCookieValue()

      // an expired cookie removes the one it replaces, here and in the browser
      if (cookie.expiryTime() < Date.now()) {
        cookieJar.removeCookie(stored)
      }

      // send the cookie to the server so it can be set in the browser via
      // automation and in our server-side cookie jar so it's available
      // to subsequent injections
      sendCookieToServer(stringValue)

      return getDocumentCookieValue()
    },
  })

  const reset = () => {
    cookieJar.removeAllCookies()
  }

  const bindCypressListeners = (Cypress: Cypress.Cypress) => {
    Cypress.on('test:before:run', reset)

    // the following listeners are called from Cypress cookie commands, so that
    // the document.cookie value is updated optimistically
    Cypress.on('set:cookie', (cookie: SerializableAutomationCookie) => {
      setCookie(automationCookieToToughCookie(cookie, domain), { http: true })
    })

    Cypress.on('clear:cookie', (name: string) => {
      cookieJar.removeCookie({ name, domain })
    })

    Cypress.on('clear:cookies', reset)
  }

  return {
    onCypress: bindCypressListeners,
  }
}
