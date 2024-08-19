import Debug from 'debug'
import pDefer from 'p-defer'
import type { BrowserPreRequest } from '../../types'
import type Protocol from 'devtools-protocol'

const debug = Debug('cypress:proxy:service-worker-manager')

type ServiceWorkerRegistration = {
  registrationId: string
  scopeURL: string
  hasFetchHandler: boolean
  isHandlingRequests: boolean
  activatedServiceWorker?: ServiceWorker
}

type ServiceWorker = {
  registrationId: string
  scriptURL: string
  initiatorOrigin?: string
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
  initiatorOrigin: string
}

export const serviceWorkerClientEventHandlerName = '__cypressServiceWorkerClientEvent'

export declare type ServiceWorkerEventsPayload = {
  'fetchRequest': { url: string, isControlled: boolean }
  'hasFetchHandler': { hasFetchHandler: boolean }
  'clientsClaimed': { clientUrls: string[] }
}

type _ServiceWorkerClientEvent<T extends keyof ServiceWorkerEventsPayload> = { type: T, scope: string, payload: ServiceWorkerEventsPayload[T] }

export type ServiceWorkerClientEvent = _ServiceWorkerClientEvent<keyof ServiceWorkerEventsPayload>

export type ServiceWorkerEventHandler = (event: ServiceWorkerClientEvent) => void

/**
 * Adds and listens to the service worker client event CDP binding.
 * @param event the attached to target event
 */
export const serviceWorkerClientEventHandler = (handler: ServiceWorkerEventHandler) => {
  return (event: { name: string, payload: string }) => {
    if (event.name === serviceWorkerClientEventHandlerName) {
      handler(JSON.parse(event.payload))
    }
  }
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
 * 3. We receive a message from the browser that a service worker has been initiated with the `addInitiatorToServiceWorker` method.
 *
 * At this point, when the manager tries to process a browser pre-request, it will check if the request is controlled by a service worker.
 * It determines it is controlled by a service worker if:
 *
 * 1. The document URL for the browser pre-request matches the initiator origin for the service worker.
 * 2. The request URL is within the scope of the service worker or the request URL's initiator is controlled by the service worker.
 * 3. The fetch handler for the service worker handles the request by calling `event.respondWith`.
 */
export class ServiceWorkerManager {
  private serviceWorkerRegistrations: Map<string, ServiceWorkerRegistration> = new Map<string, ServiceWorkerRegistration>()
  private pendingInitiators: Map<string, string> = new Map<string, string>()
  private pendingControlledUrls: Map<string, string[]> = new Map<string, string[]>()
  private pendingPotentiallyControlledRequests: Map<string, pDefer.DeferredPromise<boolean>[]> = new Map<string, pDefer.DeferredPromise<boolean>[]>()
  private pendingServiceWorkerFetches: Map<string, boolean[]> = new Map<string, boolean[]>()

  /**
   * Goes through the list of service worker registrations and adds or removes them from the manager.
   */
  updateServiceWorkerRegistrations (data: Protocol.ServiceWorker.WorkerRegistrationUpdatedEvent) {
    data.registrations.forEach((registration) => {
      if (registration.isDeleted) {
        this.unregisterServiceWorker({ registrationId: registration.registrationId })
      } else {
        this.registerServiceWorker({ registrationId: registration.registrationId, scopeURL: registration.scopeURL })
      }
    })
  }

  /**
   * Goes through the list of service worker versions and adds any that are activated to the manager.
   */
  updateServiceWorkerVersions (data: Protocol.ServiceWorker.WorkerVersionUpdatedEvent) {
    data.versions.forEach((version) => {
      if (version.status === 'activated') {
        this.addActivatedServiceWorker({ registrationId: version.registrationId, scriptURL: version.scriptURL })
      }
    })
  }

  /**
   * Adds an initiator URL to a service worker. If the service worker has not yet been activated, the initiator URL is added to a pending list and will
   * be added to the service worker when it is activated.
   */
  addInitiatorToServiceWorker ({ scriptURL, initiatorOrigin }: AddInitiatorToServiceWorkerOptions) {
    debug('Adding initiator origin %s to service worker with script URL %s', initiatorOrigin, scriptURL)
    let initiatorAdded = false

    for (const registration of this.serviceWorkerRegistrations.values()) {
      if (registration.activatedServiceWorker?.scriptURL === scriptURL) {
        registration.activatedServiceWorker.initiatorOrigin = initiatorOrigin

        initiatorAdded = true
        break
      }
    }

    if (!initiatorAdded) {
      debug('Service worker not activated yet, adding initiator origin to pending list: %s', scriptURL)
      this.pendingInitiators.set(scriptURL, initiatorOrigin)
    }
  }

  /**
   * Handles a service worker fetch event.
   * @param event the service worker fetch event to handle
   */
  handleServiceWorkerClientEvent (event: ServiceWorkerClientEvent) {
    debug('Handling service worker event: %o', event)

    switch (event.type) {
      case 'fetchRequest':
        this.handleServiceWorkerFetchEvent(event.payload as ServiceWorkerEventsPayload['fetchRequest'])
        break
      case 'hasFetchHandler':
        this.handleHasServiceWorkerFetchHandlersEvent(event.payload as ServiceWorkerEventsPayload['hasFetchHandler'], event.scope)
        break
      case 'clientsClaimed':
        this.handleClientsClaimedEvent(event.payload as ServiceWorkerEventsPayload['clientsClaimed'], event.scope)
        break
      default:
        debug('Unknown event type: %o', event)
    }
  }

  /**
   * Determines if the given stack is controlled by a service worker.
   * @param stack the stack to check
   * @param controlledURLs the set of controlled URLs for the service worker
   * @param scopeURL the scope URL for the service worker registration
   * @returns `true` if the stack is controlled by the service worker, `false` otherwise.
   */
  private isInitiatorStackControlledByServiceWorker (stack: Protocol.Runtime.StackTrace | undefined, controlledURLs: Set<string>, scopeURL: string) {
    debug('Checking if initiator stack is controlled by service worker: %o', { callFrames: stack?.callFrames, controlledURLs })

    return stack?.callFrames?.some((callFrame) => {
      const callFrameUrl = callFrame.url?.split('?')[0]

      return controlledURLs?.has(callFrameUrl) || callFrameUrl?.startsWith(scopeURL)
    }) ?? false
  }

  private shouldControlDocumentRequest (registration: ServiceWorkerRegistration, browserPreRequest: BrowserPreRequest) {
    return browserPreRequest.originalResourceType?.toLowerCase() === 'document' &&
      browserPreRequest.documentURL === browserPreRequest.url &&
      browserPreRequest.url.startsWith(registration.scopeURL)
  }

  /**
   * Processes a browser pre-request to determine if it is controlled by a service worker.
   * If it is, the service worker's controlled URLs are updated with the given request URL.
   *
   * @param browserPreRequest The browser pre-request to process.
   * @returns `true` if the request is controlled by a service worker, `false` otherwise.
   */
  async processBrowserPreRequest (browserPreRequest: BrowserPreRequest) {
    if (browserPreRequest.initiator?.type === 'preload') {
      debug('skipping preload request: %o', browserPreRequest)

      return false
    }

    if (browserPreRequest.hasRedirectResponse) {
      debug('skipping request with redirect response: %o', browserPreRequest)

      return false
    }

    let requestPotentiallyControlledByServiceWorker = false
    let activatedServiceWorker: ServiceWorker | undefined
    const paramlessURL = browserPreRequest.url?.split('?')[0] || ''

    this.serviceWorkerRegistrations.forEach((registration) => {
      activatedServiceWorker = registration.activatedServiceWorker
      const paramlessDocumentURL = browserPreRequest.documentURL?.split('?')[0] || ''

      // if the service worker is active and the request is for the document URL,
      // we can assume that the service worker is controlling the document
      // and update the registration to reflect that
      if (!registration.isHandlingRequests && this.shouldControlDocumentRequest(registration, browserPreRequest)) {
        registration.isHandlingRequests = true
        debug('received request for the document of an activated service worker, updating registration to handle requests: %o', { registration, browserPreRequest })
      }

      // We are determining here if a request is controlled by a service worker. A request is controlled by a service worker if
      // we have an activated service worker that is handling request, the request URL does not come from the service worker, and the request
      // originates from the same origin as the service worker or from a script that is also controlled by the service worker.
      if (!activatedServiceWorker ||
        !registration.hasFetchHandler ||
        !registration.isHandlingRequests ||
        activatedServiceWorker.scriptURL === paramlessDocumentURL ||
        !activatedServiceWorker.initiatorOrigin ||
        !paramlessDocumentURL.startsWith(activatedServiceWorker.initiatorOrigin)) {
        debug('Service worker not activated/handling requests, or the request is directly from the service worker, skipping: %o', { registration, browserPreRequest })

        return
      }

      const paramlessInitiatorURL = browserPreRequest.initiator?.url?.split('?')[0]
      const urlIsControlled = paramlessURL.startsWith(registration.scopeURL)
      const initiatorUrlIsControlled = paramlessInitiatorURL && activatedServiceWorker.controlledURLs?.has(paramlessInitiatorURL)

      debug('Checking if request is potentially controlled by service worker: %o', { registration, browserPreRequest })

      if (urlIsControlled || initiatorUrlIsControlled || this.isInitiatorStackControlledByServiceWorker(browserPreRequest.initiator?.stack, activatedServiceWorker.controlledURLs, registration.scopeURL)) {
        requestPotentiallyControlledByServiceWorker = true
      }
    })

    let isControlled = false

    if (activatedServiceWorker) {
      if (requestPotentiallyControlledByServiceWorker) {
        try {
          isControlled = await this.isURLControlledByServiceWorker(browserPreRequest)
        } catch (e) {
          debug('timed out checking if pre-request is controlled by service worker: %o', { url: browserPreRequest.url, requestId: browserPreRequest.requestId })
        }

        if (isControlled) {
          debug('Request is controlled by service worker: %o', { url: browserPreRequest.url, requestId: browserPreRequest.requestId })
          activatedServiceWorker.controlledURLs.add(paramlessURL)

          return true
        }
      }

      debug('Request is not controlled by service worker: %o', { url: browserPreRequest.url, requestId: browserPreRequest.requestId, requestPotentiallyControlledByServiceWorker })
    }

    return false
  }

  private getRegistrationForScope (scope: string) {
    return Array.from(this.serviceWorkerRegistrations.values()).find((registration) => registration.scopeURL === scope)
  }

  /**
   * Handles a service worker has fetch handlers event.
   * @param event the service worker has fetch handlers event to handle
   * @param scope the scope of the service worker registration
   */
  private handleHasServiceWorkerFetchHandlersEvent (event: ServiceWorkerEventsPayload['hasFetchHandler'], scope: string) {
    const registration = this.getRegistrationForScope(scope)

    if (registration) {
      registration.hasFetchHandler = event.hasFetchHandler
      debug('service worker has fetch handlers: %o', registration)
    } else {
      debug('could not find service worker registration for scope: %s', scope)
    }
  }

  /**
   * Handles a service worker fetch event.
   * @param event the service worker fetch event to handle
   */
  private handleServiceWorkerFetchEvent (event: ServiceWorkerEventsPayload['fetchRequest']) {
    // remove the hash from the URL since the browser won't
    // send it with the pre-request or the proxy request
    const url = new URL(event.url)

    url.hash = ''
    const urlWithoutHash = url.href

    const promises = this.pendingPotentiallyControlledRequests.get(urlWithoutHash)

    if (promises) {
      debug('found pending controlled request promise: %o', { ...event, urlWithoutHash })

      const currentPromiseForUrl = promises.shift()

      if (promises.length === 0) {
        this.pendingPotentiallyControlledRequests.delete(urlWithoutHash)
      }

      currentPromiseForUrl?.resolve(event.isControlled)
    } else {
      const fetches = this.pendingServiceWorkerFetches.get(urlWithoutHash)

      debug('no pending controlled request promise found, adding a pending service worker fetch: %o', { ...event, urlWithoutHash })

      if (fetches) {
        fetches.push(event.isControlled)
      } else {
        this.pendingServiceWorkerFetches.set(urlWithoutHash, [event.isControlled])
      }
    }
  }

  /**
   * Handles a clients claimed event.
   * @param event the clients claimed event to handle
   * @param scope the scope of the service worker registration
   */
  private handleClientsClaimedEvent (event: ServiceWorkerEventsPayload['clientsClaimed'], scope: string) {
    const registration = this.getRegistrationForScope(scope)

    if (registration) {
      registration.isHandlingRequests = true

      if (registration.activatedServiceWorker) {
        event.clientUrls.forEach((url) => registration.activatedServiceWorker?.controlledURLs.add(url))
      } else {
        this.pendingControlledUrls.set(registration.scopeURL, event.clientUrls)
      }

      debug('clients claimed on service worker registration: %o', registration)
    } else {
      debug('could not find service worker registration for scope: %s', scope)
    }
  }

  /**
   * Determines if the given URL is controlled by a service worker.
   * @param url the URL to check
   * @returns a promise that resolves to `true` if the URL is controlled by a service worker, `false` otherwise.
   */
  private isURLControlledByServiceWorker (browserPreRequest: BrowserPreRequest) {
    const url = browserPreRequest.url
    const fetches = this.pendingServiceWorkerFetches.get(url)

    if (fetches) {
      const isControlled = fetches.shift()

      debug('found pending service worker fetch: %o', { url, isControlled, requestId: browserPreRequest.requestId })

      if (fetches.length === 0) {
        this.pendingServiceWorkerFetches.delete(url)
      }

      return Promise.resolve(!!isControlled)
    }

    let promises = this.pendingPotentiallyControlledRequests.get(url)

    if (!promises) {
      promises = []
      this.pendingPotentiallyControlledRequests.set(url, promises)
    }

    const deferred = pDefer<boolean>()

    promises.push(deferred)
    debug('adding pending controlled request promise: %o', { url, requestId: browserPreRequest.requestId })

    let timer
    // race the deferred promise with a timeout to prevent the pre-request from hanging indefinitely
    const racingPromises = Promise.race([
      deferred.promise,
      new Promise<boolean>((_resolve, reject) => timer = setTimeout(reject, 250)),
    ]).finally(() => clearTimeout(timer))

    return racingPromises
  }

  /**
   * Registers the given service worker with the given scope. Will not overwrite an existing registration.
   */
  private registerServiceWorker ({ registrationId, scopeURL }: RegisterServiceWorkerOptions) {
    debug('Registering service worker with registration ID %s and scope URL %s', registrationId, scopeURL)

    // Only register service workers if they haven't already been registered
    const registration = this.serviceWorkerRegistrations.get(registrationId)

    if (registration && registration.scopeURL === scopeURL) {
      debug('Service worker with registration ID %s and scope URL %s already registered', registrationId, scopeURL)

      return
    }

    this.serviceWorkerRegistrations.set(registrationId, {
      registrationId,
      scopeURL,
      isHandlingRequests: false,
      hasFetchHandler: false,
    })
  }

  /**
   * Unregisters the service worker with the given registration ID.
   */
  private unregisterServiceWorker ({ registrationId }: UnregisterServiceWorkerOptions) {
    debug('Unregistering service worker with registration ID %s', registrationId)
    this.serviceWorkerRegistrations.delete(registrationId)
  }

  /**
   * Adds an activated service worker to the manager.
   */
  private addActivatedServiceWorker ({ registrationId, scriptURL }: AddActivatedServiceWorkerOptions) {
    debug('Adding activated service worker with registration ID %s and script URL %s', registrationId, scriptURL)
    const registration = this.serviceWorkerRegistrations.get(registrationId)

    if (registration) {
      const initiatorOrigin = this.pendingInitiators.get(scriptURL)
      const controlledUrls = this.pendingControlledUrls.get(registration.scopeURL)

      registration.activatedServiceWorker = {
        registrationId,
        scriptURL,
        controlledURLs: registration.activatedServiceWorker?.controlledURLs || new Set(controlledUrls) || new Set<string>(),
        initiatorOrigin: initiatorOrigin || registration.activatedServiceWorker?.initiatorOrigin,
      }

      this.pendingInitiators.delete(scriptURL)
      this.pendingControlledUrls.delete(registration.scopeURL)
    } else {
      debug('Could not find service worker registration for registration ID %s', registrationId)
    }
  }
}
