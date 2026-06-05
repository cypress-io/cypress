import _ from 'lodash'
import $ from 'jquery'
import Bluebird from 'bluebird'
import { $Location } from '../../../cypress/location'

const getSessionDetailsByDomain = (sessState: Cypress.SessionData) => {
  return _.merge(
    _.mapValues(_.groupBy(sessState.cookies, 'domain'), (v) => ({ cookies: v })),
    ..._.map(sessState.localStorage, (v) => ({ [$Location.create(v.origin).hostname]: { localStorage: v } })),
    ..._.map(sessState.sessionStorage, (v) => ({ [$Location.create(v.origin).hostname]: { sessionStorage: v } })),
  )
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
    _.remove(origins, (v) => !isSecureContext(v))
  }

  if (!origins.length) return []

  _.each(origins, (u) => {
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

        const opts = _.find(originOptions, { origin: event.origin })!

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
      message: `failed to access session localStorage data on origin(s): ${_.xor(origins, successOrigins).join(', ')}`,
    })
  })
}

const getConsoleProps = (session: Cypress.SessionData) => {
  const sessionDetails = getSessionDetailsByDomain(session)

  const groupsByDomain = _.flatMap(sessionDetails, (val, domain) => {
    return {
      name: `${domain} data:`,
      expand: true,
      label: false,
      groups: _.compact([
        val.cookies && {
          name: `🍪 Cookies - (${val.cookies.length})`,
          expand: true,
          items: val.cookies,
        },
        val.localStorage && {
          name: `📁 Local Storage - (${_.keys(val.localStorage.value).length})`,
          label: true,
          expand: true,
          items: val.localStorage.value,
        },
        val.sessionStorage && {
          name: `📁 Session Storage - (${_.keys(val.sessionStorage.value).length})`,
          expand: true,
          label: true,
          items: val.sessionStorage.value,
        },
      ]),
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
    groups: _.compact(groupsByDomain),
  }

  return props
}

const getPostMessageLocalStorage = (specWindow, origins): Promise<any[]> => {
  const results = [] as any[]
  const iframes: JQuery<HTMLElement>[] = []
  let onPostMessage
  const successOrigins = [] as string[]

  const $iframeContainer = $(`<div style="display:none"></div>`).appendTo($('body', specWindow.document))

  _.each(origins, (u) => {
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
      message: `failed to access session localStorage data on origin(s): ${_.xor(origins, successOrigins).join(', ')}`,
    })

    return []
  })
}

function isAutOnAboutBlank () {
  try {
    // Read the raw location off the AUT window rather than going through
    // cy.getRemoteLocation, which normalizes 'about:blank' to 'about://blank'
    // (see the note in src/cypress/location.ts).
    return cy.state('window')?.location?.href === 'about:blank'
  } catch (e) {
    // A SecurityError means the AUT is on a cross-origin page, which is by
    // definition not about:blank.
    return false
  }
}

function navigateAboutBlank ({ inBetweenTestsAndNextTestHasTestIsolationOn }: { inBetweenTestsAndNextTestHasTestIsolationOn?: boolean } = {}) {
  // Component testing never supports navigating to about:blank as that is handled by its unmount mechanism
  // When test isolation is off we typically don't navigate to about blank; however if we are in between tests and the next
  // test has test isolation on, we need to navigate to about blank to ensure the next test is not affected by the previous test
  if (Cypress.testingType === 'component' || (!Cypress.config('testIsolation') && !inBetweenTestsAndNextTestHasTestIsolationOn)) {
    return Promise.resolve()
  }

  // If the AUT is already on about:blank, there is nothing to navigate to.
  // Re-assigning the iframe's src to 'about:blank' when it is already there is
  // a no-op navigation that does not reliably fire a `load` event. Without that
  // event, the `window:load` listener below never resolves and the surrounding
  // cy.session `cy.then` times out (e.g. 20s).
  // https://github.com/cypress-io/cypress/issues/31988
  if (isAutOnAboutBlank()) {
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
