import { Cookie } from 'tough-cookie'

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
export const patchDocumentCookie = (win) => {
  const getCookiesFromCypress = () => {
    return new Promise((resolve, reject) => {
      const handler = (event) => {
        if (event.data.event === 'cross:origin:aut:get:cookie') {
          window.removeEventListener('message', handler)
          resolve(event.data.cookies)
        }
      }

      setTimeout(() => {
        window.removeEventListener('message', handler)
        reject()
      }, 1000)

      window.addEventListener('message', handler)

      window.top.postMessage({ event: 'cross:origin:aut:get:cookie', data: { href: window.location.href } }, '*')
    })
  }

  // The interval value is arbitrary; it shouldn't be too often, but needs to
  // be fairly frequent so that the local value is kept as up-to-date as
  // possible. It's possible there could be a race condition where
  // document.cookie returns an out-of-date value, but there's not really a
  // way around that since it's a synchronous API and we can only get the
  // browser's true cookie values asynchronously.
  const syncCookieValues = () => {
    return setInterval(async () => {
      try {
        // If Cypress is defined on the window, that means we have a spec bridge and we should use that to set cookies. If not we have to delegate to the primary cypress instance.
        const cookies = window.Cypress ? await window.Cypress.automation('get:cookies', { domain: window.Cypress.Location.create(win.location.href).domain }) : await getCookiesFromCypress()

        const cookiesString = (cookies || []).map((c) => `${c.name}=${c.value}`).join('; ')

        documentCookieValue = cookiesString
      } catch (err) {
      // unlikely there will be errors, but ignore them in any case, since
      // they're not user-actionable
      }
    }, 250)
  }

  let cookieSyncIntervalId = syncCookieValues()
  const setAutomationCookie = (cookie) => {
    // If Cypress is defined on the window, that means we have a spec bridge and we should use that to set cookies. If not we have to delegate to the primary cypress instance.
    if (window.Cypress) {
      const { superDomain } = window.Cypress.Location.create(win.location.href)
      const automationCookie = window.Cypress.Cookies.toughCookieToAutomationCookie(window.Cypress.Cookies.parse(cookie), superDomain)

      window.Cypress.automation('set:cookie', automationCookie)
      .then(() => {
        // Resume syncing once we've gotten confirmation that cookies have been set.
        cookieSyncIntervalId = syncCookieValues()
      })
      .catch(() => {
      // unlikely there will be errors, but ignore them in any case, since
      // they're not user-actionable
      })
    } else {
      const handler = (event) => {
        if (event.data.event === 'cross:origin:aut:set:cookie') {
          window.removeEventListener('message', handler)
          // Resume syncing once we've gotten confirmation that cookies have been set.
          cookieSyncIntervalId = syncCookieValues()
        }
      }

      window.addEventListener('message', handler)

      window.top.postMessage({ event: 'cross:origin:aut:set:cookie', data: { cookie, href: window.location.href } }, '*')
    }
  }
  let documentCookieValue = ''

  Object.defineProperty(win.document, 'cookie', {
    get () {
      return documentCookieValue
    },

    set (newValue) {
      const cookie = Cookie.parse(newValue)

      // If cookie is undefined, it was invalid and couldn't be parsed
      if (!cookie) return documentCookieValue

      const cookieString = `${cookie.key}=${cookie.value}`

      clearInterval(cookieSyncIntervalId)

      // New cookies get prepended to existing cookies
      documentCookieValue = documentCookieValue.length
        ? `${cookieString}; ${documentCookieValue}`
        : cookieString

      setAutomationCookie(newValue)

      return documentCookieValue
    },
  })

  const onUnload = () => {
    win.removeEventListener('unload', onUnload)
    clearInterval(cookieSyncIntervalId)
  }

  win.addEventListener('unload', onUnload)
}
