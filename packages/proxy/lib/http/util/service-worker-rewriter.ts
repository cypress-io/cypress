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
    const _capturedListeners = new WeakMap()
    const _handleEvents = new WeakMap()

    const canWrapListener = (listener) => {
      return typeof listener === 'function' || listener?.handleEvent || typeof listener === 'object'
    }

    const oldAddEventListener = self.addEventListener

    // Overwrite the addEventListener method so we can
    // determine if the service worker handled the request
    self.addEventListener = (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
      if (type === 'fetch' && canWrapListener(listener)) {
        let newListener

        // If the listener is a function, we can just wrap it
        // If the listener is an object with a handleEvent method, we can wrap that method
        // Otherwise, we need to wrap the listener in a proxy so we can track and wrap the handleEvent function
        if (typeof listener === 'function') {
          newListener = __cypressCreateListenerFunction(listener)
        } else if (listener?.handleEvent) {
          newListener = __cypressCreateListenerFunction(listener.handleEvent)
          listener.handleEvent = newListener
        } else {
          newListener = new Proxy(listener, {
            get (target, key) {
              if (key === 'handleEvent') {
                if (!_handleEvents.has(target)) {
                  _handleEvents.set(target, __cypressCreateListenerFunction(target.handleEvent))
                }

                return _handleEvents.get(target)
              }

              return Reflect.get(target, key)
            },
          })
        }

        const capture = typeof options === 'boolean' ? options : options?.capture

        capture ? _capturedListeners.set(listener, newListener) : _listeners.set(listener, newListener)

        return oldAddEventListener(type, newListener, options)
      }

      return oldAddEventListener(type, listener, options)
    }

    const oldRemoveEventListener = self.removeEventListener

    // Overwrite the removeEventListener method so we can
    // remove the listener from the map
    self.removeEventListener = (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
      if (type === 'fetch' && canWrapListener(listener)) {
        const capture = typeof options === 'boolean' ? options : options?.capture
        const newListener = capture ? _capturedListeners.get(listener) : _listeners.get(listener)

        capture ? _capturedListeners.delete(listener) : _listeners.delete(listener)

        if (typeof listener === 'object' && typeof listener.handleEvent === 'function') {
          _handleEvents.delete(listener)
        }

        return oldRemoveEventListener(type, newListener, options)
      }

      return oldRemoveEventListener(type, listener, options)
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
