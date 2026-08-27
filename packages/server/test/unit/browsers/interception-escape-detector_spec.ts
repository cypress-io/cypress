const { expect, sinon } = require('../../spec_helper')

import type { Protocol } from 'devtools-protocol'
import { InterceptionEscapeDetector } from '../../../lib/browsers/cdp-protocol/interception-escape-detector'

function createClient () {
  return {
    on: sinon.stub(),
    off: sinon.stub(),
  }
}

function createDetector () {
  const client = createClient()
  const onEscape = sinon.stub()
  const detector = new InterceptionEscapeDetector(client as any, onEscape)

  detector.start()

  const handler = (eventName: string) => client.on.withArgs(eventName).firstCall.args[1]

  return {
    client,
    detector,
    onEscape,
    requestPaused: handler('Fetch.requestPaused') as (event: any, sessionId?: string) => void,
    requestWillBeSent: handler('Network.requestWillBeSent') as (event: any, sessionId?: string) => void,
    responseReceived: handler('Network.responseReceived') as (event: any, sessionId?: string) => void,
    loadingFinished: handler('Network.loadingFinished') as (event: any, sessionId?: string) => void,
    attachedToTarget: handler('Target.attachedToTarget') as (event: any, sessionId?: string) => void,
    detachedFromTarget: handler('Target.detachedFromTarget') as (event: any, sessionId?: string) => void,
  }
}

const documentRequest = (requestId: string, url: string, method = 'GET'): Partial<Protocol.Network.RequestWillBeSentEvent> => {
  return {
    requestId,
    type: 'Document',
    request: { method, url } as Protocol.Network.Request,
  }
}

const documentResponse = (requestId: string, url: string, fromServiceWorker: boolean): Partial<Protocol.Network.ResponseReceivedEvent> => {
  return {
    requestId,
    type: 'Document',
    response: { url, fromServiceWorker } as Protocol.Network.Response,
  }
}

const workerAttach = (targetId: string, waitingForDebugger = true): Partial<Protocol.Target.AttachedToTargetEvent> => {
  return {
    sessionId: `session-${targetId}`,
    waitingForDebugger,
    targetInfo: { targetId, type: 'service_worker' } as Protocol.Target.TargetInfo,
  }
}

describe('InterceptionEscapeDetector', () => {
  describe('start/stop', () => {
    it('registers its handlers on start and removes them on stop', () => {
      const client = createClient()
      const detector = new InterceptionEscapeDetector(client as any, sinon.stub())

      detector.start()

      const registered = client.on.getCalls().map((call) => call.args[0])

      expect(registered).to.deep.equal([
        'Fetch.requestPaused',
        'Network.requestWillBeSent',
        'Network.responseReceived',
        'Network.loadingFinished',
        'Network.loadingFailed',
        'Target.attachedToTarget',
        'Target.detachedFromTarget',
      ])

      detector.stop()

      expect(client.off.getCalls().map((call) => call.args[0])).to.deep.equal(registered)
    })

    it('is idempotent', () => {
      const client = createClient()
      const detector = new InterceptionEscapeDetector(client as any, sinon.stub())

      detector.start()
      detector.start()
      expect(client.on.callCount).to.equal(7)

      detector.stop()
      detector.stop()
      expect(client.off.callCount).to.equal(7)
    })
  })

  describe('escape detection', () => {
    it('reports a service-worker-served document with no Fetch pause and no attached worker', () => {
      const { requestWillBeSent, responseReceived, onEscape } = createDetector()

      requestWillBeSent(documentRequest('1', 'https://app.test/dashboard'))
      responseReceived(documentResponse('1', 'https://app.test/dashboard', true))

      expect(onEscape).to.be.calledOnceWith({ url: 'https://app.test/dashboard', method: 'GET' })
    })

    it('falls back to GET and the response url when the request was never tracked', () => {
      const { responseReceived, onEscape } = createDetector()

      responseReceived(documentResponse('untracked', 'https://app.test/', true))

      expect(onEscape).to.be.calledOnceWith({ url: 'https://app.test/', method: 'GET' })
    })

    it('uses the redirected url when the document request re-emits under the same requestId', () => {
      const { requestWillBeSent, responseReceived, onEscape } = createDetector()

      requestWillBeSent(documentRequest('1', 'https://app.test/old'))
      requestWillBeSent(documentRequest('1', 'https://app.test/new'))
      responseReceived(documentResponse('1', 'https://app.test/new', true))

      expect(onEscape).to.be.calledOnceWith({ url: 'https://app.test/new', method: 'GET' })
    })

    it('ignores documents not served by a service worker', () => {
      const { requestWillBeSent, responseReceived, onEscape } = createDetector()

      requestWillBeSent(documentRequest('1', 'https://app.test/'))
      responseReceived(documentResponse('1', 'https://app.test/', false))

      expect(onEscape).not.to.be.called
    })

    it('ignores non-document responses even when service-worker-served', () => {
      const { responseReceived, onEscape } = createDetector()

      responseReceived({
        requestId: '1',
        type: 'XHR',
        response: { url: 'https://app.test/api', fromServiceWorker: true },
      })

      expect(onEscape).not.to.be.called
    })
  })

  describe('suppression', () => {
    it('does not report when a Fetch pause matched the document (intercepted passthrough)', () => {
      const { requestPaused, requestWillBeSent, responseReceived, onEscape } = createDetector()

      requestWillBeSent(documentRequest('1', 'https://app.test/dashboard'))
      // The worker's outgoing fetch(e.request) pauses under its own networkId,
      // but the same method and url.
      requestPaused({ request: { method: 'GET', url: 'https://app.test/dashboard' } }, 'worker-session')
      responseReceived(documentResponse('1', 'https://app.test/dashboard', true))

      expect(onEscape).not.to.be.called
    })

    it('does not report while a worker session is attached (cache-served document)', () => {
      const { attachedToTarget, requestWillBeSent, responseReceived, onEscape } = createDetector()

      attachedToTarget(workerAttach('worker-1'))
      requestWillBeSent(documentRequest('1', 'https://app.test/dashboard'))
      responseReceived(documentResponse('1', 'https://app.test/dashboard', true))

      expect(onEscape).not.to.be.called
    })

    it('suppresses via a worker that attached already running', () => {
      const { attachedToTarget, responseReceived, onEscape } = createDetector()

      attachedToTarget(workerAttach('worker-1', false))
      responseReceived(documentResponse('1', 'https://app.test/', true))

      expect(onEscape).not.to.be.called
    })

    it('reports again once every worker target has detached', () => {
      const { attachedToTarget, detachedFromTarget, responseReceived, onEscape } = createDetector()

      attachedToTarget(workerAttach('worker-1'))
      detachedFromTarget({ targetId: 'worker-1' })
      responseReceived(documentResponse('1', 'https://app.test/', true))

      expect(onEscape).to.be.calledOnce
    })

    it('keys tracked documents by session so equal requestIds cannot collide', () => {
      const { requestWillBeSent, responseReceived, onEscape } = createDetector()

      requestWillBeSent(documentRequest('1', 'https://app.test/a', 'POST'), 'session-a')
      requestWillBeSent(documentRequest('1', 'https://app.test/b'), 'session-b')
      responseReceived(documentResponse('1', 'https://app.test/a', true), 'session-a')

      expect(onEscape).to.be.calledOnceWith({ url: 'https://app.test/a', method: 'POST' })
    })
  })

  describe('reset', () => {
    it('clears the pause ledger but keeps worker attach state', () => {
      const { detector, attachedToTarget, requestPaused, requestWillBeSent, responseReceived, onEscape } = createDetector()

      attachedToTarget(workerAttach('worker-1'))
      requestPaused({ request: { method: 'GET', url: 'https://app.test/' } })

      detector.reset()

      // The worker guard still suppresses even though the pause was forgotten.
      requestWillBeSent(documentRequest('1', 'https://app.test/'))
      responseReceived(documentResponse('1', 'https://app.test/', true))

      expect(onEscape).not.to.be.called
    })

    it('clears tracked document requests', () => {
      const { detector, requestWillBeSent, responseReceived, onEscape } = createDetector()

      requestWillBeSent(documentRequest('1', 'https://app.test/form', 'POST'))
      detector.reset()
      responseReceived(documentResponse('1', 'https://app.test/form', true))

      expect(onEscape).to.be.calledOnceWith({ url: 'https://app.test/form', method: 'GET' })
    })
  })

  describe('bookkeeping', () => {
    it('drops a tracked document once its load settles', () => {
      const { requestWillBeSent, loadingFinished, responseReceived, onEscape } = createDetector()

      requestWillBeSent(documentRequest('1', 'https://app.test/', 'POST'))
      loadingFinished({ requestId: '1' })
      responseReceived(documentResponse('1', 'https://app.test/', true))

      expect(onEscape).to.be.calledOnceWith({ url: 'https://app.test/', method: 'GET' })
    })

    it('evicts the oldest pause key at the cap instead of growing unbounded', () => {
      const { requestPaused, requestWillBeSent, responseReceived, onEscape } = createDetector()

      requestPaused({ request: { method: 'GET', url: 'https://app.test/first' } })

      for (let i = 0; i < 8192; i++) {
        requestPaused({ request: { method: 'GET', url: `https://app.test/filler-${i}` } })
      }

      requestWillBeSent(documentRequest('1', 'https://app.test/first'))
      responseReceived(documentResponse('1', 'https://app.test/first', true))

      expect(onEscape).to.be.calledOnce
    })
  })
})
