const { expect, sinon } = require('../../spec_helper')

import { ProtocolManagerShape } from '@packages/types'
import { CdpAutomation } from '../../../lib/browsers/cdp_automation'

context('lib/browsers/cdp_automation', () => {
  context('.CdpAutomation', () => {
    let cdpAutomation: CdpAutomation

    describe('create', function () {
      it('networkEnabledOptions - protocol enabled', async function () {
        const enabledObject = {
          maxPostDataSize: 64 * 1024,
          maxResourceBufferSize: 0,
          maxTotalBufferSize: 0,
        }
        const localCommand = sinon.stub()
        const localOnFn = sinon.stub()
        const localOffFn = sinon.stub()
        const localSendCloseTargetCommand = sinon.stub()
        const localAutomation = {
          onBrowserPreRequest: sinon.stub(),
          onRequestEvent: sinon.stub(),
        }
        const localManager = {
          protocolEnabled: true,
          networkEnableOptions: enabledObject,
        } as ProtocolManagerShape

        const localNetworkCommandStub = localCommand.withArgs('Network.enable', enabledObject).resolves()

        await CdpAutomation.create(localCommand, localOnFn, localOffFn, localSendCloseTargetCommand, localAutomation as any, localManager)

        expect(localNetworkCommandStub).to.have.been.calledWith('Network.enable', enabledObject)
      })

      it('networkEnabledOptions - protocol disabled', async function () {
        const disabledObject = {
          maxTotalBufferSize: 0,
          maxResourceBufferSize: 0,
          maxPostDataSize: 0,
        }
        const localCommand = sinon.stub()
        const localOnFn = sinon.stub()
        const localOffFn = sinon.stub()
        const localSendCloseTargetCommand = sinon.stub()
        const localAutomation = {
          onBrowserPreRequest: sinon.stub(),
          onRequestEvent: sinon.stub(),
        }
        const localManager = {
          protocolEnabled: false,
          networkEnableOptions: disabledObject,
        } as ProtocolManagerShape

        const localCommandStub = localCommand.withArgs('Network.enable', disabledObject).resolves()

        await CdpAutomation.create(localCommand, localOnFn, localOffFn, localSendCloseTargetCommand, localAutomation as any, localManager)
        await CdpAutomation.create(localCommand, localOnFn, localOffFn, localSendCloseTargetCommand, localAutomation as any)

        expect(localCommandStub).to.have.been.calledTwice
        expect(localCommandStub).to.have.been.calledWithExactly('Network.enable', disabledObject)
      })
    })

    beforeEach(async function () {
      this.sendDebuggerCommand = sinon.stub()
      this.onFn = sinon.stub()
      this.offFn = sinon.stub()

      this.sendCloseTargetCommand = sinon.stub()
      this.automation = {
        onBrowserPreRequest: sinon.stub(),
        onRequestEvent: sinon.stub(),
        onRemoveBrowserPreRequest: sinon.stub(),
        onServiceWorkerRegistrationUpdated: sinon.stub(),
        onServiceWorkerVersionUpdated: sinon.stub(),
      }

      cdpAutomation = await CdpAutomation.create(this.sendDebuggerCommand, this.onFn, this.offFn, this.sendCloseTargetCommand, this.automation)
      this.onRequest = cdpAutomation.onRequest
    })

    describe('.startVideoRecording', function () {
      // https://github.com/cypress-io/cypress/issues/9265
      it('respond ACK after receiving new screenshot frame', async function () {
        const writeVideoFrame = sinon.stub()
        const frameMeta = { data: Buffer.from('foo'), sessionId: '1' }

        this.onFn.withArgs('Page.screencastFrame').callsFake((e, fn) => {
          fn(frameMeta)
        })

        const startScreencast = this.sendDebuggerCommand.withArgs('Page.startScreencast').resolves()
        const screencastFrameAck = this.sendDebuggerCommand.withArgs('Page.screencastFrameAck').resolves()

        await cdpAutomation.startVideoRecording(writeVideoFrame, {})

        expect(startScreencast).to.have.been.calledWith('Page.startScreencast')
        expect(writeVideoFrame).to.have.been.calledWithMatch((arg) => Buffer.isBuffer(arg) && arg.length > 0)
        expect(screencastFrameAck).to.have.been.calledWith('Page.screencastFrameAck', { sessionId: frameMeta.sessionId })
      })
    })

    describe('.onNetworkRequestWillBeSent', function () {
      it('triggers onBrowserPreRequest', function () {
        const browserPreRequest = {
          requestId: '0',
          type: 'other',
          request: {
            method: 'GET',
            url: 'https://www.google.com',
            headers: {},
          },
          wallTime: 100.100100,
        }

        this.onFn
        .withArgs('Network.requestWillBeSent')
        .yield(browserPreRequest)

        const arg = this.automation.onBrowserPreRequest.getCall(0).args[0]

        expect(arg.requestId).to.eq(browserPreRequest.requestId)
        expect(arg.method).to.eq(browserPreRequest.request.method)
        expect(arg.url).to.eq(browserPreRequest.request.url)
        expect(arg.headers).to.eq(browserPreRequest.request.headers)
        expect(arg.resourceType).to.eq(browserPreRequest.type)
        expect(arg.originalResourceType).to.eq(browserPreRequest.type)
        expect(arg.cdpRequestWillBeSentTimestamp).to.be.closeTo(100100.100, 0.001)
        expect(arg.cdpRequestWillBeSentReceivedTimestamp).to.be.a('number')
      })

      it('removes # from a url', function () {
        const browserPreRequest = {
          requestId: '0',
          type: 'other',
          request: {
            method: 'GET',
            url: 'https://www.google.com/foo#',
            headers: {},
          },
          wallTime: 100.100100,
        }

        this.onFn
        .withArgs('Network.requestWillBeSent')
        .yield(browserPreRequest)

        const arg = this.automation.onBrowserPreRequest.getCall(0).args[0]

        expect(arg.requestId).to.eq(browserPreRequest.requestId)
        expect(arg.method).to.eq(browserPreRequest.request.method)
        expect(arg.url).to.eq('https://www.google.com/foo')
        expect(arg.headers).to.eq(browserPreRequest.request.headers)
        expect(arg.resourceType).to.eq(browserPreRequest.type)
        expect(arg.originalResourceType).to.eq(browserPreRequest.type)
        expect(arg.cdpRequestWillBeSentTimestamp).to.be.closeTo(100100.100, 0.001)
        expect(arg.cdpRequestWillBeSentReceivedTimestamp).to.be.a('number')
      })

      it('ignore events with data urls', function () {
        this.onFn
        .withArgs('Network.requestWillBeSent')
        .yield({ requestId: '0', request: { url: 'data:font;base64' } })

        expect(this.automation.onBrowserPreRequest).to.not.be.called
        expect(cdpAutomation['cachedDataUrlRequestIds'].has('0')).to.be.true
        expect(cdpAutomation['cachedDataUrlRequestIds']).to.have.property('size', 1)
      })
    })

    describe('.onResponseReceived', function () {
      it('triggers onRequestEvent', function () {
        const browserResponseReceived = {
          requestId: '0',
          response: {
            status: 200,
            headers: {},
          },
        }

        this.onFn
        .withArgs('Network.responseReceived')
        .yield(browserResponseReceived)

        expect(this.automation.onRequestEvent).to.have.been.calledWith(
          'response:received', {
            requestId: browserResponseReceived.requestId,
            status: browserResponseReceived.response.status,
            headers: browserResponseReceived.response.headers,
          },
        )
      })

      it('triggers onRequestEvent when response is cached from service worker but data length is > 0', function () {
        const browserResponseReceived = {
          requestId: '0',
          response: {
            status: 200,
            headers: {},
            fromServiceWorker: true,
            encodedDataLength: 1,
          },
        }

        this.onFn
        .withArgs('Network.responseReceived')
        .yield(browserResponseReceived)

        expect(this.automation.onRequestEvent).to.have.been.calledWith(
          'response:received', {
            requestId: browserResponseReceived.requestId,
            status: browserResponseReceived.response.status,
            headers: browserResponseReceived.response.headers,
          },
        )
      })

      it('cleans up prerequests when response is cached from disk', function () {
        const browserResponseReceived = {
          requestId: '0',
          response: {
            status: 200,
            headers: {},
            fromDiskCache: true,
          },
        }

        this.onFn
        .withArgs('Network.responseReceived')
        .yield(browserResponseReceived)

        expect(this.automation.onRequestEvent).not.to.have.been.called
      })

      it('cleans up prerequests when response is cached from service worker and data length is <= 0', function () {
        const browserResponseReceived = {
          requestId: '0',
          response: {
            status: 200,
            headers: {},
            fromServiceWorker: true,
            encodedDataLength: -1,
          },
        }

        this.onFn
        .withArgs('Network.responseReceived')
        .yield(browserResponseReceived)

        expect(this.automation.onRequestEvent).not.to.have.been.called
      })
    })

    describe('.onRequestServedFromCache', function () {
      it('triggers onRemoveBrowserPreRequest', function () {
        const browserRequestServedFromCache = {
          requestId: '0',
        }

        this.onFn
        .withArgs('Network.requestServedFromCache')
        .yield(browserRequestServedFromCache)

        expect(this.automation.onRemoveBrowserPreRequest).to.have.been.calledWith(browserRequestServedFromCache.requestId)
      })

      it('ignores cached data url request ids', function () {
        this.onFn
        .withArgs('Network.requestWillBeSent')
        .yield({ requestId: '0', request: { url: 'data:font;base64' } })

        expect(cdpAutomation['cachedDataUrlRequestIds'].has('0')).to.be.true
        expect(cdpAutomation['cachedDataUrlRequestIds']).to.have.property('size', 1)

        this.onFn
        .withArgs('Network.requestServedFromCache')
        .yield({ requestId: '0' })

        expect(this.automation.onRemoveBrowserPreRequest).to.not.have.been.called
        expect(cdpAutomation['cachedDataUrlRequestIds'].has('0')).to.be.false
        expect(cdpAutomation['cachedDataUrlRequestIds']).to.have.property('size', 0)
      })
    })

    describe('.onRequestFailed', function () {
      it('triggers onRemoveBrowserPreRequest', function () {
        const browserRequestFailed = {
          requestId: '0',
        }

        this.onFn
        .withArgs('Network.loadingFailed')
        .yield(browserRequestFailed)

        expect(this.automation.onRemoveBrowserPreRequest).to.have.been.calledWith(browserRequestFailed.requestId)
      })
    })

    describe('.onWorkerRegistrationUpdated', function () {
      it('triggers onServiceWorkerRegistrationUpdated', function () {
        const browserWorkerRegistrationUpdated = {
          registrations: [{
            registrationId: '0',
            scopeURL: 'https://www.google.com',
          }],
        }

        this.onFn
        .withArgs('ServiceWorker.workerRegistrationUpdated')
        .yield(browserWorkerRegistrationUpdated)

        expect(this.automation.onServiceWorkerRegistrationUpdated).to.have.been.calledWith(browserWorkerRegistrationUpdated)
      })
    })

    describe('.onWorkerVersionUpdated', function () {
      it('triggers onServiceWorkerVersionUpdated', function () {
        const browserWorkerVersionUpdated = {
          versions: [{
            registrationId: '0',
            versionId: '1',
            scriptURL: 'https://www.google.com',
          }],
        }

        this.onFn
        .withArgs('ServiceWorker.workerVersionUpdated')
        .yield(browserWorkerVersionUpdated)

        expect(this.automation.onServiceWorkerVersionUpdated).to.have.been.calledWith(browserWorkerVersionUpdated)
      })
    })

    describe('get:cookies', () => {
      beforeEach(function () {
        this.sendDebuggerCommand.withArgs('Network.getAllCookies')
        .resolves({
          cookies: [
            { name: 'foo', value: 'f', path: '/', domain: 'localhost', secure: true, httpOnly: true, expires: 123 },
            { name: 'bar', value: 'b', path: '/', domain: 'localhost', secure: false, httpOnly: false, expires: 456 },
            { name: 'qux', value: 'q', path: '/', domain: 'foobar.com', secure: false, httpOnly: false, expires: 789 },
          ],
        })
      })

      it('returns cookies that match filter', function () {
        return this.onRequest('get:cookies', { domain: 'localhost' })
        .then((resp) => {
          expect(resp).to.deep.eq([
            { name: 'foo', value: 'f', path: '/', domain: 'localhost', secure: true, httpOnly: true, expirationDate: 123, sameSite: undefined },
            { name: 'bar', value: 'b', path: '/', domain: 'localhost', secure: false, httpOnly: false, expirationDate: 456, sameSite: undefined },
          ])
        })
      })

      it('returns all cookies if there is no filter', function () {
        return this.onRequest('get:cookies', {})
        .then((resp) => {
          expect(resp).to.deep.eq([
            { name: 'foo', value: 'f', path: '/', domain: 'localhost', secure: true, httpOnly: true, expirationDate: 123, sameSite: undefined },
            { name: 'bar', value: 'b', path: '/', domain: 'localhost', secure: false, httpOnly: false, expirationDate: 456, sameSite: undefined },
            { name: 'qux', value: 'q', path: '/', domain: 'foobar.com', secure: false, hostOnly: true, httpOnly: false, expirationDate: 789, sameSite: undefined },
          ])
        })
      })
    })

    describe('get:cookie', () => {
      beforeEach(function () {
        this.sendDebuggerCommand.withArgs('Network.getAllCookies')
        .resolves({
          cookies: [
            { name: 'session', value: 'key', path: '/login', domain: 'google.com', secure: true, httpOnly: true, expires: 123 },
          ],
        })
      })

      it('returns a specific cookie by name', function () {
        return this.onRequest('get:cookie', { domain: 'google.com', name: 'session' })
        .then((resp) => {
          expect(resp).to.deep.eq({ name: 'session', value: 'key', path: '/login', domain: 'google.com', secure: true, httpOnly: true, expirationDate: 123, sameSite: undefined, hostOnly: true })
        })
      })

      it('returns null when no cookie by name is found', function () {
        return this.onRequest('get:cookie', { domain: 'google.com', name: 'doesNotExist' })
        .then((resp) => {
          expect(resp).to.be.null
        })
      })
    })

    describe('set:cookie', () => {
      beforeEach(function () {
        this.sendDebuggerCommand.withArgs('Network.setCookie', { domain: '.google.com', name: 'session', value: 'key', path: '/' })
        .resolves({ success: true })
        .withArgs('Network.setCookie', { domain: 'foo', path: '/bar', name: '', value: '' })
        .rejects(new Error('some error'))
        .withArgs('Network.getAllCookies')
        .resolves({
          cookies: [
            { name: 'session', value: 'key', path: '/', domain: '.google.com', secure: false, httpOnly: false },
          ],
        })
      })

      it('resolves with the cookie props', function () {
        return this.onRequest('set:cookie', { domain: 'google.com', name: 'session', value: 'key', path: '/' })
        .then((resp) => {
          expect(resp).to.deep.eq({ domain: '.google.com', expirationDate: undefined, httpOnly: false, name: 'session', value: 'key', path: '/', secure: false, sameSite: undefined })
        })
      })

      it('resolves with the cookie props (host only)', function () {
        this.sendDebuggerCommand
        .withArgs('Network.setCookie', { domain: 'google.com', name: 'session', value: 'key', path: '/' })
        .resolves({ success: true })
        .withArgs('Network.getAllCookies')
        .resolves({
          cookies: [
            { name: 'session', value: 'key', path: '/', domain: 'google.com', secure: false, httpOnly: false },
          ],
        })

        return this.onRequest('set:cookie', { domain: 'google.com', name: 'session', value: 'key', path: '/', hostOnly: true })
        .then((resp) => {
          expect(resp).to.deep.eq({ domain: 'google.com', expirationDate: undefined, hostOnly: true, httpOnly: false, name: 'session', value: 'key', path: '/', secure: false, sameSite: undefined })
        })
      })

      it('rejects with error', function () {
        return this.onRequest('set:cookie', { domain: 'foo', path: '/bar' })
        .then(() => {
          throw new Error('should have failed')
        }).catch((err) => {
          expect(err.message).to.eq('some error')
        })
      })
    })

    describe('clear:cookie', () => {
      beforeEach(function () {
        this.sendDebuggerCommand.withArgs('Network.getAllCookies')
        .resolves({
          cookies: [
            { name: 'session', value: 'key', path: '/', domain: 'google.com', secure: true, httpOnly: true, expires: 123 },
            { name: 'shouldThrow', value: 'key', path: '/assets', domain: 'cdn.github.com', secure: false, httpOnly: true, expires: 123 },
          ],
        })

        return this.sendDebuggerCommand.withArgs('Network.deleteCookies', { domain: 'cdn.github.com', name: 'shouldThrow' })
        .rejects(new Error('some error'))
        .withArgs('Network.deleteCookies')
        .resolves()
      })

      it('resolves single removed cookie', function () {
        return this.onRequest('clear:cookie', { domain: 'google.com', name: 'session' })
        .then((resp) => {
          expect(resp).to.deep.eq(
            { name: 'session', value: 'key', path: '/', domain: 'google.com', secure: true, httpOnly: true, expirationDate: 123, sameSite: undefined, hostOnly: true },
          )
        })
      })

      it('returns null when no cookie by name is found', function () {
        return this.onRequest('clear:cookie', { domain: 'google.com', name: 'doesNotExist' })
        .then((resp) => {
          expect(resp).to.be.null
        })
      })

      it('rejects with error', function () {
        return this.onRequest('clear:cookie', { domain: 'cdn.github.com', name: 'shouldThrow' })
        .then(() => {
          throw new Error('should have failed')
        }).catch((err) => {
          expect(err.message).to.eq('some error')
        })
      })
    })

    describe('take:screenshot', () => {
      beforeEach(function () {
        this.sendDebuggerCommand.withArgs('Browser.getVersion').resolves({ protocolVersion: '1.3' })
      })

      describe('when tab focus behavior default (disabled)', function () {
        it('resolves with base64 data URL', function () {
          this.sendDebuggerCommand.withArgs('Page.captureScreenshot').resolves({ data: 'foo' })

          return expect(this.onRequest('take:screenshot'))
          .to.eventually.equal('data:image/png;base64,foo')
        })

        it('rejects nicely if Page.captureScreenshot fails', function () {
          this.sendDebuggerCommand.withArgs('Page.captureScreenshot').rejects()

          return expect(this.onRequest('take:screenshot'))
          .to.be.rejectedWith('The browser responded with an error when Cypress attempted to take a screenshot.')
        })
      })

      describe('when tab focus behavior is enabled', function () {
        let requireTabFocus
        let isHeadless

        beforeEach(() => {
          requireTabFocus = true
        })

        describe('when headless', () => {
          beforeEach(() => {
            isHeadless = true
          })

          it('does not try to comm with extension, simply brings page to front', async function () {
            cdpAutomation = await CdpAutomation.create(this.sendDebuggerCommand, this.onFn, this.offFn, this.sendCloseTargetCommand, this.automation, undefined, requireTabFocus, isHeadless)
            this.sendDebuggerCommand.withArgs('Page.captureScreenshot').resolves({ data: 'foo' })

            expect(cdpAutomation.onRequest('take:screenshot', undefined)).to.eventually.equal('data:image/png;base64,foo')
            expect(this.sendDebuggerCommand).not.to.be.calledWith('Runtime.evaluate')
            expect(this.sendDebuggerCommand).to.be.calledWith('Page.bringToFront')
          })
        })

        describe('when not headless', () => {
          beforeEach(async function () {
            isHeadless = false
            cdpAutomation = await CdpAutomation.create(this.sendDebuggerCommand, this.onFn, this.offFn, this.sendCloseTargetCommand, this.automation, undefined, requireTabFocus, isHeadless)
            this.sendDebuggerCommand.withArgs('Page.captureScreenshot').resolves({ data: 'foo' })
          })

          describe('and the extension activates the tab', function () {
            beforeEach(function () {
              this.sendDebuggerCommand.withArgs('Runtime.evaluate').resolves()
              this.sendDebuggerCommand.withArgs('Page.captureScreenshot').resolves({ data: 'foo' })
            })

            it('captures the screenshot', function () {
              expect(cdpAutomation.onRequest('take:screenshot', undefined)).to.eventually.equal('data:image/png;base64,foo')
            })
          })

          describe('and the extension fails to activate the tab', function () {
            beforeEach(function () {
              this.sendDebuggerCommand.withArgs('Runtime.evaluate').rejects(new Error('Unable to communicate with Cypress Extension'))
              this.sendDebuggerCommand.withArgs('Page.bringToFront').resolves()
            })

            it('captures the screenshot', function () {
              expect(cdpAutomation.onRequest('take:screenshot', undefined)).to.eventually.equal('data:image/png;base64,foo')
            })
          })
        })
      })
    })

    describe('reset:browser:state', function () {
      it('sends Storage.clearDataForOrigin and Network.clearBrowserCache', async function () {
        this.sendDebuggerCommand.withArgs('Storage.clearDataForOrigin', { origin: '*', storageTypes: 'all' }).resolves()
        this.sendDebuggerCommand.withArgs('Network.clearBrowserCache').resolves()

        await this.onRequest('reset:browser:state')

        expect(this.sendDebuggerCommand).to.be.calledWith('Storage.clearDataForOrigin', { origin: '*', storageTypes: 'all' })
        expect(this.sendDebuggerCommand).to.be.calledWith('Network.clearBrowserCache')
      })
    })

    describe('reset:browser:tabs:for:next:spec', function () {
      it('sends the close target message for the attached target tabs', async function () {
        this.sendCloseTargetCommand.resolves()

        await this.onRequest('reset:browser:tabs:for:next:spec', { shouldKeepTabOpen: true })

        expect(this.sendCloseTargetCommand).to.be.calledWith(true)
      })
    })

    describe('focus:browser:window', function () {
      it('sends Page.bringToFront when focus is requested', function () {
        this.sendDebuggerCommand.withArgs('Page.bringToFront').resolves()

        return this.onRequest('focus:browser:window').then((resp) => expect(resp).to.be.undefined)
      })
    })

    describe('get:heap:size:limit', function () {
      it('sends Runtime.evaluate to request the performance.memory.jsHeapSizeLimit', async function () {
        this.sendDebuggerCommand.withArgs('Runtime.evaluate', { expression: 'performance.memory.jsHeapSizeLimit' }).resolves()

        return this.onRequest('get:heap:size:limit').then((resp) => expect(resp).to.be.undefined)
      })
    })

    describe('collect:garbage', function () {
      it('sends HeapProfiler.collectGarbage when garbage collection is requested', async function () {
        this.sendDebuggerCommand.withArgs('HeapProfiler.collectGarbage').resolves()

        return this.onRequest('collect:garbage').then((resp) => expect(resp).to.be.undefined)
      })
    })
  })
})
