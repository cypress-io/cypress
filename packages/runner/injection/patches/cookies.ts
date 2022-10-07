import { AutomationCookie } from '@packages/server/lib/automation/cookies'
import { Cookie as ToughCookie } from 'tough-cookie'

type PartialCookie = Pick<AutomationCookie, 'name' | 'value'>

const parseDocumentCookieString = (documentCookieString: string) => {
  if (!documentCookieString || !documentCookieString.trim().length) return []

  return documentCookieString.split(';').map((cookieString) => {
    const [name, value] = cookieString.split('=')

    return {
      name: name.trim(),
      value: value.trim(),
    }
  })
}

const stringifyCookies = (cookies: PartialCookie[]) => {
  return cookies
  .map((cookie) => `${cookie.name}=${cookie.value}`)
  .join('; ')
}

const mergeCookies = (documentCookieValue: string, newCookies: PartialCookie[] = []) => {
  const existingCookies = parseDocumentCookieString(documentCookieValue)
  const newCookieNameIndex = newCookies.reduce((nameIndex, cookie) => {
    nameIndex[cookie.name] = cookie.value

    return nameIndex
  }, {} as { [key: string]: string })
  const filteredExistingCookies = existingCookies.filter((cookie) => {
    return !newCookieNameIndex[cookie.name]
  })

  return stringifyCookies(filteredExistingCookies.concat(newCookies))
}

const clearCookie = (documentCookieValue: string, name: string) => {
  const cookies = parseDocumentCookieString(documentCookieValue)

  const filteredCookies = cookies.filter((cookie) => {
    return cookie.name !== name
  })

  return stringifyCookies(filteredCookies)
}

const getCookiesFromCypress = () => {
  return new Promise<AutomationCookie[]>((resolve, reject) => {
    const handler = (event) => {
      if (event.data?.event === 'cross:origin:aut:get:cookie') {
        window.removeEventListener('message', handler)
        resolve(event.data.cookies)
      }
    }

    setTimeout(() => {
      window.removeEventListener('message', handler)
      reject()
    }, 1000)

    window.addEventListener('message', handler)

    window.top!.postMessage({ event: 'cross:origin:aut:get:cookie', data: { href: window.location.href } }, '*')
  })
}

const pollForAutomationCookieValues = (onCookieUpdate: (string) => void) => {
  // The interval value is arbitrary; it shouldn't be too often, but needs to
  // be fairly frequent so that the local value is kept as up-to-date as
  // possible. It's possible there could be a race condition where
  // document.cookie returns an out-of-date value, but there's not really a
  // way around that since it's a synchronous API and we can only get the
  // browser's true cookie values asynchronously.
  return setInterval(async () => {
    try {
      // If Cypress is defined on the win, that means we have a spec bridge and
      // we should use that to set cookies. If not we have to delegate to the
      // primary cypress instance.
      const cookies = window.Cypress
        ? await window.Cypress.automation('get:cookies', {
          domain: window.Cypress.Location.create(window.location.href).domain,
        })
        : await getCookiesFromCypress()

      const cookiesString = (cookies || []).map((c) => `${c.name}=${c.value}`).join('; ')

      onCookieUpdate(cookiesString)
    } catch (err) {
    // unlikely there will be errors, but ignore them in any case, since
    // they're not user-actionable
    }
  }, 250)
}

const setAutomationCookieViaCypress = (cookie: AutomationCookie) => {
  const { Cypress } = window
  const { superDomain } = Cypress.Location.create(window.location.href)
  // @ts-ignore
  const automationCookie = Cypress.Cookies.toughCookieToAutomationCookie(
    // @ts-ignore
    Cypress.Cookies.parse(cookie), superDomain,
  ) as AutomationCookie

  return window.Cypress.automation('set:cookie', automationCookie)
  .catch(() => {
    // unlikely there will be errors, but ignore them in any case, since
    // they're not user-actionable
  })
}

const setAutomationCookieViaPostMessage = (cookie: AutomationCookie) => {
  return new Promise<void>((resolve) => {
    const handler = (event) => {
      if (event.data?.event === 'cross:origin:aut:set:cookie') {
        window.removeEventListener('message', handler)

        resolve()
      }
    }

    window.addEventListener('message', handler)

    window.top!.postMessage({
      event: 'cross:origin:aut:set:cookie',
      data: { cookie, href: window.location.href },
    }, '*')
  })
}

const setAutomationCookie = (cookie) => {
  // If Cypress is defined on the win, that means we have a spec bridge and we
  // should use that to set cookies. If not we have to delegate to the primary
  // Cypress instance.
  if (window.Cypress) {
    return setAutomationCookieViaCypress(cookie)
  }

  return setAutomationCookieViaPostMessage(cookie)
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
  let documentCookieValue = mergeCookies(window.document.cookie, originalCookies)

  const setDocumentCookieValue = (newCookieString: string) => {
    documentCookieValue = newCookieString
  }

  let cookieSyncIntervalId = pollForAutomationCookieValues(setDocumentCookieValue)

  Object.defineProperty(window.document, 'cookie', {
    get () {
      return documentCookieValue
    },

    set (newValue: any) {
      const cookie = ToughCookie.parse(newValue)

      // If cookie is undefined, it was invalid and couldn't be parsed
      if (!cookie) return documentCookieValue

      // Clear the syncing interval until we've successfully set this cookie
      clearInterval(cookieSyncIntervalId)

      documentCookieValue = mergeCookies(documentCookieValue, [{
        name: cookie.key,
        value: cookie.value,
      }])

      setAutomationCookie(newValue)
      .then(() => {
        cookieSyncIntervalId = pollForAutomationCookieValues(setDocumentCookieValue)
      })

      return documentCookieValue
    },
  })

  const onUnload = () => {
    window.removeEventListener('unload', onUnload)
    clearInterval(cookieSyncIntervalId)
  }

  window.addEventListener('unload', onUnload)

  const reset = () => {
    documentCookieValue = ''
  }

  const bindCypressListeners = (Cypress: Cypress.Cypress) => {
    Cypress.specBridgeCommunicator.on('cross:origin:cookies', (cookies: AutomationCookie[]) => {
      documentCookieValue = mergeCookies(documentCookieValue, cookies)

      // TODO: this needs to be wired up in cy.ts
      // Cypress.specBridgeCommunicator.toPrimary('cross:origin:cookies:received')
    })

    Cypress.on('test:before:run', reset)

    Cypress.on('set:cookie', (cookie: AutomationCookie) => {
      documentCookieValue = mergeCookies(documentCookieValue, [cookie])
    })

    Cypress.on('clear:cookie', (name: string) => {
      documentCookieValue = clearCookie(documentCookieValue, name)
    })

    Cypress.on('clear:cookies', reset)
  }

  return {
    onCypress: bindCypressListeners,
  }
}
