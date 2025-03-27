import {
  CookieJar,
  toughCookieToAutomationCookie,
  automationCookieToToughCookie,
  SerializableAutomationCookie,
} from '@packages/server/lib/util/cookies'
import type { Cookie as ToughCookie } from 'tough-cookie'

function isHostOnlyCookie (domain) {
  return domain[0] !== '.'
}

const parseDocumentCookieString = (documentCookieString: string): SerializableAutomationCookie[] => {
  if (!documentCookieString || !documentCookieString.trim().length) return []

  return documentCookieString.split(';').map((cookieString) => {
    const [name, value] = cookieString.split('=')

    let cookieDomain = location.hostname

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

const sendCookieToServer = (cookie: SerializableAutomationCookie) => {
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
export const patchDocumentCookie = (requestCookies: SerializableAutomationCookie[]) => {
  const url = location.href
  const domain = location.hostname
  const cookieJar = new CookieJar()
  const existingCookies = parseDocumentCookieString(document.cookie)

  const getDocumentCookieValue = () => {
    return cookieJar.getCookies(url, undefined).map((cookie: ToughCookie) => {
      return `${cookie.key}=${cookie.value}`
    }).join('; ')
  }

  const addCookies = (cookies: SerializableAutomationCookie[]) => {
    cookies.forEach((cookie) => {
      cookieJar.setCookie(automationCookieToToughCookie(cookie, domain), url, undefined)
    })
  }

  const setCookie = (cookie: ToughCookie | string) => {
    try {
      return cookieJar.setCookie(cookie, url, undefined)
    } catch (err) {
      // it's possible setting the cookie fails because the domain does not
      // match. this is expected and okay to do nothing, since it wouldn't be
      // set in the browser anyway
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
      const parsedCookie = CookieJar.parse(stringValue)

      if (parsedCookie?.hostOnly === null) {
        // we want to make sure the hostOnly property is respected when syncing with CDP/extension to prevent duplicates.
        // in the case it is not set, we need to calculate it
        parsedCookie.hostOnly = isHostOnlyCookie(parsedCookie.domain || domain)
      }

      // if result is undefined, it was invalid and couldn't be parsed
      if (!parsedCookie) return getDocumentCookieValue()

      // if the cookie is expired, remove it in our cookie jar
      // and via setting it inside our automation client with the correct expiry.
      // This will have the effect of removing the cookie
      if (parsedCookie.expiryTime() < Date.now()) {
        cookieJar.removeCookie({
          name: parsedCookie.key,
          path: parsedCookie.path || '/',
          domain: parsedCookie.domain as string,
        })

        // send the cookie to the server so it can be removed from the browser
        // via automation. If the cookie expiry is set inside the server-side cookie jar,
        // the cookie will be automatically removed.
        sendCookieToServer(toughCookieToAutomationCookie(parsedCookie, domain))

        return getDocumentCookieValue()
      }

      // we should be able to pass in parsedCookie here instead of the string
      // value, but tough-cookie doesn't recognize it using an instanceof
      // check and throws an error. because we can't, we have to massage
      // some of the properties below to be correct
      const cookie = setCookie(stringValue)

      if (cookie) {
        cookie.sameSite = parsedCookie.sameSite

        if (!parsedCookie.path) {
          cookie.path = '/'
        }

        // send the cookie to the server so it can be set in the browser via
        // automation and in our server-side cookie jar so it's available
        // to subsequent injections
        sendCookieToServer(toughCookieToAutomationCookie(cookie, domain))
      }

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
      setCookie(automationCookieToToughCookie(cookie, domain))
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
