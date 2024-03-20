/// <reference lib="dom" />

import type { ServiceWorkerClientEvent } from './service-worker-manager'

// this should be of type ServiceWorkerGlobalScope from the webworker lib,
// but we can't reference it directly because it causes errors in other packages
interface ServiceWorkerGlobalScope extends WorkerGlobalScope {
  onfetch: FetchListener | null
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void
  __cypressServiceWorkerClientEvent: (event: string) => void
}

// this should be of type FetchEvent from the webworker lib,
// but we can't reference it directly because it causes errors in other packages
interface FetchEvent extends Event {
  readonly request: Request
  respondWith(r: Response | PromiseLike<Response>): void
}

type FetchListener = (this: ServiceWorkerGlobalScope, ev: FetchEvent) => any

declare let self: ServiceWorkerGlobalScope

/**
 * Injects code into the service worker to overwrite the fetch events to determine if the service worker handled the request.
 * @param body the body of the service worker
 * @returns the updated service worker
 */
export const injectIntoServiceWorker = (body: Buffer) => {
  function __cypressInjectIntoServiceWorker () {
    let listenerCount = 0
    let eventQueue: ServiceWorkerClientEvent[] = []
    const nonCaptureListenersMap = new WeakMap<EventListenerOrEventListenerObject, EventListenerOrEventListenerObject>()
    const captureListenersMap = new WeakMap<EventListenerOrEventListenerObject, EventListenerOrEventListenerObject>()
    const targetToWrappedHandleEventMap = new WeakMap<Object, EventListenerOrEventListenerObject>()
    const targetToOrigHandleEventMap = new WeakMap<Object, EventListenerOrEventListenerObject>()

    const sendEvent = (event: ServiceWorkerClientEvent) => {
      // if the binding has been created, we can call it
      // otherwise, we need to queue the event
      if (self.__cypressServiceWorkerClientEvent) {
        self.__cypressServiceWorkerClientEvent(JSON.stringify(event))
      } else {
        eventQueue.push(event)
      }
    }

    const sendHasFetchEventHandlers = () => {
      // @ts-expect-error __cypressIsScriptEvaluated is declared below
      // if the script has been evaluated, we can call the CDP binding to inform the backend whether or not the service worker has a handler
      if (__cypressIsScriptEvaluated) {
        sendEvent({ type: 'hasFetchHandler', payload: { hasFetchHandler: !!(listenerCount > 0 || self.onfetch) } })
      }
    }

    const sendFetchRequest = (payload: { url: string, isControlled: boolean }) => {
      // call the CDP binding to inform the backend whether or not the service worker handled the request
      sendEvent({ type: 'fetchRequest', payload })
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

    function wrapListener (listener: FetchListener): FetchListener {
      return (event) => {
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
          returnValue.then(() => {
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

    const originalPropertyDescriptor = Object.getOwnPropertyDescriptor(
      self,
      'onfetch',
    )

    if (!originalPropertyDescriptor) {
      return
    }

    // Overwrite the onfetch property so we can
    // determine if the service worker handled the request
    Object.defineProperty(
      self,
      'onfetch',
      {
        configurable: originalPropertyDescriptor.configurable,
        enumerable: originalPropertyDescriptor.enumerable,
        get () {
          return originalPropertyDescriptor.get?.call(this)
        },
        set (value: typeof self.onfetch) {
          let newHandler

          if (value) {
            newHandler = wrapListener(value)
          }

          originalPropertyDescriptor.set?.call(this, newHandler)

          sendHasFetchEventHandlers()
        },
      },
    )

    // listen for the activate event so we can inform the
    // backend whether or not the service worker has a handler
    self.addEventListener('activate', () => {
      sendHasFetchEventHandlers()

      // if the binding has not been created yet, we need to wait for it
      if (!self.__cypressServiceWorkerClientEvent) {
        const timer = setInterval(() => {
          if (self.__cypressServiceWorkerClientEvent) {
            clearInterval(timer)

            // send any events that were queued
            eventQueue.forEach((event) => {
              self.__cypressServiceWorkerClientEvent(JSON.stringify(event))
            })

            eventQueue = []
          }
        }, 5)
      }
    })
  }

  const updatedBody = `
let __cypressIsScriptEvaluated = false;
(${__cypressInjectIntoServiceWorker})();
${body};
__cypressIsScriptEvaluated = true;`

  return updatedBody
}
