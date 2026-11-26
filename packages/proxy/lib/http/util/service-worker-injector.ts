import { serviceWorkerClientEventHandlerName } from './service-worker-manager'
import { DISABLE_NAVIGATION_PRELOAD_EXPRESSION } from './disable-navigation-preload.injected'
import { __cypressInjectIntoServiceWorker } from './service-worker-instrumentation.injected'

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
 * user code; see disable-navigation-preload.injected.ts (#34652) for why.
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
