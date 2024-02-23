import { expect } from 'chai'
import { injectIntoServiceWorker } from '../../../../lib/http/util/service-worker-injector'

describe('lib/http/util/service-worker-injector', () => {
  describe('injectIntoServiceWorker', () => {
    it('injects into the service worker', () => {
      const result = injectIntoServiceWorker(Buffer.from('foo'))

      const expected = `
let __cypressScriptEvaluated = false;
(function __cypressOverwriteAddRemoveEventListeners() {
        let _listenerCount = 0;
        const _nonCaptureListenersMap = new WeakMap();
        const _captureListenersMap = new WeakMap();
        const _targetToWrappedHandleEventMap = new WeakMap();
        const _targetToOrigHandleEventMap = new WeakMap();
        const __cypressServiceWorkerSendHasFetchEventHandlers = () => {
            // @ts-expect-error __cypressScriptEvaluated is declared below
            // if the script has been evaluated, we can call the CDP binding to inform the backend whether or not the service worker has a handler
            if (__cypressScriptEvaluated) {
                self.__cypressServiceWorkerClientEvent(JSON.stringify({ type: 'hasHandlersEvent', payload: { hasHandlers: !!(_listenerCount > 0 || self.onfetch) } }));
            }
        };
        // A listener is considered valid if it is a function or an object (with the handleEvent function or the function could be added later)
        const isValidListener = (listener) => {
            return listener && (typeof listener === 'function' || typeof listener === 'object');
        };
        // Determine if the event listener was aborted
        const isAborted = (options) => {
            var _a;
            return typeof options === 'object' && ((_a = options.signal) === null || _a === void 0 ? void 0 : _a.aborted);
        };
        // Get the capture value from the options
        const getCaptureValue = (options) => {
            return typeof options === 'boolean' ? options : options === null || options === void 0 ? void 0 : options.capture;
        };
        function __cypressWrapListener(listener) {
            return (event) => {
                // we want to override the respondWith method so we can track if it was called
                // to determine if the service worker handled the request
                const oldRespondWith = event.respondWith;
                let respondWithCalled = false;
                event.respondWith = (...args) => {
                    respondWithCalled = true;
                    oldRespondWith.call(event, ...args);
                };
                // call the original listener
                const returnValue = listener(event);
                // call the CDP binding to inform the backend whether or not the service worker handled the request
                self.__cypressServiceWorkerClientEvent(JSON.stringify({ type: 'fetchEvent', payload: { url: event.request.url, isControlled: respondWithCalled } }));
                return returnValue;
            };
        }
        const oldAddEventListener = self.addEventListener;
        // Overwrite the addEventListener method so we can determine if the service worker handled the request
        // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
        self.addEventListener = (type, listener, options) => {
            if (type === 'fetch' && isValidListener(listener) && !isAborted(options)) {
                const capture = getCaptureValue(options);
                const existingListener = capture ? _captureListenersMap.get(listener) : _nonCaptureListenersMap.get(listener);
                // If the listener is already in the map, we don't need to wrap it again
                if (existingListener) {
                    return oldAddEventListener(type, existingListener, options);
                }
                let newListener;
                // If the listener is a function, we can just wrap it
                // Otherwise, we need to wrap the listener in a proxy so we can track and wrap the handleEvent function
                if (typeof listener === 'function') {
                    newListener = __cypressWrapListener(listener);
                }
                else {
                    // since the handleEvent function could change, we need to use a proxy to wrap it
                    newListener = new Proxy(listener, {
                        get(target, key) {
                            if (key === 'handleEvent') {
                                const wrappedHandleEvent = _targetToWrappedHandleEventMap.get(target);
                                const origHandleEvent = _targetToOrigHandleEventMap.get(target);
                                // If the handleEvent function has not been wrapped yet, or if it has changed, we need to wrap it
                                if ((!wrappedHandleEvent && target.handleEvent) || target.handleEvent !== origHandleEvent) {
                                    _targetToWrappedHandleEventMap.set(target, __cypressWrapListener(target.handleEvent));
                                    _targetToOrigHandleEventMap.set(target, target.handleEvent);
                                }
                                return _targetToWrappedHandleEventMap.get(target);
                            }
                            return Reflect.get(target, key);
                        },
                    });
                }
                // get the capture value so we know which map to add the listener to
                // so we can then remove the listener later if requested
                getCaptureValue(options) ? _captureListenersMap.set(listener, newListener) : _nonCaptureListenersMap.set(listener, newListener);
                _listenerCount++;
                __cypressServiceWorkerSendHasFetchEventHandlers();
                return oldAddEventListener(type, newListener, options);
            }
            return oldAddEventListener(type, listener, options);
        };
        const oldRemoveEventListener = self.removeEventListener;
        // Overwrite the removeEventListener method so we can remove the listener from the map
        // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener
        self.removeEventListener = (type, listener, options) => {
            if (type === 'fetch' && isValidListener(listener)) {
                // get the capture value so we know which map to remove the listener from
                const capture = getCaptureValue(options);
                const newListener = capture ? _captureListenersMap.get(listener) : _nonCaptureListenersMap.get(listener);
                capture ? _captureListenersMap.delete(listener) : _nonCaptureListenersMap.delete(listener);
                _listenerCount--;
                // If the listener is an object with a handleEvent method, we need to remove the wrapped function
                if (typeof listener === 'object' && typeof listener.handleEvent === 'function') {
                    _targetToWrappedHandleEventMap.delete(listener);
                    _targetToOrigHandleEventMap.delete(listener);
                }
                __cypressServiceWorkerSendHasFetchEventHandlers();
                return oldRemoveEventListener(type, newListener, options);
            }
            return oldRemoveEventListener(type, listener, options);
        };
        const originalPropertyDescriptor = Object.getOwnPropertyDescriptor(self, 'onfetch');
        if (!originalPropertyDescriptor) {
            return;
        }
        // Overwrite the onfetch property so we can
        // determine if the service worker handled the request
        Object.defineProperty(self, 'onfetch', {
            configurable: originalPropertyDescriptor.configurable,
            enumerable: originalPropertyDescriptor.enumerable,
            get() {
                var _a;
                return (_a = originalPropertyDescriptor.get) === null || _a === void 0 ? void 0 : _a.call(this);
            },
            set(value) {
                var _a;
                let newHandler;
                if (value) {
                    newHandler = __cypressWrapListener(value);
                }
                (_a = originalPropertyDescriptor.set) === null || _a === void 0 ? void 0 : _a.call(this, newHandler);
                __cypressServiceWorkerSendHasFetchEventHandlers();
            },
        });
        // listen for the activate event so we can inform the
        // backend whether or not the service worker has a handler
        self.addEventListener('activate', () => {
            __cypressServiceWorkerSendHasFetchEventHandlers();
        });
    })();
foo;
__cypressScriptEvaluated = true;`

      expect(result).to.equal(expected)
    })
  })
})
