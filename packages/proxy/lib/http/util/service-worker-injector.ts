/// <reference lib="dom" />

import { serviceWorkerClientEventHandlerName } from './service-worker-manager'
import type { ServiceWorkerClientEvent } from './service-worker-manager'
import { DISABLE_NAVIGATION_PRELOAD_EXPRESSION } from './disable-navigation-preload'

// structural stand-in for the webworker lib's WorkerGlobalScope — the real lib can't be
// referenced because lib="webworker" conflicts with the dom lib program-wide
type WorkerGlobalScope = EventTarget

// this should be of type ServiceWorkerGlobalScope from the webworker lib,
// but we can't reference it directly because it causes errors in other packages,
// so the members the injected code uses are declared explicitly here
interface ServiceWorkerGlobalScope extends WorkerGlobalScope {
  registration: ServiceWorkerRegistration
  clients: {
    claim: () => Promise<void>
    matchAll(): Promise<{ url: string }[]>
  }
  onfetch: FetchListener | null
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void
  __cypressServiceWorkerClientEvent: ((event: string) => void) | undefined
}

// this should be of type FetchEvent from the webworker lib,
// but we can't reference it directly because it causes errors in other packages
interface FetchEvent extends Event {
  readonly request: Request
  respondWith(r: Response | PromiseLike<Response>): void
}

// this should be of type ExtendableEvent from the webworker lib,
// but we can't reference it directly because it causes errors in other packages
interface ExtendableEvent extends Event {
  waitUntil(f: Promise<any>): void
}

type FetchListener = (this: ServiceWorkerGlobalScope, ev: FetchEvent) => any

type ServiceWorkerClientEventWithoutScope = Omit<ServiceWorkerClientEvent, 'scope'>

declare let self: ServiceWorkerGlobalScope

/**
 * Wraps the service worker's fetch listeners, `onfetch`, and `clients.claim` so the
 * backend learns which requests the worker handled. Runs in the worker realm ahead
 * of the worker's own script; it is stringified, so it must not reference anything
 * outside its own body.
 * @param reservedPathPrefixes when set, the wrapped fetch listeners decline requests
 * whose path starts with one of these prefixes rather than letting the application
 * handle them. Supplied by the server from packages/server/lib/adapters/internal-routes.ts.
 * @param canSendHasFetchHandler gates the `hasFetchHandler` events sent while
 * listeners are added: until it returns true the binding may not exist yet, and the
 * install handler below reports the final state instead.
 */
function __cypressInjectIntoServiceWorker (reservedPathPrefixes: string[] | null, canSendHasFetchHandler: () => boolean) {
  let listenerCount = 0
  const nonCaptureListenersMap = new WeakMap<EventListenerOrEventListenerObject, EventListenerOrEventListenerObject>()
  const captureListenersMap = new WeakMap<EventListenerOrEventListenerObject, EventListenerOrEventListenerObject>()
  const targetToWrappedHandleEventMap = new WeakMap<object, EventListenerOrEventListenerObject>()
  const targetToOrigHandleEventMap = new WeakMap<object, EventListenerOrEventListenerObject>()

  const sendEvent = (event: ServiceWorkerClientEventWithoutScope) => {
    const payload = Object.assign({}, event, { scope: self.registration.scope })

    self.__cypressServiceWorkerClientEvent!(JSON.stringify(payload))
  }

  const sendHasFetchEventHandlers = () => {
    // once the CDP binding is available, inform the backend whether or not the service worker has a handler
    if (canSendHasFetchHandler()) {
      sendEvent({ type: 'hasFetchHandler', payload: { hasFetchHandler: !!(listenerCount > 0 || self.onfetch) } })
    }
  }

  const sendFetchRequest = (payload: { url: string, isControlled: boolean }) => {
    // call the CDP binding to inform the backend whether or not the service worker handled the request
    sendEvent({ type: 'fetchRequest', payload })
  }

  const sendClientsClaimed = (payload: { clientUrls: string[] }) => {
    // call the CDP binding to inform the backend that the service worker is now handling requests
    sendEvent({ type: 'clientsClaimed', payload })
  }

  // A listener is considered valid if it is a function or an object (with the handleEvent function or the function could be added later)
  const isValidListener = (listener: EventListenerOrEventListenerObject) => {
    return listener && (typeof listener === 'function' || typeof listener === 'object')
  }

  // Determine if the event listener was aborted
  const isAborted = (options?: boolean | AddEventListenerOptions) => {
    return typeof options === 'object' && options.signal?.aborted
  }

  // Get the capture value from the options
  const getCaptureValue = (options?: boolean | AddEventListenerOptions) => {
    return typeof options === 'boolean' ? options : options?.capture
  }

  // A request under a path Cypress reserves belongs to the runner and never to
  // the application, whichever origin it is on.
  const isReservedPathRequest = (url: string) => {
    if (!reservedPathPrefixes) {
      return false
    }

    const { pathname } = new URL(url)

    return reservedPathPrefixes.some((prefix) => pathname.startsWith(prefix))
  }

  function wrapListener (listener: FetchListener): FetchListener {
    return async (event) => {
      // declining lets the request fall through to the network, where Cypress intercepts it
      if (isReservedPathRequest(event.request.url)) {
        sendFetchRequest({ url: event.request.url, isControlled: false })

        return
      }

      // we want to override the respondWith method so we can track if it was called
      // to determine if the service worker handled the request
      const oldRespondWith = event.respondWith
      let respondWithCalled = false

      event.respondWith = (...args) => {
        respondWithCalled = true
        oldRespondWith.call(event, ...args)
      }

      let returnValue

      try {
        // call the original listener
        returnValue = listener.call(self, event)
      } catch {
        // if the listener throws an error, we still want to proceed with calling the binding
      }

      if (returnValue instanceof Promise) {
        // if the listener returns a promise, we need to wait for it to resolve
        // before we can determine if the service worker handled the request
        await returnValue.then(() => {
          sendFetchRequest({ url: event.request.url, isControlled: respondWithCalled })
        })
      } else {
        sendFetchRequest({ url: event.request.url, isControlled: respondWithCalled })
      }

      return returnValue
    }
  }

  const oldAddEventListener = self.addEventListener

  // Overwrite the addEventListener method so we can determine if the service worker handled the request
  // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
  self.addEventListener = (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
    if (type === 'fetch' && isValidListener(listener) && !isAborted(options)) {
      const capture = getCaptureValue(options)
      const existingListener = capture ? captureListenersMap.get(listener) : nonCaptureListenersMap.get(listener)

      // If the listener is already in the map, we don't need to wrap it again
      if (existingListener) {
        return oldAddEventListener(type, existingListener, options)
      }

      let newListener: EventListenerOrEventListenerObject

      // If the listener is a function, we can just wrap it
      // Otherwise, we need to wrap the listener in a proxy so we can track and wrap the handleEvent function
      if (typeof listener === 'function') {
        newListener = wrapListener(listener) as EventListener
      } else {
        // since the handleEvent function could change, we need to use a proxy to wrap it
        newListener = new Proxy(listener, {
          get (target, key) {
            if (key === 'handleEvent') {
              const wrappedHandleEvent = targetToWrappedHandleEventMap.get(target)
              const origHandleEvent = targetToOrigHandleEventMap.get(target)

              // If the handleEvent function has not been wrapped yet, or if it has changed, we need to wrap it
              if ((!wrappedHandleEvent && target.handleEvent) || target.handleEvent !== origHandleEvent) {
                targetToWrappedHandleEventMap.set(target, wrapListener(target.handleEvent) as EventListener)
                targetToOrigHandleEventMap.set(target, target.handleEvent)
              }

              return targetToWrappedHandleEventMap.get(target)
            }

            return Reflect.get(target, key)
          },
        })
      }

      // call the original addEventListener function prior to doing any additional work since it may fail
      const result = oldAddEventListener(type, newListener, options)

      // get the capture value so we know which map to add the listener to
      // so we can then remove the listener later if requested
      getCaptureValue(options) ? captureListenersMap.set(listener, newListener) : nonCaptureListenersMap.set(listener, newListener)
      listenerCount++

      sendHasFetchEventHandlers()

      return result
    }

    return oldAddEventListener(type, listener, options)
  }

  const oldRemoveEventListener = self.removeEventListener

  // Overwrite the removeEventListener method so we can remove the listener from the map
  // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener
  self.removeEventListener = (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
    if (type === 'fetch' && isValidListener(listener)) {
      // get the capture value so we know which map to remove the listener from
      const capture = getCaptureValue(options)
      const newListener = capture ? captureListenersMap.get(listener) : nonCaptureListenersMap.get(listener)

      // If the listener is not in the map, we don't need to remove it
      // and we can just call the original removeEventListener function
      if (!newListener) {
        return oldRemoveEventListener(type, listener, options)
      }

      // call the original removeEventListener function prior to doing any additional work since it may fail
      const result = oldRemoveEventListener(type, newListener!, options)

      capture ? captureListenersMap.delete(listener) : nonCaptureListenersMap.delete(listener)
      listenerCount--

      // If the listener is an object with a handleEvent method, we need to remove the wrapped function
      if (typeof listener === 'object' && typeof listener.handleEvent === 'function') {
        targetToWrappedHandleEventMap.delete(listener)
        targetToOrigHandleEventMap.delete(listener)
      }

      sendHasFetchEventHandlers()

      return result
    }

    return oldRemoveEventListener(type, listener, options)
  }

  const originalOnFetchPropertyDescriptor = Object.getOwnPropertyDescriptor(
    self,
    'onfetch',
  )

  if (originalOnFetchPropertyDescriptor) {
    // Overwrite the onfetch property so we can
    // determine if the service worker handled the request
    Object.defineProperty(
      self,
      'onfetch',
      {
        configurable: originalOnFetchPropertyDescriptor.configurable,
        enumerable: originalOnFetchPropertyDescriptor.enumerable,
        get () {
          return originalOnFetchPropertyDescriptor.get?.call(this)
        },
        set (value: typeof self.onfetch) {
          let newHandler

          if (value) {
            newHandler = wrapListener(value)
          }

          originalOnFetchPropertyDescriptor.set?.call(this, newHandler)

          sendHasFetchEventHandlers()
        },
      },
    )
  }

  const oldClientsClaim = self.clients.claim

  // Overwrite the clients.claim method so we can inform the backend that the service worker is now handling requests
  self.clients.claim = async () => {
    await oldClientsClaim.call(self.clients)

    const clients = await self.clients.matchAll()
    const clientUrls = clients.map((client) => client.url)

    sendClientsClaimed({ clientUrls })
  }

  // During the install phase, we need to wait for the binding to be created
  // before sending the hasFetchEventHandlers event and any other events
  self.addEventListener('install', (event) => {
    const waitForBinding = () => {
      // if the binding has not been created yet, we need to wait for it
      if (!self.__cypressServiceWorkerClientEvent) {
        return new Promise<void>((resolve) => {
          const timer = setInterval(() => {
            if (self.__cypressServiceWorkerClientEvent) {
              clearInterval(timer)
              resolve()
            }
          }, 5)
        })
      }

      return Promise.resolve()
    }

    const installHandler = async () => {
      // wait for the binding to be created before sending the hasFetchEventHandlers event
      await waitForBinding()
      sendHasFetchEventHandlers()
    }

    (event as ExtendableEvent).waitUntil(installHandler())
  })
}
/**
 * Prepends the instrumentation to a service worker script body. Used on the HTTP
 * proxy path, where every fetch of the script, update checks included, passes
 * through the proxy and gets the same bytes.
 * @param body the body of the service worker
 * @returns the updated service worker
 */
export const injectIntoServiceWorker = (body: Buffer) => {
  return `
let __cypressIsScriptEvaluated = false;
(${__cypressInjectIntoServiceWorker})(null, () => __cypressIsScriptEvaluated);
${body};
__cypressIsScriptEvaluated = true;`
}

const INSTRUMENTED_FLAG_NAME = '__cypressServiceWorkerInstrumented'

/**
 * Builds the instrumentation as an expression to evaluate in a service worker that
 * is paused before its script runs. Used on the browser network (CDP Fetch) path,
 * where the script body must stay byte-for-byte what the origin served: Chrome's
 * update check refetches the script outside any session Cypress intercepts, and a
 * rewritten body would make every update check see a changed script and install a
 * new version.
 *
 * The CDP binding is added by a different connection than the one that evaluates
 * this, so it can still be missing while the worker's script evaluates; events are
 * only sent once it exists. Navigation preload is disabled first, ahead of any
 * user code; see disable-navigation-preload.ts (#34652) for why.
 *
 * A crash-reloaded worker can be sent this more than once before it runs, so it
 * applies only once per worker global. Wrapping the fetch listeners twice would
 * report each request twice, and the extra report would be matched to a later
 * request for the same URL. A reload gets a fresh global, so it is still
 * instrumented.
 * @param options.reservedPathPrefixes see __cypressInjectIntoServiceWorker
 */
export const getServiceWorkerInstrumentationExpression = (options: { reservedPathPrefixes: string[] }) => {
  return `if (!self.${INSTRUMENTED_FLAG_NAME}) {
Object.defineProperty(self, '${INSTRUMENTED_FLAG_NAME}', { value: true });
${DISABLE_NAVIGATION_PRELOAD_EXPRESSION};(${__cypressInjectIntoServiceWorker})(${JSON.stringify(options.reservedPathPrefixes)}, () => typeof self.${serviceWorkerClientEventHandlerName} === 'function');
}`
}
