/* global document */

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
export const patchDocumentCookie = (Cypress) => {
  const setAutomationCookie = (toughCookie) => {
    const { superDomain } = Cypress.Location.create(window.location.href)
    const automationCookie = Cypress.Cookies.toughCookieToAutomationCookie(toughCookie, superDomain)

    Cypress.automation('set:cookie', automationCookie)
    .catch(() => {
      // unlikely there will be errors, but ignore them in any case, since
      // they're not user-actionable
    })
  }

  let documentCookieValue = ''

  Object.defineProperty(document, 'cookie', {
    get () {
      return documentCookieValue
    },

    set (newValue) {
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
      const cookies = await Cypress.automation('get:cookies', { domain })
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
