/// <reference lib="dom" />

/**
 * Rewrites the service worker to listen to fetch events to determine if the service worker handled the request.
 * @param body the body of the service worker to rewrite
 * @returns the rewritten service worker
 */
export const rewriteServiceWorker = (body: Buffer) => {
  function __cypressWrapListener (listener: Function) {
    return (event) => {
      // we want to override the respondWith method so we can track if it was called
      // to determine if the service worker handled the request
      const oldRespondWith = event.respondWith
      let respondWithCalled = false

      event.respondWith = (...args) => {
        respondWithCalled = true
        oldRespondWith.call(event, ...args)
      }

      // call the original listener
      const returnValue = listener(event)

      // @ts-expect-error
      // call the CDP binding to inform the backend whether or not the service worker handled the request
      self.__cypressServiceWorkerFetchEvent(JSON.stringify({ url: event.request.url, respondWithCalled }))

      return returnValue
    }
  }

  function __cypressOverwriteAddRemoveEventListeners () {
    const _nonCaptureListenersMap = new WeakMap<EventListenerOrEventListenerObject, EventListenerOrEventListenerObject>()
    const _captureListenersMap = new WeakMap<EventListenerOrEventListenerObject, EventListenerOrEventListenerObject>()
    const _handleEventsMap = new WeakMap<Object, EventListenerOrEventListenerObject>()

    // A listener is considered valid if it is a function, an object with a handleEvent method, or an object (the handleEvent function could be added later)
    const isValidListener = (listener: EventListenerOrEventListenerObject) => {
      return listener && (typeof listener === 'function' || listener?.handleEvent || typeof listener === 'object')
    }

    const isAborted = (options?: boolean | AddEventListenerOptions) => {
      return typeof options === 'object' && options.signal?.aborted
    }

    // Get the capture value from the options
    const getCaptureValue = (options?: boolean | AddEventListenerOptions) => {
      return typeof options === 'boolean' ? options : options?.capture
    }

    const oldAddEventListener = self.addEventListener

    // Overwrite the addEventListener method so we can determine if the service worker handled the request
    // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
    self.addEventListener = (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
      if (type === 'fetch' && isValidListener(listener) && !isAborted(options)) {
        const capture = getCaptureValue(options)
        const existingListener = capture ? _captureListenersMap.get(listener) : _nonCaptureListenersMap.get(listener)

        // If the listener is already in the map, we don't need to wrap it again
        if (existingListener) {
          return oldAddEventListener(type, existingListener, options)
        }

        let newListener

        // If the listener is a function, we can just wrap it
        // If the listener is an object with a handleEvent method, we can wrap that method
        // Otherwise, we need to wrap the listener in a proxy so we can track and wrap the handleEvent function
        if (typeof listener === 'function') {
          newListener = __cypressWrapListener(listener)
        } else if (listener?.handleEvent) {
          newListener = __cypressWrapListener(listener.handleEvent)
          listener.handleEvent = newListener
        } else {
          // since the handleEvent function is being lazily created, we need to use a proxy to wrap it
          newListener = new Proxy(listener, {
            get (target, key) {
              if (key === 'handleEvent') {
                const values = _handleEventsMap.get(target)

                if (!values) {
                  // TODO: also check if the handleEvent function has changed
                  _handleEventsMap.set(target, __cypressWrapListener(target.handleEvent))
                }

                return _handleEventsMap.get(target)
              }

              return Reflect.get(target, key)
            },
          })
        }

        // get the capture value so we know which map to add the listener to
        // so we can then remove the listener later if requested
        getCaptureValue(options) ? _captureListenersMap.set(listener, newListener) : _nonCaptureListenersMap.set(listener, newListener)

        return oldAddEventListener(type, newListener, options)
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
        const newListener = capture ? _captureListenersMap.get(listener) : _nonCaptureListenersMap.get(listener)

        capture ? _captureListenersMap.delete(listener) : _nonCaptureListenersMap.delete(listener)

        // If the listener is an object with a handleEvent method, we need to remove the wrapped function
        if (typeof listener === 'object' && typeof listener.handleEvent === 'function') {
          _handleEventsMap.delete(listener)
        }

        return oldRemoveEventListener(type, newListener!, options)
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
            newHandler = __cypressWrapListener(value)
          }

          originalPropertyDescriptor.set?.call(this, newHandler)
        },
      },
    )
  }

  const updatedBody = `
${__cypressWrapListener};
(${__cypressOverwriteAddRemoveEventListeners})();
(${__cypressOverwriteOnfetch})();
${body}`

  return updatedBody
}
