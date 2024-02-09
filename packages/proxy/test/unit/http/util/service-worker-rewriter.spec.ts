import { expect } from 'chai'
import { rewriteServiceWorker } from '../../../../lib/http/util/service-worker-rewriter'

describe('lib/http/util/service-worker-rewriter', () => {
  describe('rewriteServiceWorker', () => {
    it('rewrites the service worker', () => {
      const result = rewriteServiceWorker(Buffer.from('foo'))

      const expected = `
function __cypressCreateListenerFunction(listener) {
        return (event) => {
            // we want to override the respondWith method so we can track if it was called
            // to determine if the service worker handled the request
            const oldRespondWith = event.respondWith;
            let respondWithCalled = false;
            event.respondWith = (...args) => {
                respondWithCalled = true;
                oldRespondWith.call(event, ...args);
            };
            const returnValue = listener(event);
            // @ts-expect-error
            // call the CDP binding to inform the backend whether or not the service worker handled the request
            self.__cypressServiceWorkerFetchEvent(JSON.stringify({ url: event.request.url, respondWithCalled }));
            return returnValue;
        };
    };
(function __cypressOverwriteAddRemoveEventListener() {
        const listeners = new WeakMap();
        const oldAddEventListener = self.addEventListener;
        // Overwrite the addEventListener method so we can
        // determine if the service worker handled the request
        self.addEventListener = (type, listener, options) => {
            if (type === 'fetch') {
                const newListener = __cypressCreateListenerFunction(listener);
                listeners.set(listener, newListener);
                return oldAddEventListener(type, newListener, options);
            }
            return oldAddEventListener(type, listener, options);
        };
        const oldRemoveEventListener = self.removeEventListener;
        // Overwrite the removeEventListener method so we can
        // remove the listener from the map
        self.removeEventListener = (type, listener, options) => {
            if (type === 'fetch') {
                const newListener = listeners.get(listener);
                listeners.delete(listener);
                return oldRemoveEventListener(type, newListener, options);
            }
            return oldRemoveEventListener(type, listener, options);
        };
    })();
(function __cypressOverwriteOnfetch() {
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
                    newHandler = __cypressCreateListenerFunction(value);
                }
                (_a = originalPropertyDescriptor.set) === null || _a === void 0 ? void 0 : _a.call(this, newHandler);
            },
        });
    })();
foo`

      expect(result).to.equal(expected)
    })
  })
})
