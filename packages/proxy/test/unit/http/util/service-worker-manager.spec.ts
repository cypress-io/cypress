import { expect } from 'chai'
import { ServiceWorkerManager } from '../../../../lib/http/util/service-worker-manager'

describe('lib/http/util/service-worker-manager', () => {
  it('will detect when requests are controlled by a service worker', () => {
    const manager = new ServiceWorkerManager()

    manager.registerServiceWorker({
      registrationId: '1',
      scopeURL: 'http://localhost:8080',
    })

    manager.addActivatedServiceWorker({
      registrationId: '1',
      scriptURL: 'http://localhost:8080/sw.js',
    })

    manager.addInitiatorToServiceWorker({
      scriptURL: 'http://localhost:8080/sw.js',
      initiatorURL: 'http://localhost:8080/index.html',
    })

    // A script request emanated from the service worker's initiator is controlled
    expect(manager.processBrowserPreRequest({
      requestId: 'id-1',
      method: 'GET',
      url: 'http://localhost:8080/foo.js',
      headers: {},
      resourceType: 'fetch',
      originalResourceType: undefined,
      documentURL: 'http://localhost:8080/index.html',
      cdpRequestWillBeSentTimestamp: 0,
      cdpRequestWillBeSentReceivedTimestamp: 0,
    })).to.be.true

    // A script request emanated from the previous script request is controlled
    expect(manager.processBrowserPreRequest({
      requestId: 'id-2',
      method: 'GET',
      url: 'http://example.com/bar.css',
      headers: {},
      resourceType: 'fetch',
      originalResourceType: undefined,
      initiator: {
        type: 'script',
        stack: {
          callFrames: [{
            url: 'http://localhost:8080/foo.js',
            lineNumber: 1,
            columnNumber: 1,
            functionName: '',
            scriptId: '1',
          }],
        },
      },
      documentURL: 'http://localhost:8080/index.html',
      cdpRequestWillBeSentTimestamp: 0,
      cdpRequestWillBeSentReceivedTimestamp: 0,
    })).to.be.true

    // A script request emanated from the previous css is controlled
    expect(manager.processBrowserPreRequest({
      requestId: 'id-3',
      method: 'GET',
      url: 'http://example.com/baz.woff2',
      headers: {},
      resourceType: 'fetch',
      originalResourceType: undefined,
      initiator: {
        type: 'script',
        url: 'http://example.com/bar.css',
      },
      documentURL: 'http://localhost:8080/index.html',
      cdpRequestWillBeSentTimestamp: 0,
      cdpRequestWillBeSentReceivedTimestamp: 0,
    })).to.be.true

    // A script request emanated from a different script request is not controlled
    expect(manager.processBrowserPreRequest({
      requestId: 'id-4',
      method: 'GET',
      url: 'http://example.com/quux.js',
      headers: {},
      resourceType: 'fetch',
      originalResourceType: undefined,
      initiator: {
        type: 'script',
        stack: {
          callFrames: [{
            url: 'http://example.com/bar.js',
            lineNumber: 1,
            columnNumber: 1,
            functionName: '',
            scriptId: '1',
          }],
        },
      },
      documentURL: 'http://localhost:8080/index.html',
      cdpRequestWillBeSentTimestamp: 0,
      cdpRequestWillBeSentReceivedTimestamp: 0,
    })).to.be.false

    // A script request emanated from a different css request is not controlled
    expect(manager.processBrowserPreRequest({
      requestId: 'id-5',
      method: 'GET',
      url: 'http://example.com/quux.css',
      headers: {},
      resourceType: 'fetch',
      originalResourceType: undefined,
      initiator: {
        type: 'script',
        url: 'http://example.com/baz.css',
      },
      documentURL: 'http://localhost:8080/index.html',
      cdpRequestWillBeSentTimestamp: 0,
      cdpRequestWillBeSentReceivedTimestamp: 0,
    })).to.be.false

    // A script request emanated from a different document is not controlled
    expect(manager.processBrowserPreRequest({
      requestId: 'id-6',
      method: 'GET',
      url: 'http://example.com/quux.css',
      headers: {},
      resourceType: 'fetch',
      originalResourceType: undefined,
      initiator: {
        type: 'script',
        url: 'http://example.com/baz.css',
      },
      documentURL: 'http://example.com/index.html',
      cdpRequestWillBeSentTimestamp: 0,
      cdpRequestWillBeSentReceivedTimestamp: 0,
    })).to.be.false

    // A preload request is not controlled
    expect(manager.processBrowserPreRequest({
      requestId: 'id-7',
      method: 'GET',
      url: 'http://example.com/quux.css',
      headers: {},
      resourceType: 'fetch',
      originalResourceType: undefined,
      initiator: {
        type: 'preload',
      },
      documentURL: 'http://localhost:8080/index.html',
      cdpRequestWillBeSentTimestamp: 0,
      cdpRequestWillBeSentReceivedTimestamp: 0,
    })).to.be.false
  })

  it('will detect when requests are controlled by a service worker and handles query parameters', () => {
    const manager = new ServiceWorkerManager()

    manager.registerServiceWorker({
      registrationId: '1',
      scopeURL: 'http://localhost:8080',
    })

    manager.addActivatedServiceWorker({
      registrationId: '1',
      scriptURL: 'http://localhost:8080/sw.js',
    })

    manager.addInitiatorToServiceWorker({
      scriptURL: 'http://localhost:8080/sw.js',
      initiatorURL: 'http://localhost:8080/index.html',
    })

    // A script request emanated from the service worker's initiator is controlled
    expect(manager.processBrowserPreRequest({
      requestId: 'id-1',
      method: 'GET',
      url: 'http://localhost:8080/foo.js',
      headers: {},
      resourceType: 'fetch',
      originalResourceType: undefined,
      documentURL: 'http://localhost:8080/index.html?foo=bar',
      cdpRequestWillBeSentTimestamp: 0,
      cdpRequestWillBeSentReceivedTimestamp: 0,
    })).to.be.true

    // A script request emanated from the previous script request is controlled
    expect(manager.processBrowserPreRequest({
      requestId: 'id-2',
      method: 'GET',
      url: 'http://example.com/bar.css',
      headers: {},
      resourceType: 'fetch',
      originalResourceType: undefined,
      initiator: {
        type: 'script',
        stack: {
          callFrames: [{
            url: 'http://localhost:8080/foo.js?foo=bar',
            lineNumber: 1,
            columnNumber: 1,
            functionName: '',
            scriptId: '1',
          }],
        },
      },
      documentURL: 'http://localhost:8080/index.html?foo=bar',
      cdpRequestWillBeSentTimestamp: 0,
      cdpRequestWillBeSentReceivedTimestamp: 0,
    })).to.be.true

    // A script request emanated from the previous css is controlled
    expect(manager.processBrowserPreRequest({
      requestId: 'id-3',
      method: 'GET',
      url: 'http://example.com/baz.woff2',
      headers: {},
      resourceType: 'fetch',
      originalResourceType: undefined,
      initiator: {
        type: 'script',
        url: 'http://example.com/bar.css?foo=bar',
      },
      documentURL: 'http://localhost:8080/index.html?foo=bar',
      cdpRequestWillBeSentTimestamp: 0,
      cdpRequestWillBeSentReceivedTimestamp: 0,
    })).to.be.true

    // A script request emanated from a different script request is not controlled
    expect(manager.processBrowserPreRequest({
      requestId: 'id-4',
      method: 'GET',
      url: 'http://example.com/quux.js',
      headers: {},
      resourceType: 'fetch',
      originalResourceType: undefined,
      initiator: {
        type: 'script',
        stack: {
          callFrames: [{
            url: 'http://example.com/bar.js?foo=bar',
            lineNumber: 1,
            columnNumber: 1,
            functionName: '',
            scriptId: '1',
          }],
        },
      },
      documentURL: 'http://localhost:8080/index.html?foo=bar',
      cdpRequestWillBeSentTimestamp: 0,
      cdpRequestWillBeSentReceivedTimestamp: 0,
    })).to.be.false

    // A script request emanated from a different css request is not controlled
    expect(manager.processBrowserPreRequest({
      requestId: 'id-5',
      method: 'GET',
      url: 'http://example.com/quux.css',
      headers: {},
      resourceType: 'fetch',
      originalResourceType: undefined,
      initiator: {
        type: 'script',
        url: 'http://example.com/baz.css?foo=bar',
      },
      documentURL: 'http://localhost:8080/index.html?foo=bar',
      cdpRequestWillBeSentTimestamp: 0,
      cdpRequestWillBeSentReceivedTimestamp: 0,
    })).to.be.false

    // A script request emanated from a different document is not controlled
    expect(manager.processBrowserPreRequest({
      requestId: 'id-6',
      method: 'GET',
      url: 'http://example.com/quux.css',
      headers: {},
      resourceType: 'fetch',
      originalResourceType: undefined,
      initiator: {
        type: 'script',
        url: 'http://example.com/baz.css?foo=bar',
      },
      documentURL: 'http://example.com/index.html?foo=bar',
      cdpRequestWillBeSentTimestamp: 0,
      cdpRequestWillBeSentReceivedTimestamp: 0,
    })).to.be.false

    // A preload request is not controlled
    expect(manager.processBrowserPreRequest({
      requestId: 'id-7',
      method: 'GET',
      url: 'http://example.com/quux.css',
      headers: {},
      resourceType: 'fetch',
      originalResourceType: undefined,
      initiator: {
        type: 'preload',
      },
      documentURL: 'http://localhost:8080/index.html?foo=bar',
      cdpRequestWillBeSentTimestamp: 0,
      cdpRequestWillBeSentReceivedTimestamp: 0,
    })).to.be.false
  })

  it('will detect when requests are controlled by a service worker and handles re-registrations', () => {
    const manager = new ServiceWorkerManager()

    manager.registerServiceWorker({
      registrationId: '1',
      scopeURL: 'http://localhost:8080',
    })

    manager.addActivatedServiceWorker({
      registrationId: '1',
      scriptURL: 'http://localhost:8080/sw.js',
    })

    manager.addInitiatorToServiceWorker({
      scriptURL: 'http://localhost:8080/sw.js',
      initiatorURL: 'http://localhost:8080/index.html',
    })

    // A script request emanated from the service worker's initiator is controlled
    expect(manager.processBrowserPreRequest({
      requestId: 'id-1',
      method: 'GET',
      url: 'http://localhost:8080/foo.js',
      headers: {},
      resourceType: 'fetch',
      originalResourceType: undefined,
      documentURL: 'http://localhost:8080/index.html',
      cdpRequestWillBeSentTimestamp: 0,
      cdpRequestWillBeSentReceivedTimestamp: 0,
    })).to.be.true

    // This registration shouldn't wipe out the previous one
    manager.registerServiceWorker({
      registrationId: '1',
      scopeURL: 'http://localhost:8080',
    })

    // A script request emanated from the previous script request is controlled
    expect(manager.processBrowserPreRequest({
      requestId: 'id-2',
      method: 'GET',
      url: 'http://example.com/bar.css',
      headers: {},
      resourceType: 'fetch',
      originalResourceType: undefined,
      initiator: {
        type: 'script',
        stack: {
          callFrames: [{
            url: 'http://localhost:8080/foo.js',
            lineNumber: 1,
            columnNumber: 1,
            functionName: '',
            scriptId: '1',
          }],
        },
      },
      documentURL: 'http://localhost:8080/index.html',
      cdpRequestWillBeSentTimestamp: 0,
      cdpRequestWillBeSentReceivedTimestamp: 0,
    })).to.be.true
  })

  it('will detect when requests are controlled by a service worker and handles unregistrations', () => {
    const manager = new ServiceWorkerManager()

    manager.registerServiceWorker({
      registrationId: '1',
      scopeURL: 'http://localhost:8080',
    })

    manager.addActivatedServiceWorker({
      registrationId: '1',
      scriptURL: 'http://localhost:8080/sw.js',
    })

    manager.addInitiatorToServiceWorker({
      scriptURL: 'http://localhost:8080/sw.js',
      initiatorURL: 'http://localhost:8080/index.html',
    })

    // A script request emanated from the service worker's initiator is controlled
    expect(manager.processBrowserPreRequest({
      requestId: 'id-1',
      method: 'GET',
      url: 'http://localhost:8080/foo.js',
      headers: {},
      resourceType: 'fetch',
      originalResourceType: undefined,
      documentURL: 'http://localhost:8080/index.html',
      cdpRequestWillBeSentTimestamp: 0,
      cdpRequestWillBeSentReceivedTimestamp: 0,
    })).to.be.true

    // This registration shouldn't wipe out the previous one
    manager.unregisterServiceWorker({
      registrationId: '1',
    })

    // A script request emanated from the previous script request is not controlled since the service worker was unregistered
    expect(manager.processBrowserPreRequest({
      requestId: 'id-2',
      method: 'GET',
      url: 'http://example.com/bar.css',
      headers: {},
      resourceType: 'fetch',
      originalResourceType: undefined,
      initiator: {
        type: 'script',
        stack: {
          callFrames: [{
            url: 'http://localhost:8080/foo.js',
            lineNumber: 1,
            columnNumber: 1,
            functionName: '',
            scriptId: '1',
          }],
        },
      },
      documentURL: 'http://localhost:8080/index.html',
      cdpRequestWillBeSentTimestamp: 0,
      cdpRequestWillBeSentReceivedTimestamp: 0,
    })).to.be.false
  })
})
