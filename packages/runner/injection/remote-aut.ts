/**
 * The script the remote driver adds to every frame of the runner's tab over the browser's automation
 * protocol, in the page's main world. The server wraps it to provide `cypressRemoteAutConfig`.
 *
 * In the AUT, it does what the legacy bootstrap does from inside the page: it makes a cross-origin
 * page behave as if it were top-level, wraps the page's timers so cy.screenshot can pause them, and
 * reports the page's uncaught errors where the browser's protocol can't. It talks to the server over internal routes on the page's own origin, since
 * nothing in the page can reach the runner.
 */
import { isRunnerFrameName, REMOTE_AUT_API } from '@packages/types'
import type { RemoteAutScriptSettings, RemoteUncaughtException } from '@packages/types'
import type { SerializableAutomationCookie } from '@packages/server/lib/automation/cookie/jar'
import { patchDocumentCookie } from './patches/cross-origin/cookies'
import { patchFetch } from './patches/cross-origin/fetch'
import { patchXmlHttpRequest as patchCrossOriginXmlHttpRequest } from './patches/cross-origin/xmlHttpRequest'
import { patchXmlHttpRequest } from './patches/xmlHttpRequest'
import type { RequestCredentials } from './patches/cross-origin/utils'
import { createTimers } from './timers'

declare const cypressRemoteAutConfig: RemoteAutScriptSettings

const isAut = window.parent === window.top && window !== window.top && !isRunnerFrameName(window.name)
const isHttp = /^https?:$/.test(location.protocol)

// captured before the app runs, so an app that replaces them (a fake XHR, say) doesn't receive these requests
const OriginalXMLHttpRequest = window.XMLHttpRequest
const originalFetch = window.fetch
const route = (name: string) => `/${cypressRemoteAutConfig.namespace}/remote/${name}`

const post = (name: string, body: unknown) => {
  return originalFetch.call(window, route(name), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'omit',
  })
  .catch(() => undefined)
}

// synchronous, so a request made before it returns has its answer before the page's next script runs
const requestSync = (method: 'GET' | 'POST', url: string, body?: unknown) => {
  try {
    const xhr = new OriginalXMLHttpRequest()

    xhr.open(method, url, false)
    xhr.setRequestHeader('content-type', 'application/json')
    xhr.send(body === undefined ? null : JSON.stringify(body))

    return xhr.status === 200 ? xhr.responseText : undefined
  } catch (err) {
    return undefined
  }
}

// worded as the driver words a value it catches in the AUT itself
const toReportedError = (value: unknown): RemoteUncaughtException['error'] => {
  if (typeof value === 'string') {
    return { message: value }
  }

  if (value !== null && typeof value === 'object' && typeof Reflect.get(value, 'message') === 'string') {
    const { name, message, stack } = value as Error

    return { name: String(name), message, stack: typeof stack === 'string' ? stack : undefined }
  }

  return { message: `An unknown error has occurred: ${value}` }
}

// what the driver calls in the AUT over the automation protocol
const api: Record<string, (...args: any[]) => unknown> = {}

if (isAut) {
  Object.defineProperty(window, REMOTE_AUT_API, { value: api })

  const timers = createTimers()

  timers.wrap()
  api.timers = (event: 'pause' | 'reset', shouldPause?: boolean) => {
    try {
      return event === 'pause' ? timers.pause(shouldPause) : timers.reset()
    } catch (err) {
      // a queued timer that throws as it's flushed would otherwise fail the driver's call, not the page
      window.reportError(err)
    }
  }
}

if (isAut && isHttp && cypressRemoteAutConfig.reportErrors) {
  // reported synchronously, so the error reaches the driver before a later round trip to the page returns
  const report = (uncaught: RemoteUncaughtException) => requestSync('POST', route('uncaught'), uncaught)

  window.addEventListener('error', (event) => {
    report({ handlerType: 'error', error: toReportedError(event.error ?? event.message) })
  })

  window.addEventListener('unhandledrejection', (event) => {
    report({ handlerType: 'unhandledrejection', error: toReportedError(event.reason) })
  })
}

if (isAut && isHttp && location.origin !== cypressRemoteAutConfig.primaryOrigin) {
  // the cookies have to be in the jar before the page's own scripts read document.cookie
  const getRequestCookies = (): SerializableAutomationCookie[] => {
    try {
      return JSON.parse(requestSync('GET', `${route('cookies')}?url=${encodeURIComponent(location.href)}`) ?? '[]')
    } catch (err) {
      return []
    }
  }

  const { onCookieCommand } = patchDocumentCookie(getRequestCookies(), (cookie) => {
    void post('set-cookie', { cookie, url: location.href })
  })

  const reportCredentials = (credentials: RequestCredentials) => {
    return credentials.url ? post('credentials', credentials) : undefined
  }

  api.cookies = (event: keyof typeof onCookieCommand, arg: any) => onCookieCommand[event]?.(arg)

  patchFetch(window, reportCredentials)
  patchCrossOriginXmlHttpRequest(window, reportCredentials)
} else if (window !== window.top) {
  patchXmlHttpRequest(window)
}
