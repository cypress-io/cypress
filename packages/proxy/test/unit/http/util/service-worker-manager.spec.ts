import { describe, expect, it, vi } from 'vitest'
import { ServiceWorkerManager, serviceWorkerClientEventHandler } from '../../../../lib/http/util/service-worker-manager'

const createBrowserPreRequest = (
  { url, initiatorUrl, callFrameUrl, documentUrl, isPreload, originalResourceType, hasRedirectResponse }:
  { url: string, initiatorUrl?: string, documentUrl?: string, callFrameUrl?: string, isPreload?: boolean, originalResourceType?: string, hasRedirectResponse?: boolean },
) => {
  return {
    requestId: 'id-1',
    method: 'GET',
    url,
    headers: {},
    resourceType: 'fetch' as const,
    originalResourceType: originalResourceType || 'Fetch' as const,
    hasRedirectResponse: hasRedirectResponse || false,
    ...(isPreload
      ? {
        initiator: {
          type: 'preload' as const,
        },
      }
      : {}),
    ...(initiatorUrl
      ? {
        initiator: {
          type: 'script' as const,
          url: initiatorUrl,
        },
      }
      : {}),
    ...(callFrameUrl
      ? {
        initiator: {
          type: 'script' as const,
          stack: {
            callFrames: [{
              url: callFrameUrl,
              lineNumber: 1,
              columnNumber: 1,
              functionName: '',
              scriptId: '1',
            }],
          },
        },
      }
      : {}),
    documentURL: documentUrl || 'http://localhost:8080/index.html',
    cdpRequestWillBeSentTimestamp: 0,
    cdpRequestWillBeSentReceivedTimestamp: 0,
  }
}

describe('lib/http/util/service-worker-manager', () => {
  describe('ServiceWorkerManager', () => {
    let manager: ServiceWorkerManager

    beforeEach(() => {
      manager = new ServiceWorkerManager()

      manager.updateServiceWorkerRegistrations({
        registrations: [{
          registrationId: '1',
          scopeURL: 'http://localhost:8080',
          isDeleted: false,
        }],
      })

      manager.updateServiceWorkerVersions({
        versions: [{
          versionId: '1',
          runningStatus: 'running',
          registrationId: '1',
          scriptURL: 'http://localhost:8080/sw.js',
          status: 'activated',
        }],
      })

      manager.addInitiatorToServiceWorker({
        scriptURL: 'http://localhost:8080/sw.js',
        initiatorOrigin: 'http://localhost:8080/',
      })

      manager.handleServiceWorkerClientEvent({
        type: 'hasFetchHandler',
        payload: {
          hasFetchHandler: true,
        },
        scope: 'http://localhost:8080',
      })
    })

    describe('processBrowserPreRequest', () => {
      describe('with clients claimed', () => {
        beforeEach(() => {
          manager.handleServiceWorkerClientEvent({
            type: 'clientsClaimed',
            payload: {
              clientUrls: ['http://localhost:8080/index.html'],
            },
            scope: 'http://localhost:8080',
          })
        })

        it('will detect when requests are controlled by a service worker', async () => {
          // A script request emanated from the service worker's initiator is controlled
          let result = manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://localhost:8080/foo.js',
          }))

          manager.handleServiceWorkerClientEvent({
            type: 'fetchRequest',
            payload: {
              url: 'http://localhost:8080/foo.js',
              isControlled: true,
            },
            scope: 'http://localhost:8080',
          })

          expect(await result).toBe(true)

          // A script request emanated from the previous script request is controlled
          result = manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://example.com/bar.css',
            callFrameUrl: 'http://localhost:8080/foo.js',
          }))

          manager.handleServiceWorkerClientEvent({
            type: 'fetchRequest',
            payload: {
              url: 'http://example.com/bar.css',
              isControlled: true,
            },
            scope: 'http://localhost:8080',
          })

          expect(await result).toBe(true)

          // A script request emanated from the previous css is controlled
          result = manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://example.com/baz.woff2',
            initiatorUrl: 'http://example.com/bar.css',
          }))

          manager.handleServiceWorkerClientEvent({
            type: 'fetchRequest',
            payload: {
              url: 'http://example.com/baz.woff2',
              isControlled: true,
            },
            scope: 'http://localhost:8080',
          })

          expect(await result).toBe(true)

          // A script request emanated from a different script request is not controlled
          expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://example.com/quux.js',
            callFrameUrl: 'http://example.com/bar.js',
          }))).toBe(false)

          // A script request emanated from a different css request is not controlled
          expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://example.com/quux.css',
            initiatorUrl: 'http://example.com/baz.css',
          }))).toBe(false)

          // A script request emanated from a different document is not controlled
          expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://example.com/quux.css',
            initiatorUrl: 'http://example.com/baz.css',
          }))).toBe(false)

          // A preload request is not controlled
          expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://example.com/quux.css',
            isPreload: true,
          }))).toBe(false)

          // A request that is not handled by the service worker 'fetch' handler is not controlled (browser pre-request first)
          result = manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://localhost:8080/foo.js',
          }))

          manager.handleServiceWorkerClientEvent({
            type: 'fetchRequest',
            payload: {
              url: 'http://localhost:8080/foo.js',
              isControlled: false,
            },
            scope: 'http://localhost:8080',
          })

          expect(await result).toBe(false)

          // A request that is not handled by the service worker 'fetch' handler is not controlled (fetch event first)
          manager.handleServiceWorkerClientEvent({
            type: 'fetchRequest',
            payload: {
              url: 'http://localhost:8080/foo.js',
              isControlled: false,
            },
            scope: 'http://localhost:8080',
          })

          expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://localhost:8080/foo.js',
          }))).toBe(false)
        })

        it('will not detect requests when not controlled by an active service worker', async () => {
          // remove the current service worker
          manager.updateServiceWorkerRegistrations({
            registrations: [{
              registrationId: '1',
              scopeURL: 'http://localhost:8080',
              isDeleted: true,
            }],
          })

          // add a new service worker that is not activated
          manager.updateServiceWorkerRegistrations({
            registrations: [{
              registrationId: '2',
              scopeURL: 'http://localhost:8080',
              isDeleted: false,
            }],
          })

          // update the service worker to be in a non-activated state
          manager.updateServiceWorkerVersions({
            versions: [{
              versionId: '1',
              runningStatus: 'running',
              registrationId: '2',
              scriptURL: 'http://localhost:8080/sw.js',
              status: 'activating',
            }],
          })

          manager.addInitiatorToServiceWorker({
            scriptURL: 'http://localhost:8080/sw.js',
            initiatorOrigin: 'http://localhost:8080/',
          })

          // A script request emanated from the service worker's initiator is not controlled
          expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://localhost:8080/foo.js',
          }))).toBe(false)

          // A script request emanated from the previous script request is not controlled
          expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://example.com/bar.css',
            callFrameUrl: 'http://localhost:8080/foo.js',
          }))).toBe(false)

          // A script request emanated from the previous css is not controlled
          expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://example.com/baz.woff2',
            initiatorUrl: 'http://example.com/bar.css',
          }))).toBe(false)

          // A script request emanated from a different script request is not controlled
          expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://example.com/quux.js',
            callFrameUrl: 'http://example.com/bar.js',
          }))).toBe(false)

          // A script request emanated from a different css request is not controlled
          expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://example.com/quux.css',
            initiatorUrl: 'http://example.com/baz.css',
          }))).toBe(false)

          // A script request emanated from a different document is not controlled
          expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://example.com/quux.css',
            initiatorUrl: 'http://example.com/baz.css',
            documentUrl: 'http://example.com/index.html',
          }))).toBe(false)

          // A preload request is not controlled
          expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://example.com/quux.css',
            isPreload: true,
          }))).toBe(false)
        })

        it('will detect when requests are controlled by a service worker and handles query parameters', async () => {
        // A script request emanated from the service worker's initiator is controlled
          let result = manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://localhost:8080/foo.js',
            documentUrl: 'http://localhost:8080/index.html?foo=bar',
          }))

          manager.handleServiceWorkerClientEvent({
            type: 'fetchRequest',
            payload: {
              url: 'http://localhost:8080/foo.js',
              isControlled: true,
            },
            scope: 'http://localhost:8080',
          })

          expect(await result).toBe(true)

          // A script request emanated from the previous script request is controlled
          result = manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://example.com/bar.css',
            callFrameUrl: 'http://localhost:8080/foo.js?foo=bar',
            documentUrl: 'http://localhost:8080/index.html?foo=bar',
          }))

          manager.handleServiceWorkerClientEvent({
            type: 'fetchRequest',
            payload: {
              url: 'http://example.com/bar.css',
              isControlled: true,
            },
            scope: 'http://localhost:8080',
          })

          expect(await result).toBe(true)

          // A script request emanated from the previous css is controlled
          result = manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://example.com/baz.woff2',
            initiatorUrl: 'http://example.com/bar.css?foo=bar',
            documentUrl: 'http://localhost:8080/index.html?foo=bar',
          }))

          manager.handleServiceWorkerClientEvent({
            type: 'fetchRequest',
            payload: {
              url: 'http://example.com/baz.woff2',
              isControlled: true,
            },
            scope: 'http://localhost:8080',
          })

          expect(await result).toBe(true)

          // A script request emanated from a different script request is not controlled
          expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://example.com/quux.js',
            callFrameUrl: 'http://example.com/bar.js?foo=bar',
            documentUrl: 'http://localhost:8080/index.html?foo=bar',
          }))).toBe(false)

          // A script request emanated from a different css request is not controlled
          expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://example.com/quux.css',
            initiatorUrl: 'http://example.com/baz.css?foo=bar',
            documentUrl: 'http://localhost:8080/index.html?foo=bar',
          }))).toBe(false)

          // A script request emanated from a different document is not controlled
          expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://example.com/quux.css',
            initiatorUrl: 'http://example.com/baz.css?foo=bar',
            documentUrl: 'http://localhost:8080/index.html?foo=bar',
          }))).toBe(false)

          // A preload request is not controlled
          expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://example.com/quux.css',
            isPreload: true,
            documentUrl: 'http://localhost:8080/index.html?foo=bar',
          }))).toBe(false)
        })

        it('will detect when requests are controlled by a service worker and handles re-registrations', async () => {
        // A script request emanated from the service worker's initiator is controlled
          let result = manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://localhost:8080/foo.js',
          }))

          manager.handleServiceWorkerClientEvent({
            type: 'fetchRequest',
            payload: {
              url: 'http://localhost:8080/foo.js',
              isControlled: true,
            },
            scope: 'http://localhost:8080',
          })

          expect(await result).toBe(true)

          manager.updateServiceWorkerRegistrations({
            registrations: [{
              registrationId: '1',
              scopeURL: 'http://localhost:8080',
              isDeleted: false,
            }],
          })

          // A script request emanated from the previous script request is controlled
          result = manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://example.com/bar.css',
            callFrameUrl: 'http://localhost:8080/foo.js',
          }))

          manager.handleServiceWorkerClientEvent({
            type: 'fetchRequest',
            payload: {
              url: 'http://example.com/bar.css',
              isControlled: true,
            },
            scope: 'http://localhost:8080',
          })

          expect(await result).toBe(true)
        })

        it('will detect when requests are controlled by a service worker and handles unregistrations', async () => {
        // A script request emanated from the service worker's initiator is controlled
          const result = manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://localhost:8080/foo.js',
          }))

          manager.handleServiceWorkerClientEvent({
            type: 'fetchRequest',
            payload: {
              url: 'http://localhost:8080/foo.js',
              isControlled: true,
            },
            scope: 'http://localhost:8080',
          })

          expect(await result).toBe(true)

          manager.updateServiceWorkerRegistrations({
            registrations: [{
              registrationId: '1',
              scopeURL: 'http://localhost:8080',
              isDeleted: true,
            }],
          })

          // A script request emanated from the previous script request is not controlled since the service worker was unregistered
          expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://example.com/bar.css',
            callFrameUrl: 'http://localhost:8080/foo.js',
          }))).toBe(false)
        })

        it('supports multiple fetch handler calls first', async () => {
          manager.handleServiceWorkerClientEvent({
            type: 'fetchRequest',
            payload: {
              url: 'http://localhost:8080/foo.js',
              isControlled: true,
            },
            scope: 'http://localhost:8080',
          })

          manager.handleServiceWorkerClientEvent({
            type: 'fetchRequest',
            payload: {
              url: 'http://localhost:8080/bar.js',
              isControlled: false,
            },
            scope: 'http://localhost:8080',
          })

          expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://localhost:8080/foo.js',
          }))).toBe(true)

          expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://localhost:8080/bar.js',
          }))).toBe(false)
        })

        it('supports multiple browser pre-request calls first', async () => {
          const request1 = manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://localhost:8080/foo.js',
          }))

          const request2 = manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://localhost:8080/bar.js',
          }))

          manager.handleServiceWorkerClientEvent({
            type: 'fetchRequest',
            payload: {
              url: 'http://localhost:8080/foo.js',
              isControlled: true,
            },
            scope: 'http://localhost:8080',
          })

          manager.handleServiceWorkerClientEvent({
            type: 'fetchRequest',
            payload: {
              url: 'http://localhost:8080/bar.js',
              isControlled: false,
            },
            scope: 'http://localhost:8080',
          })

          expect(await request1).toBe(true)
          expect(await request2).toBe(false)
        })

        it('supports no client fetch handlers', async () => {
          manager.handleServiceWorkerClientEvent({
            type: 'hasFetchHandler',
            payload: {
              hasFetchHandler: false,
            },
            scope: 'http://localhost:8080',
          })

          expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://localhost:8080/foo.js',
          }))).toBe(false)
        })

        it('supports a request with a hash parameter', async () => {
          let result = manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://localhost:8080/foo.js',
          }))

          manager.handleServiceWorkerClientEvent({
            type: 'fetchRequest',
            payload: {
              url: 'http://localhost:8080/foo.js#hash',
              isControlled: true,
            },
            scope: 'http://localhost:8080',
          })

          expect(await result).toBe(true)
        })

        it('supports a redirected request', async () => {
          expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://localhost:8080/foo.js',
            hasRedirectResponse: true,
          }))).toBe(false)
        })

        it('supports a pre-request that times out when it does not receive a fetch event', async () => {
          expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://localhost:8080/foo.js',
          }))).toBe(false)
        })
      })

      describe('without any controlled urls', () => {
        it('will start handling when clients are claimed', async () => {
          const registration = manager['serviceWorkerRegistrations'].get('1')
          const serviceWorker = registration?.activatedServiceWorker

          expect(registration?.isHandlingRequests).toBe(false)
          expect(serviceWorker?.controlledURLs).toEqual(new Set())

          manager.handleServiceWorkerClientEvent({
            type: 'clientsClaimed',
            payload: {
              clientUrls: ['http://localhost:8080/index.html', 'http://localhost:8080/foo.js'],
            },
            scope: 'http://localhost:8080',
          })

          expect(registration?.isHandlingRequests).toBe(true)
          expect(serviceWorker?.controlledURLs).toEqual(new Set(['http://localhost:8080/index.html', 'http://localhost:8080/foo.js']))
        })

        it('will add client urls to the pending list until the service worker is activated', () => {
          // remove the current service worker
          manager.updateServiceWorkerRegistrations({
            registrations: [{
              registrationId: '1',
              scopeURL: 'http://localhost:8080',
              isDeleted: true,
            }],
          })

          // add a new service worker that is not activated
          manager.updateServiceWorkerRegistrations({
            registrations: [{
              registrationId: '2',
              scopeURL: 'http://localhost:8080',
              isDeleted: false,
            }],
          })

          // update the service worker to be in a non-activated state
          manager.updateServiceWorkerVersions({
            versions: [{
              versionId: '1',
              runningStatus: 'running',
              registrationId: '2',
              scriptURL: 'http://localhost:8080/sw.js',
              status: 'activating',
            }],
          })

          manager.addInitiatorToServiceWorker({
            scriptURL: 'http://localhost:8080/sw.js',
            initiatorOrigin: 'http://localhost:8080/',
          })

          const registration = manager['serviceWorkerRegistrations'].get('2')

          expect(registration?.isHandlingRequests).toBe(false)
          expect(registration?.activatedServiceWorker).toBeUndefined()

          // add client urls to the pending list
          manager.handleServiceWorkerClientEvent({
            type: 'clientsClaimed',
            payload: {
              clientUrls: ['http://localhost:8080/index.html', 'http://localhost:8080/foo.js'],
            },
            scope: 'http://localhost:8080',
          })

          expect(registration?.isHandlingRequests).toBe(true)
          expect(registration?.activatedServiceWorker).toBeUndefined()

          // update the service worker to be in an activated state
          manager.updateServiceWorkerVersions({
            versions: [{
              versionId: '1',
              runningStatus: 'running',
              registrationId: '2',
              scriptURL: 'http://localhost:8080/sw.js',
              status: 'activated',
            }],
          })

          const serviceWorker = registration?.activatedServiceWorker

          expect(serviceWorker?.controlledURLs).toEqual(new Set(['http://localhost:8080/index.html', 'http://localhost:8080/foo.js']))
        })

        it('will start handling requests if the request is for the document', async () => {
          const registration = manager['serviceWorkerRegistrations'].get('1')
          const serviceWorker = registration?.activatedServiceWorker

          expect(registration?.isHandlingRequests).toBe(false)
          expect(serviceWorker?.controlledURLs).toEqual(new Set())

          let result = manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://localhost:8080/index.html',
            originalResourceType: 'Document',
          }))

          expect(registration?.isHandlingRequests).toBe(true)

          manager.handleServiceWorkerClientEvent({
            type: 'fetchRequest',
            payload: {
              url: 'http://localhost:8080/index.html',
              isControlled: true,
            },
            scope: 'http://localhost:8080',
          })

          expect(await result).toBe(true)
          expect(serviceWorker?.controlledURLs).toEqual(new Set(['http://localhost:8080/index.html']))
        })

        it('will handle a request whose call stack includes a url with the scope url', async () => {
          const registration = manager['serviceWorkerRegistrations'].get('1')
          const serviceWorker = registration?.activatedServiceWorker

          expect(registration?.isHandlingRequests).toBe(false)
          expect(serviceWorker?.controlledURLs).toEqual(new Set())

          manager.handleServiceWorkerClientEvent({
            type: 'clientsClaimed',
            payload: {
              clientUrls: ['http://localhost:8080/index.html'],
            },
            scope: 'http://localhost:8080',
          })

          let result = manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://example.com/bar.css',
            callFrameUrl: 'http://localhost:8080/foo.js',
          }))

          expect(registration?.isHandlingRequests).toBe(true)

          manager.handleServiceWorkerClientEvent({
            type: 'fetchRequest',
            payload: {
              url: 'http://example.com/bar.css',
              isControlled: true,
            },
            scope: 'http://localhost:8080',
          })

          expect(await result).toBe(true)
          expect(serviceWorker?.controlledURLs).toEqual(new Set(['http://example.com/bar.css', 'http://localhost:8080/index.html']))
        })

        it('will handle a request whose call stack includes a url with a controlled url', async () => {
          const registration = manager['serviceWorkerRegistrations'].get('1')
          const serviceWorker = registration?.activatedServiceWorker

          expect(registration?.isHandlingRequests).toBe(false)
          expect(serviceWorker?.controlledURLs).toEqual(new Set())

          manager.handleServiceWorkerClientEvent({
            type: 'clientsClaimed',
            payload: {
              clientUrls: ['http://localhost:8080/index.html'],
            },
            scope: 'http://localhost:8080',
          })

          let result = manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://example.com/bar.css',
            callFrameUrl: 'http://localhost:8080/foo.js',
          }))

          expect(registration?.isHandlingRequests).toBe(true)

          manager.handleServiceWorkerClientEvent({
            type: 'fetchRequest',
            payload: {
              url: 'http://example.com/bar.css',
              isControlled: true,
            },
            scope: 'http://localhost:8080',
          })

          expect(await result).toBe(true)
          expect(serviceWorker?.controlledURLs).toEqual(new Set(['http://example.com/bar.css', 'http://localhost:8080/index.html']))
        })

        it('does not start handling requests if the request is for a document not within the service worker scope', async () => {
          const registration = manager['serviceWorkerRegistrations'].get('1')
          const serviceWorker = registration?.activatedServiceWorker

          let result = manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://localhost:9999/index.html',
            originalResourceType: 'Document',
          }))

          expect(registration?.isHandlingRequests).toBe(false)
          expect(serviceWorker?.controlledURLs).toEqual(new Set())
          expect(await result).toBe(false)
        })

        it('does not start handling requests if the request is not for a document', async () => {
          const registration = manager['serviceWorkerRegistrations'].get('1')
          const serviceWorker = registration?.activatedServiceWorker

          let result = manager.processBrowserPreRequest(createBrowserPreRequest({
            url: 'http://localhost:8080/index.html',
            originalResourceType: 'Fetch',
          }))

          expect(registration?.isHandlingRequests).toBe(false)
          expect(serviceWorker?.controlledURLs).toEqual(new Set())
          expect(await result).toBe(false)
        })
      })
    })
  })

  describe('serviceWorkerClientEventHandler', () => {
    it('handles the __cypressServiceWorkerClientEvent event', () => {
      const handler = vi.fn()

      const event = {
        name: '__cypressServiceWorkerClientEvent',
        payload: JSON.stringify({
          type: 'fetchRequest',
          payload: {
            url: 'http://localhost:8080/foo.js',
            respondWithCalled: true,
          },
        }),
      }

      serviceWorkerClientEventHandler(handler)(event)

      expect(handler).toHaveBeenCalledWith({
        type: 'fetchRequest',
        payload: {
          url: 'http://localhost:8080/foo.js',
          respondWithCalled: true,
        },
      })
    })

    it('does not handle other events', () => {
      const handler = vi.fn()

      const event = {
        name: 'notServiceWorkerClientEvent',
        payload: JSON.stringify({
          url: 'http://localhost:8080/foo.js',
        }),
      }

      serviceWorkerClientEventHandler(handler)(event)

      expect(handler).not.toHaveBeenCalled()
    })
  })
})
