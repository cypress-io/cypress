// structural stand-in for the webworker lib's NavigationPreloadManager — the
// real lib can't be referenced because lib="webworker" conflicts with the
// dom lib program-wide (see service-worker-injector.ts for the same trick)
interface NavigationPreloadManager {
  enable (): Promise<void>
  disable (): Promise<void>
}

interface ServiceWorkerRegistrationLike {
  navigationPreload?: NavigationPreloadManager
}

interface ServiceWorkerGlobalScopeLike {
  registration?: ServiceWorkerRegistrationLike
}

declare const self: ServiceWorkerGlobalScopeLike

/**
 * Disables navigation preload so a service worker's fetch handler falls back
 * to `fetch(e.request)` — the path CDP Fetch can intercept. A navigation
 * preload response bypasses `Fetch.requestPaused` entirely (a known CDP
 * limitation shared by puppeteer/playwright), so with the proxy disabled it
 * reaches the renderer with framebusting headers unstripped and no Cypress
 * injection (#34652).
 *
 * `registration.navigationPreload` is reachable from two realms, and each
 * needs its own seam:
 * - Worker realm (`self.registration.navigationPreload`, inside the service
 *   worker's own script): closed by `DISABLE_NAVIGATION_PRELOAD_EXPRESSION`
 *   below. `service-worker-injector.ts` prepends it to every service worker
 *   script fetched through the pipeline, ahead of any user code, so it wins
 *   the race against that worker's own install/activate for any script the
 *   pipeline refetches.
 * - Window realm (`registration.navigationPreload`, from the page — e.g.
 *   immediately after `serviceWorker.register()`): `enable()` is closed
 *   deterministically by `DISABLE_NAVIGATION_PRELOAD_WINDOW_EXPRESSION`
 *   below, which `initializeCDP` in browsers/utils.ts evaluates before any
 *   page script runs, on every new document while the proxy is disabled.
 *   That same expression also sweeps `serviceWorkerContainer.
 *   getRegistrations()` to `disable()` a persisted registration from an
 *   earlier run (whose script the pipeline never refetches, so the worker
 *   realm expression never reaches it) — but the sweep runs at the start of
 *   the navigation that document-start script is evaluated for, and a
 *   persisted worker may already have served that same navigation's preload
 *   response by then. It only reliably prevents preload on that worker's
 *   subsequent navigations, not the one racing the sweep itself.
 *
 * Both expressions patch `enable()` to a resolving no-op rather than
 * removing it or making it throw: callers commonly
 * `waitUntil(registration.navigationPreload.enable())` (worker realm) or
 * await it directly (window realm), and a rejection there would fail the
 * caller's own logic (a service worker's activation, in the worker case).
 * Both also fire `disable()` — on the worker's own registration, or per
 * registration returned by `serviceWorker.getRegistrations()` — to clear the
 * flag on one that is already active; it rejects harmlessly with
 * InvalidStateError when there is no active worker yet, where the `enable()`
 * patch is the load-bearing half.
 *
 * `getState()` is left untouched in both realms — it keeps reporting the
 * real state (disabled). Code that polls `getState().enabled === true` to
 * confirm preload is active will wait forever under proxy-disabled. A
 * service worker that calls `respondWith(e.preloadResponse)` with no
 * fallback still fails its navigation; the spec and MDN mandate a fallback,
 * and spoofing `preloadResponse` at either seam is infeasible.
 */
function __cypressDisableNavigationPreload () {
  try {
    const preload = self.registration && self.registration.navigationPreload

    if (!preload) {
      return
    }

    // Patched where `enable` resolves through the prototype chain, so every
    // reference to the manager sees the resolving stub, not just this
    // instance. Falls back to the instance itself when the chain has no
    // `enable` to patch there.
    const proto = Object.getPrototypeOf(preload)
    const target = proto && typeof proto.enable === 'function' ? proto : preload

    target.enable = function () {
      return Promise.resolve()
    }

    preload.disable().catch(function () {})
  } catch {
    // Missing self.registration/navigationPreload, or any other unexpected
    // shape, must not break the service worker's startup.
  }
}

export const DISABLE_NAVIGATION_PRELOAD_EXPRESSION = `(${__cypressDisableNavigationPreload})()`

// structural stand-in for the dom lib's NavigationPreloadManager constructor,
// reachable only from the window realm — its prototype is the same
// NavigationPreloadManager shape declared above, since both realms expose
// the identical manager type
interface NavigationPreloadManagerCtor {
  prototype?: NavigationPreloadManager
}

interface ServiceWorkerContainerLike {
  getRegistrations? (): Promise<ServiceWorkerRegistrationLike[]>
}

interface WindowLike {
  NavigationPreloadManager?: NavigationPreloadManagerCtor
  navigator?: { serviceWorker?: ServiceWorkerContainerLike }
}

declare const window: WindowLike

function __cypressDisableNavigationPreloadInWindow () {
  try {
    const ctor = window.NavigationPreloadManager

    if (ctor && ctor.prototype && typeof ctor.prototype.enable === 'function') {
      ctor.prototype.enable = function () {
        return Promise.resolve()
      }
    }
  } catch {
    // The guard above checks existence of the constructor, its prototype,
    // and enable — but any of those could still be an unexpected shape
    // (e.g. a getter that throws), so this stays load-bearing.
  }

  try {
    const container = window.navigator && window.navigator.serviceWorker

    if (!container || typeof container.getRegistrations !== 'function') {
      return
    }

    container.getRegistrations().then(function (registrations) {
      registrations.forEach(function (registration) {
        if (registration.navigationPreload) {
          registration.navigationPreload.disable().catch(function () {})
        }
      })
    }).catch(function () {})
  } catch {
    // Missing navigator.serviceWorker, or any other unexpected shape, must
    // not break the page bootstrap script.
  }
}

export const DISABLE_NAVIGATION_PRELOAD_WINDOW_EXPRESSION = `(${__cypressDisableNavigationPreloadInWindow})()`
