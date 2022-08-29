import type { AutomationCookie } from '@packages/server/lib/automation/cookies'
import type { Cookie } from '@packages/server/lib/util/cookies'
import type $Cypress from '../../cypress'

interface CookieLike {
  name: string
  value: string
}

const parseCookieString = (cookieString: string) => {
  if (!cookieString || !cookieString.trim().length) return []

  return cookieString.split(';').map((cookieString) => {
    const [name, value] = cookieString.split('=')

    return {
      name: name.trim(),
      value: value.trim(),
    }
  })
}

const stringifyCookies = (cookies: CookieLike[]) => {
  return cookies
  .map((cookie) => `${cookie.name}=${cookie.value}`)
  .join('; ')
}

const mergeCookies = (documentCookieValue: string, newCookies: AutomationCookie[]) => {
  // QUESTION: need to only do it for appropriate domain?
  // TODO: do this on cy.setCookie, etc and get rid of polling?
  const existingCookies = parseCookieString(documentCookieValue)
  const newCookieNameIndex = newCookies.reduce((nameIndex, cookie) => {
    nameIndex[cookie.name] = cookie.value

    return nameIndex
  }, {} as { [key: string]: string })
  const filteredExistingCookies = existingCookies.filter((cookie) => {
    return !newCookieNameIndex[cookie.name]
  })

  return stringifyCookies(filteredExistingCookies.concat(newCookies))
}

// TODO: how to handle fact that document.cookie is only patched if cy.origin is used?

export interface DocumentCookiePatch {
  patch: (window: Window) => void
  updateCookies: (cookies: AutomationCookie[]) => void
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
export const createDocumentCookiePatch = (Cypress: Cypress.Cypress, cookies: AutomationCookie[] = []): DocumentCookiePatch => {
  console.log(location.origin, '🟠 create patch:', cookies.map((c) => `${c.name}=${c.value}`))

  let documentCookieValue = mergeCookies(document.cookie, cookies)

  const patch = (window: Window) => {
    console.log(location.origin, '🟠 patch it:', documentCookieValue)

    // Cookies added to the server-side cookie jar are optimistically
    // added here so that if a cross-origin request sets cookies, they're
    // available via document.cookie synchronously on page load
    const setAutomationCookie = (toughCookie: Cookie) => {
      const { superDomain } = Cypress.Location.create(window.location.href)
      const automationCookie = Cypress.Cookies.toughCookieToAutomationCookie(toughCookie, superDomain)

      Cypress.automation('set:cookie', automationCookie)
      .catch(() => {
      // unlikely there will be errors, but ignore them in any case, since
      // they're not user-actionable
      })
    }

    Object.defineProperty(window.document, 'cookie', {
      get () {
        console.log('🟠 read document.cookie')

        return documentCookieValue
      },

      set (newValue: string) {
        const cookie = Cypress.Cookies.parse(newValue)

        // If cookie is undefined, it was invalid and couldn't be parsed
        if (!cookie) return documentCookieValue

        const cookieString = `${cookie.key}=${cookie.value}`

        // New cookies get prepended to existing cookies
        documentCookieValue = documentCookieValue.length
          ? `${cookieString}; ${documentCookieValue}`
          : cookieString

        setAutomationCookie(cookie)

        return documentCookieValue
      },
    })

    // The interval value is arbitrary; it shouldn't be too often, but needs to
    // be fairly frequent so that the local value is kept as up-to-date as
    // possible. It's possible there could be a race condition where
    // document.cookie returns an out-of-date value, but there's not really a
    // way around that since it's a synchronous API and we can only get the
    // browser's true cookie values asynchronously.
    const intervalId = setInterval(async () => {
      const { superDomain: domain } = Cypress.Location.create(window.location.href)

      try {
        const cookies = (await Cypress.automation('get:cookies', { domain })) as AutomationCookie[]
        const cookiesString = (cookies || []).map((c) => `${c.name}=${c.value}`).join('; ')

        documentCookieValue = cookiesString
      } catch (err) {
      // unlikely there will be errors, but ignore them in any case, since
      // they're not user-actionable
      }
    }, 250)

    const onUnload = () => {
      window.removeEventListener('unload', onUnload)
      clearInterval(intervalId)
    }

    window.addEventListener('unload', onUnload)
  }

  const updateCookies = (cookies: AutomationCookie[]) => {
    documentCookieValue = mergeCookies(documentCookieValue, cookies)
  }

  return {
    patch,
    updateCookies,
  }
}
