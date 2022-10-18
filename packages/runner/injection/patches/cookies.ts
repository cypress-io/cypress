import {
  CookieJar,
  toughCookieToAutomationCookie,
  automationCookieToToughCookie,
} from '@packages/server/lib/util/cookies'
import { Cookie as ToughCookie } from 'tough-cookie'
import type { AutomationCookie } from '@packages/server/lib/automation/cookies'

const parseDocumentCookieString = (documentCookieString: string): AutomationCookie[] => {
  if (!documentCookieString || !documentCookieString.trim().length) return []

  return documentCookieString.split(';').map((cookieString) => {
    const [name, value] = cookieString.split('=')

    return {
      name: name.trim(),
      value: value.trim(),
      domain: location.hostname,
      expiry: null,
      httpOnly: false,
      maxAge: null,
      path: null,
      sameSite: 'lax',
      secure: false,
    }
  })
}

const sendCookieToServer = (cookie: AutomationCookie) => {
  window.top!.postMessage({
    event: 'cross:origin:aut:set:cookie',
    data: {
      cookie,
      url: location.href,
      // url will always match the cookie domain, so strict context tells
      // tough-cookie to allow it to be set
      sameSiteContext: 'strict',
    },
  }, '*')
}

// document.cookie monkey-patching
// -------------------------------
// We monkey-patch document.cookie when in a cross-origin injection, because
// document.cookie runs into cross-origin restrictions when the AUT is on
// a different origin than top. The goal is to make it act like it would
// if the user's app was run in top.
export const patchDocumentCookie = (requestCookies: AutomationCookie[]) => {
  const url = location.href
  const domain = location.hostname
  const cookieJar = new CookieJar()
  const existingCookies = parseDocumentCookieString(document.cookie)

  const getDocumentCookieValue = () => {
    return cookieJar.getCookies(url, undefined).map((cookie: ToughCookie) => {
      return `${cookie.key}=${cookie.value}`
    }).join('; ')
  }

  const addCookies = (cookies: AutomationCookie[]) => {
    cookies.forEach((cookie) => {
      cookieJar.setCookie(automationCookieToToughCookie(cookie, domain), url, undefined)
    })
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
      const parsedCookie = CookieJar.parse(stringValue)

      // if result is undefined, it was invalid and couldn't be parsed
      if (!parsedCookie) return getDocumentCookieValue()

      // we should be able to pass in parsedCookie here instead of the string
      // value, but tough-cookie doesn't recognize it using an instanceof
      // check and throws an error. because we can't, we have to massage
      // some of the properties below to be correct
      const cookie = cookieJar.setCookie(stringValue, url, undefined)!

      cookie.sameSite = parsedCookie.sameSite

      if (!parsedCookie.path) {
        cookie.path = '/'
      }

      // send the cookie to the server so it can be set in the browser via
      // automation and in our server-side cookie jar so it's available
      // to subsequent injections
      sendCookieToServer(toughCookieToAutomationCookie(cookie, domain))

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
    Cypress.on('set:cookie', (cookie: AutomationCookie) => {
      cookieJar.setCookie(automationCookieToToughCookie(cookie, domain), url, undefined)
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
