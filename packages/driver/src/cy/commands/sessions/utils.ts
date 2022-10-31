import _ from 'lodash'
import $ from 'jquery'
import Bluebird from 'bluebird'
import { $Location } from '../../../cypress/location'

type SessionData = Cypress.Commands.Session.SessionData

const getSessionDetailsForTable = (sessState: SessionData) => {
  return _.merge(
    _.mapValues(_.groupBy(sessState.cookies, 'domain'), (v) => ({ cookies: v })),
    ..._.map(sessState.localStorage, (v) => ({ [$Location.create(v.origin).hostname]: { localStorage: v } })),
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

const getConsoleProps = (sessState: SessionData) => {
  const sessionDetails = getSessionDetailsForTable(sessState)

  const tables = _.flatMap(sessionDetails, (val, domain) => {
    const cookiesTable = () => {
      return {
        name: `🍪 Cookies - ${domain} (${val.cookies.length})`,
        data: val.cookies,
      }
    }

    const localStorageTable = () => {
      return {
        name: `📁 Storage - ${domain} (${_.keys(val.localStorage.value).length})`,
        data: _.map(val.localStorage.value, (value, key) => {
          return {
            key,
            value,
          }
        }),
      }
    }

    return [
      val.cookies && cookiesTable,
      val.localStorage && localStorageTable,
    ]
  })

  return {
    id: sessState.id,
    table: _.compact(tables),
  }
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

function navigateAboutBlank (session: boolean = true) {
  if (Cypress.config('testIsolation') === 'off') {
    return
  }

  Cypress.action('cy:url:changed', '')

  return Cypress.action('cy:visit:blank', { type: session ? 'session' : 'session-lifecycle' }) as unknown as Promise<void>
}

export {
  getCurrentOriginStorage,
  setPostMessageLocalStorage,
  getConsoleProps,
  getPostMessageLocalStorage,
  navigateAboutBlank,
}
