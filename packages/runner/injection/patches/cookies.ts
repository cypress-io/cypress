import { AutomationCookie } from '@packages/server/lib/automation/cookies'
import {
  CookieJar,
  toughCookieToAutomationCookie,
  automationCookieToToughCookie,
} from '@packages/server/lib/util/cookies'
import { Cookie as ToughCookie } from 'tough-cookie'

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
//
// The general strategy is:
// - Keep the document.cookie value (`documentCookieValue`) available so
//   the document.cookie getter can synchronously return it.
// - Optimistically update that value when document.cookie is set, so that
//   subsequent synchronous calls to get the value will work.
// - On an interval, get the browser's cookies for the given domain, so that
//   updates to the cookie jar (via http requests, cy.setCookie, etc) are
//   reflected in the document.cookie value.
export const patchDocumentCookie = (originalCookies: AutomationCookie[]) => {
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

  addCookies(existingCookies.concat(originalCookies))

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
    Cypress.specBridgeCommunicator.on('cross:origin:cookies', addCookies)

    Cypress.on('test:before:run', reset)

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
