import { expect } from 'chai'
import sinon from 'sinon'
import { ServiceWorkerManager, serviceWorkerClientEventHandler } from '../../../../lib/http/util/service-worker-manager'

const createBrowserPreRequest = (
  { url, initiatorUrl, callFrameUrl, documentUrl, isPreload }:
  { url: string, initiatorUrl?: string, documentUrl?: string, callFrameUrl?: string, isPreload?: boolean },
) => {
  return {
    requestId: 'id-1',
    method: 'GET',
    url,
    headers: {},
    resourceType: 'fetch' as const,
    originalResourceType: undefined,
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
    context('processBrowserPreRequest', () => {
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

        expect(await result).to.be.true

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

        expect(await result).to.be.true

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

        expect(await result).to.be.true

        // A script request emanated from a different script request is not controlled
        expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
          url: 'http://example.com/quux.js',
          callFrameUrl: 'http://example.com/bar.js',
        }))).to.be.false

        // A script request emanated from a different css request is not controlled
        expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
          url: 'http://example.com/quux.css',
          initiatorUrl: 'http://example.com/baz.css',
        }))).to.be.false

        // A script request emanated from a different document is not controlled
        expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
          url: 'http://example.com/quux.css',
          initiatorUrl: 'http://example.com/baz.css',
        }))).to.be.false

        // A preload request is not controlled
        expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
          url: 'http://example.com/quux.css',
          isPreload: true,
        }))).to.be.false

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

        expect(await result).to.be.false

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
        }))).to.be.false
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
        }))).to.be.false

        // A script request emanated from the previous script request is not controlled
        expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
          url: 'http://example.com/bar.css',
          callFrameUrl: 'http://localhost:8080/foo.js',
        }))).to.be.false

        // A script request emanated from the previous css is not controlled
        expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
          url: 'http://example.com/baz.woff2',
          initiatorUrl: 'http://example.com/bar.css',
        }))).to.be.false

        // A script request emanated from a different script request is not controlled
        expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
          url: 'http://example.com/quux.js',
          callFrameUrl: 'http://example.com/bar.js',
        }))).to.be.false

        // A script request emanated from a different css request is not controlled
        expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
          url: 'http://example.com/quux.css',
          initiatorUrl: 'http://example.com/baz.css',
        }))).to.be.false

        // A script request emanated from a different document is not controlled
        expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
          url: 'http://example.com/quux.css',
          initiatorUrl: 'http://example.com/baz.css',
          documentUrl: 'http://example.com/index.html',
        }))).to.be.false

        // A preload request is not controlled
        expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
          url: 'http://example.com/quux.css',
          isPreload: true,
        }))).to.be.false
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

        expect(await result).to.be.true

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

        expect(await result).to.be.true

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

        expect(await result).to.be.true

        // A script request emanated from a different script request is not controlled
        expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
          url: 'http://example.com/quux.js',
          callFrameUrl: 'http://example.com/bar.js?foo=bar',
          documentUrl: 'http://localhost:8080/index.html?foo=bar',
        }))).to.be.false

        // A script request emanated from a different css request is not controlled
        expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
          url: 'http://example.com/quux.css',
          initiatorUrl: 'http://example.com/baz.css?foo=bar',
          documentUrl: 'http://localhost:8080/index.html?foo=bar',
        }))).to.be.false

        // A script request emanated from a different document is not controlled
        expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
          url: 'http://example.com/quux.css',
          initiatorUrl: 'http://example.com/baz.css?foo=bar',
          documentUrl: 'http://localhost:8080/index.html?foo=bar',
        }))).to.be.false

        // A preload request is not controlled
        expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
          url: 'http://example.com/quux.css',
          isPreload: true,
          documentUrl: 'http://localhost:8080/index.html?foo=bar',
        }))).to.be.false
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

        expect(await result).to.be.true

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

        expect(await result).to.be.true
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

        expect(await result).to.be.true

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
        }))).to.be.false
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
        }))).to.be.true

        expect(await manager.processBrowserPreRequest(createBrowserPreRequest({
          url: 'http://localhost:8080/bar.js',
        }))).to.be.false
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

        expect(await request1).to.be.true
        expect(await request2).to.be.false
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
        }))).to.be.false
      })
    })
  })

  describe('serviceWorkerClientEventHandler', () => {
    it('handles the __cypressServiceWorkerClientEvent event', () => {
      const handler = sinon.stub()

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

      expect(handler).to.have.been.calledWith({
        type: 'fetchRequest',
        payload: {
          url: 'http://localhost:8080/foo.js',
          respondWithCalled: true,
        },
      })
    })

    it('does not handle other events', () => {
      const handler = sinon.stub()

      const event = {
        name: 'notServiceWorkerClientEvent',
        payload: JSON.stringify({
          url: 'http://localhost:8080/foo.js',
        }),
      }

      serviceWorkerClientEventHandler(handler)(event)

      expect(handler).not.to.have.been.called
    })
  })
})
