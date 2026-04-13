import $ from 'jquery'
import Bluebird from 'bluebird'
import { $Location } from '../../../cypress/location'
import { groupBy } from '@packages/utils'

const getSessionDetailsByDomain = (sessState: Cypress.SessionData) => {
  const cookiesByDomain = groupBy(sessState.cookies || [], (c) => c.domain)
  const cookiesResult: Record<string, any> = {}

  for (const [domain, cookies] of Object.entries(cookiesByDomain)) {
    cookiesResult[domain] = { cookies }
  }

  const result = { ...cookiesResult }

  for (const v of (sessState.localStorage || [])) {
    const hostname = $Location.create(v.origin).hostname

    result[hostname] = { ...result[hostname], localStorage: v }
  }

  for (const v of (sessState.sessionStorage || [])) {
    const hostname = $Location.create(v.origin).hostname

    result[hostname] = { ...result[hostname], sessionStorage: v }
  }

  return result
}

const isSecureContext = (url: string) => url.startsWith('https:')

const getCurrentOriginStorage = () => {
  // localStorage.length property is not always accurate, we must stringify to check for entries
  // for ex) try setting localStorage.key = 'val' and reading localStorage.length, may be 0.
  const _localStorageStr = JSON.stringify(window.localStorage)
  const _localStorage = _localStorageStr.length > 2 && JSON.parse(_localStorageStr)
  const _sessionStorageStr = JSON.stringify(window.sessionStorage)
  const _sessionStorage = _sessionStorageStr.length > 2 && JSON.parse(JSON.stringify(window.sessionStorage))

  const value = {} as any

  if (_localStorage) {
    value.localStorage = _localStorage
  }

  if (_sessionStorage) {
    value.sessionStorage = _sessionStorage
  }

  return value
}

const setPostMessageLocalStorage = async (specWindow, originOptions) => {
  const origins = originOptions.map((v) => v.origin) as string[]

  const iframes: JQuery<HTMLElement>[] = []

  const $iframeContainer = $(`<div style="display:none"></div>`).appendTo($('body', specWindow.document))

  // if we're on an https domain, there is no way for the secure context to access insecure origins from iframes
  // since there is no way for the app to access localStorage on insecure contexts, we don't have to clear any localStorage on http domains.
  if (isSecureContext(specWindow.location.href)) {
    for (let i = origins.length - 1; i >= 0; i--) {
      if (!isSecureContext(origins[i])) {
        origins.splice(i, 1)
      }
    }
  }

  if (!origins.length) return []

  origins.forEach((u) => {
    const $iframe = $(`<iframe src="${`${u}/__cypress/automation/setLocalStorage?${u}`}"></iframe>`)

    $iframe.appendTo($iframeContainer)
    iframes.push($iframe)
  })

  let onPostMessage

  const successOrigins = [] as string[]

  return new Bluebird((resolve) => {
    onPostMessage = (event) => {
      const data = event.data

      if (data.type === 'set:storage:load') {
        if (!event.source) {
          throw new Error('failed to get localStorage')
        }

        const opts = originOptions.find((o) => o.origin === event.origin)!

        event.source.postMessage({ type: 'set:storage:data', data: opts }, '*')
      } else if (data.type === 'set:storage:complete') {
        successOrigins.push(event.origin)
        if (successOrigins.length === origins.length) {
          resolve()
        }
      }
    }

    specWindow.addEventListener('message', onPostMessage)
  })
  // timeout just in case something goes wrong and the iframe never loads in
  .timeout(2000)
  .finally(() => {
    specWindow.removeEventListener('message', onPostMessage)
    $iframeContainer.remove()
  })
  .catch(() => {
    Cypress.log({
      name: 'warning',
      message: `failed to access session localStorage data on origin(s): ${origins.filter((o) => !successOrigins.includes(o)).concat(successOrigins.filter((o) => !origins.includes(o))).join(', ')}`,
    })
  })
}

const getConsoleProps = (session: Cypress.SessionData) => {
  const sessionDetails = getSessionDetailsByDomain(session)

  const groupsByDomain = Object.entries(sessionDetails).map(([domain, val]) => {
    return {
      name: `${domain} data:`,
      expand: true,
      label: false,
      groups: [
        val.cookies && {
          name: `🍪 Cookies - (${val.cookies.length})`,
          expand: true,
          items: val.cookies,
        },
        val.localStorage && {
          name: `📁 Local Storage - (${Object.keys(val.localStorage.value).length})`,
          label: true,
          expand: true,
          items: val.localStorage.value,
        },
        val.sessionStorage && {
          name: `📁 Session Storage - (${Object.keys(val.sessionStorage.value).length})`,
          expand: true,
          label: true,
          items: val.sessionStorage.value,
        },
      ].filter(Boolean),
    }
  })

  const props = {
    id: session.id,
    ...(!groupsByDomain.length && {
      Warning: '⚠️ There are no cookies, local storage nor session storage associated with this session',
    }),
    ...(groupsByDomain.length && {
      Domains: `This session captured data from ${Object.keys(sessionDetails).join(' and ')}.`,
    }),
    groups: groupsByDomain.filter(Boolean),
  }

  return props
}

const getPostMessageLocalStorage = (specWindow, origins): Promise<any[]> => {
  const results = [] as any[]
  const iframes: JQuery<HTMLElement>[] = []
  let onPostMessage
  const successOrigins = [] as string[]

  const $iframeContainer = $(`<div style="display:none"></div>`).appendTo($('body', specWindow.document))

  origins.forEach((u) => {
    const $iframe = $(`<iframe src="${`${u}/__cypress/automation/getLocalStorage`}"></iframe>`)

    $iframe.appendTo($iframeContainer)
    iframes.push($iframe)
  })

  return new Bluebird((resolve) => {
    // when the cross-domain iframe for each domain is loaded
    // we can only communicate through postmessage
    onPostMessage = ((event) => {
      const data = event.data

      if (data.type !== 'localStorage') return

      const value = data.value

      results.push([event.origin, value])

      successOrigins.push(event.origin)
      if (successOrigins.length === origins.length) {
        resolve(results)
      }
    })

    specWindow.addEventListener('message', onPostMessage)
  })
  // timeout just in case something goes wrong and the iframe never loads in
  .timeout(2000)
  .finally(() => {
    specWindow.removeEventListener('message', onPostMessage)
    $iframeContainer.remove()
  })
  .catch((err) => {
    Cypress.log({
      name: 'warning',
      message: `failed to access session localStorage data on origin(s): ${origins.filter((o) => !successOrigins.includes(o)).concat(successOrigins.filter((o) => !origins.includes(o))).join(', ')}`,
    })

    return []
  })
}

function navigateAboutBlank ({ inBetweenTestsAndNextTestHasTestIsolationOn }: { inBetweenTestsAndNextTestHasTestIsolationOn?: boolean } = {}) {
  // Component testing never supports navigating to about:blank as that is handled by its unmount mechanism
  // When test isolation is off we typically don't navigate to about blank; however if we are in between tests and the next
  // test has test isolation on, we need to navigate to about blank to ensure the next test is not affected by the previous test
  if (Cypress.testingType === 'component' || (!Cypress.config('testIsolation') && !inBetweenTestsAndNextTestHasTestIsolationOn)) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    cy.once('window:load', resolve)

    Cypress.action('cy:url:changed', '')

    return Cypress.action('cy:visit:blank', { testIsolation: true }) as unknown as Promise<void>
  })
}

const enum SESSION_STEPS {
  create = 'create',
  restore = 'restore',
  recreate = 'recreate',
  validate = 'validate',
}

const statusMap = {
  commandState: (status: string) => {
    switch (status) {
      case 'failed':
        return 'failed'
      case 'recreating':
      case 'recreated':
        return 'warned'
      case 'created':
      case 'restored':
        return 'passed'
      default:
        return 'pending'
    }
  },
  inProgress: (step) => {
    switch (step) {
      case 'create':
        return 'creating'
      case 'restore':
        return 'restoring'
      case 'recreate':
        return 'recreating'
      default:
        throw new Error(`${step} is not a valid session step.`)
    }
  },
  stepName: (step) => {
    switch (step) {
      case 'create':
        return 'Create new session'
      case 'restore':
        return 'Restore saved session'
      case 'recreate':
        return 'Recreate session'
      case 'validate':
        return 'Validate session'
      default:
        throw new Error(`${step} is not a valid session step.`)
    }
  },
  complete: (step) => {
    switch (step) {
      case 'create':
        return 'created'
      case 'restore':
        return 'restored'
      case 'recreate':
        return 'recreated'
      default:
        throw new Error(`${step} is not a valid session step.`)
    }
  },
}

export {
  getCurrentOriginStorage,
  setPostMessageLocalStorage,
  getConsoleProps,
  getPostMessageLocalStorage,
  navigateAboutBlank,
  SESSION_STEPS,
  statusMap,
}
