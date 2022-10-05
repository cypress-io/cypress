const parseCookieString = (cookieString) => {
  if (!cookieString || !cookieString.trim().length) return []

  return cookieString.split(';').map((cookieString) => {
    const [name, value] = cookieString.split('=')

    return {
      name: name.trim(),
      value: value.trim(),
    }
  })
}

const stringifyCookies = (cookies) => {
  return cookies
  .map((cookie) => `${cookie.name}=${cookie.value}`)
  .join('; ')
}

const mergeCookies = (documentCookieValue, newCookies = []) => {
  const existingCookies = parseCookieString(documentCookieValue)
  const newCookieNameIndex = newCookies.reduce((nameIndex, cookie) => {
    nameIndex[cookie.name] = cookie.value

    return nameIndex
  }, {})
  const filteredExistingCookies = existingCookies.filter((cookie) => {
    return !newCookieNameIndex[cookie.name]
  })

  return stringifyCookies(filteredExistingCookies.concat(newCookies))
}

const clearCookie = (documentCookieValue, name) => {
  const cookies = parseCookieString(documentCookieValue)

  const filteredCookies = cookies.filter((cookie) => {
    return cookie.name !== name
  })

  return stringifyCookies(filteredCookies)
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
export const handleDocumentCookie = (Cypress) => {
  // if cookies were sent before the spec bridge was created, they'll come
  // through as state('crossOriginCookies'), so use them then reset them
  const cookies = Cypress.state('crossOriginCookies')
  let documentCookieValue = mergeCookies(document.cookie, cookies)

  Cypress.state('crossOriginCookies', [])

  const patch = (window) => {
  }

  const updateCookies = (cookies) => {
    documentCookieValue = mergeCookies(documentCookieValue, cookies)
  }

  const reset = () => {
    documentCookieValue = ''
  }

  // TODO: figure out how to do the rest of this with patch in injection
  Cypress.specBridgeCommunicator.on('cross:origin:cookies', (cookies) => {
    updateCookies(cookies)

    Cypress.state('crossOriginCookies', cookies)

    Cypress.specBridgeCommunicator.toPrimary('cross:origin:cookies:received')
  })

  Cypress.on('test:before:run', () => {
    reset()
  })

  Cypress.on('set:cookie', (cookie) => {
    updateCookies([cookie])
  })

  Cypress.on('clear:cookie', (name) => {
    documentCookieValue = clearCookie(documentCookieValue, name)
  })

  Cypress.on('clear:cookies', () => {
    reset()
  })
}
