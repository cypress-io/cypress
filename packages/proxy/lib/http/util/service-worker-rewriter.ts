/// <reference lib="dom" />

/**
 * Rewrites the service worker to listen to fetch events to determine if the service worker handled the request.
 * @param body the body of the service worker to rewrite
 * @returns the rewritten service worker
 */
export const rewriteServiceWorker = (body: Buffer) => {
  function __cypressCreateListenerFunction (listener) {
    return (event) => {
      // we want to override the respondWith method so we can track if it was called
      // to determine if the service worker handled the request
      const oldRespondWith = event.respondWith
      let respondWithCalled = false

      event.respondWith = (...args) => {
        respondWithCalled = true
        oldRespondWith.call(event, ...args)
      }

      const returnValue = listener(event)

      // @ts-expect-error
      // call the CDP binding to inform the backend whether or not the service worker handled the request
      self.__cypressServiceWorkerFetchEvent(JSON.stringify({ url: event.request.url, respondWithCalled }))

      return returnValue
    }
  }

  function __cypressOverwriteAddRemoveEventListener () {
    const _listeners = new WeakMap()

    const oldAddEventListener = self.addEventListener

    // Overwrite the addEventListener method so we can
    // determine if the service worker handled the request
    self.addEventListener = (type, listener, ...args) => {
      if (type === 'fetch' && (typeof listener === 'function' || listener?.handleEvent)) {
        let newListener

        if (typeof listener === 'function') {
          newListener = __cypressCreateListenerFunction(listener)
        } else {
          newListener = __cypressCreateListenerFunction(listener.handleEvent)
          listener.handleEvent = newListener
        }

        _listeners.set(listener, newListener)

        return oldAddEventListener(type, newListener, ...args)
      }

      return oldAddEventListener(type, listener, ...args)
    }

    const oldRemoveEventListener = self.removeEventListener

    // Overwrite the removeEventListener method so we can
    // remove the listener from the map
    self.removeEventListener = (type, listener, ...args) => {
      if (type === 'fetch' && (typeof listener === 'function' || listener?.handleEvent)) {
        const newListener = _listeners.get(listener)

        _listeners.delete(listener)

        return oldRemoveEventListener(type, newListener, ...args)
      }

      return oldRemoveEventListener(type, listener, ...args)
    }
  }

  function __cypressOverwriteOnfetch () {
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
        set (value: (event) => void) {
          let newHandler

          if (value) {
            newHandler = __cypressCreateListenerFunction(value)
          }

          originalPropertyDescriptor.set?.call(this, newHandler)
        },
      },
    )
  }

  const updatedBody = `
${__cypressCreateListenerFunction};
(${__cypressOverwriteAddRemoveEventListener})();
(${__cypressOverwriteOnfetch})();
${body}`

  return updatedBody
}
