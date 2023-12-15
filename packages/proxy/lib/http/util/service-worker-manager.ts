import type { BrowserPreRequest } from '../../types'

type ServiceWorkerRegistration = {
  registrationId: string
  scopeURL: string
  activatedServiceWorker?: ServiceWorker
}

type ServiceWorker = {
  registrationId: string
  scriptURL: string
  initiatorURL?: string
  controlledURLs: Set<string>
}

type RegisterServiceWorkerOptions = {
  registrationId: string
  scopeURL: string
}

type UnregisterServiceWorkerOptions = {
  registrationId: string
}

type AddActivatedServiceWorkerOptions = {
  registrationId: string
  scriptURL: string
}

type AddInitiatorToServiceWorkerOptions = {
  scriptURL: string
  initiatorURL: string
}

/**
 * Manages service worker registrations and their controlled URLs.
 *
 * The basic lifecycle is as follows:
 *
 * 1. A service worker is registered via `registerServiceWorker`.
 * 2. The service worker is activated via `addActivatedServiceWorker`.
 *
 * At some point while 1 and 2 are happening:
 *
 * 3. We receive a message from the browser that a service worker has been registered with the `addInitiatorToServiceWorker` method.
 *
 * At this point, when the manager tries to process a browser pre-request, it will check if the request is controlled by a service worker.
 * It determines it is controlled by a service worker if:
 *
 * 1. The document URL for the browser pre-request matches the initiator URL for the service worker.
 * 2. The request URL is within the scope of the service worker or the request URL's initiator is controlled by the service worker.
 */
export class ServiceWorkerManager {
  private serviceWorkerRegistrations: Map<string, ServiceWorkerRegistration> = new Map<string, ServiceWorkerRegistration>()
  private pendingInitiators: Map<string, string> = new Map<string, string>()

  /**
   * Registers the given service worker with the given scope. Will not overwrite an existing registration.
   */
  registerServiceWorker ({ registrationId, scopeURL }: RegisterServiceWorkerOptions) {
    // Only register service workers if they haven't already been registered
    if (this.serviceWorkerRegistrations.get(registrationId)?.scopeURL === scopeURL) {
      return
    }

    this.serviceWorkerRegistrations.set(registrationId, {
      registrationId,
      scopeURL,
    })
  }

  /**
   * Unregisters the service worker with the given registration ID.
   */
  unregisterServiceWorker ({ registrationId }: UnregisterServiceWorkerOptions) {
    this.serviceWorkerRegistrations.delete(registrationId)
  }

  /**
   * Adds an activated service worker to the manager.
   */
  addActivatedServiceWorker ({ registrationId, scriptURL }: AddActivatedServiceWorkerOptions) {
    const registration = this.serviceWorkerRegistrations.get(registrationId)

    if (registration) {
      const initiatorURL = this.pendingInitiators.get(scriptURL)

      registration.activatedServiceWorker = {
        registrationId,
        scriptURL,
        controlledURLs: new Set<string>(),
        initiatorURL: initiatorURL || registration.activatedServiceWorker?.initiatorURL,
      }

      this.pendingInitiators.delete(scriptURL)
    }
  }

  /**
   * Adds an initiator URL to a service worker. If the service worker has not yet been activated, the initiator URL is added to a pending list and will
   * be added to the service worker when it is activated.
   */
  addInitiatorToServiceWorker ({ scriptURL, initiatorURL }: AddInitiatorToServiceWorkerOptions) {
    let initiatorAdded = false

    this.serviceWorkerRegistrations.forEach((registration) => {
      if (registration.activatedServiceWorker?.scriptURL === scriptURL) {
        registration.activatedServiceWorker.initiatorURL = initiatorURL

        initiatorAdded = true
      }
    })

    if (!initiatorAdded) {
      this.pendingInitiators.set(scriptURL, initiatorURL)
    }
  }

  /**
   * Processes a browser pre-request to determine if it is controlled by a service worker. If it is, the service worker's controlled URLs are updated with the given request URL.
   *
   * @param browserPreRequest The browser pre-request to process.
   * @returns `true` if the request is controlled by a service worker, `false` otherwise.
   */
  processBrowserPreRequest (browserPreRequest: BrowserPreRequest) {
    if (browserPreRequest.initiator?.type === 'preload') {
      return false
    }

    let requestControlledByServiceWorker = false

    this.serviceWorkerRegistrations.forEach((registration) => {
      const activatedServiceWorker = registration.activatedServiceWorker
      const paramlessDocumentURL = browserPreRequest.documentURL.split('?')[0]

      if (!activatedServiceWorker || activatedServiceWorker.initiatorURL !== paramlessDocumentURL) {
        return
      }

      const paramlessURL = browserPreRequest.url.split('?')[0]
      const paramlessInitiatorURL = browserPreRequest.initiator?.url?.split('?')[0]
      const paramlessCallStackURL = browserPreRequest.initiator?.stack?.callFrames[0]?.url?.split('?')[0]
      const urlIsControlled = paramlessURL.startsWith(registration.scopeURL)
      const initiatorUrlIsControlled = paramlessInitiatorURL && activatedServiceWorker.controlledURLs?.has(paramlessInitiatorURL)
      const topStackUrlIsControlled = paramlessCallStackURL && activatedServiceWorker.controlledURLs?.has(paramlessCallStackURL)

      if (urlIsControlled || initiatorUrlIsControlled || topStackUrlIsControlled) {
        activatedServiceWorker.controlledURLs.add(paramlessURL)
        requestControlledByServiceWorker = true
      }
    })

    return requestControlledByServiceWorker
  }
}
