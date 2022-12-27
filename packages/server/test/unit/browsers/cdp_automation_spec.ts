const { expect, sinon } = require('../../spec_helper')

import { CdpAutomation } from '../../../lib/browsers/cdp_automation'

context('lib/browsers/cdp_automation', () => {
  context('.CdpAutomation', () => {
    let cdpAutomation: CdpAutomation

    beforeEach(async function () {
      this.sendDebuggerCommand = sinon.stub()
      this.onFn = sinon.stub()
      this.sendCloseTargetCommand = sinon.stub()
      this.automation = {
        onBrowserPreRequest: sinon.stub(),
        onRequestEvent: sinon.stub(),
      }

      cdpAutomation = await CdpAutomation.create(this.sendDebuggerCommand, this.onFn, this.sendCloseTargetCommand, this.automation, false)

      this.sendDebuggerCommand
      .throws(new Error('not stubbed'))
      .withArgs('Browser.getVersion')
      .resolves()

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

        await cdpAutomation.startVideoRecording(writeVideoFrame)

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
        }

        this.onFn
        .withArgs('Network.requestWillBeSent')
        .yield(browserPreRequest)

        expect(this.automation.onBrowserPreRequest).to.have.been.calledWith({
          requestId: browserPreRequest.requestId,
          method: browserPreRequest.request.method,
          url: browserPreRequest.request.url,
          headers: browserPreRequest.request.headers,
          resourceType: browserPreRequest.type,
          originalResourceType: browserPreRequest.type,
        })
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
        }

        this.onFn
        .withArgs('Network.requestWillBeSent')
        .yield(browserPreRequest)

        expect(this.automation.onBrowserPreRequest).to.have.been.calledWith({
          requestId: browserPreRequest.requestId,
          method: browserPreRequest.request.method,
          url: 'https://www.google.com/foo', // we only care about the url
          headers: browserPreRequest.request.headers,
          resourceType: browserPreRequest.type,
          originalResourceType: browserPreRequest.type,
        })
      })

      it('ignore events with data urls', function () {
        this.onFn
        .withArgs('Network.requestWillBeSent')
        .yield({ request: { url: 'data:font;base64' } })

        expect(this.automation.onBrowserPreRequest).to.not.be.called
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
      it('resolves with base64 data URL', function () {
        this.sendDebuggerCommand.withArgs('Browser.getVersion').resolves({ protocolVersion: '1.3' })
        this.sendDebuggerCommand.withArgs('Page.captureScreenshot').resolves({ data: 'foo' })

        return expect(this.onRequest('take:screenshot'))
        .to.eventually.equal('data:image/png;base64,foo')
      })

      it('rejects nicely if Page.captureScreenshot fails', function () {
        this.sendDebuggerCommand.withArgs('Browser.getVersion').resolves({ protocolVersion: '1.3' })
        this.sendDebuggerCommand.withArgs('Page.captureScreenshot').rejects()

        return expect(this.onRequest('take:screenshot'))
        .to.be.rejectedWith('The browser responded with an error when Cypress attempted to take a screenshot.')
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

    describe('reset:browser:tabs:for:next:test', function () {
      it('sends the close target message for the attached target tabs', async function () {
        this.sendCloseTargetCommand.resolves()

        await this.onRequest('reset:browser:tabs:for:next:test', { shouldKeepTabOpen: true })

        expect(this.sendCloseTargetCommand).to.be.calledWith(true)
      })
    })

    describe('focus:browser:window', function () {
      it('sends Page.bringToFront when focus is requested', function () {
        this.sendDebuggerCommand.withArgs('Page.bringToFront').resolves()

        return this.onRequest('focus:browser:window').then((resp) => expect(resp).to.be.undefined)
      })
    })
  })
})
