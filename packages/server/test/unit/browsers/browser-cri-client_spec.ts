import { BrowserCriClient } from '../../../lib/browsers/browser-cri-client'
import * as CriClient from '../../../lib/browsers/cri-client'
import { expect, proxyquire, sinon } from '../../spec_helper'
import * as protocol from '../../../lib/browsers/protocol'
import { stripAnsi } from '@packages/errors'

const HOST = '127.0.0.1'
const PORT = 50505
const THROWS_PORT = 66666

describe('lib/browsers/cri-client', function () {
  let testBrowserCriClient: {
    BrowserCriClient: {
      attachToBrowserAndTargetUrl: typeof BrowserCriClient.attachToBrowserAndTargetUrl
    }
  }
  let send: sinon.SinonStub
  let close: sinon.SinonStub
  let criClientCreateStub: sinon.SinonStub
  let criImport: sinon.SinonStub & {
    Version: sinon.SinonStub
  }
  let onError: sinon.SinonStub
  let getClient: () => ReturnType<typeof BrowserCriClient.attachToBrowserAndTargetUrl>

  beforeEach(function () {
    sinon.stub(protocol, '_connectAsync')

    criImport = sinon.stub()

    criImport.Version = sinon.stub()
    criImport.Version.withArgs({ host: HOST, port: PORT }).resolves({ webSocketDebuggerUrl: 'http://web/socket/url' })
    criImport.Version.withArgs({ host: HOST, port: THROWS_PORT })
    .onFirstCall().throws()
    .onSecondCall().throws()
    .onThirdCall().resolves({ webSocketDebuggerUrl: 'http://web/socket/url' })

    send = sinon.stub()
    close = sinon.stub()
    criClientCreateStub = sinon.stub(CriClient, 'create').withArgs('http://web/socket/url', onError).resolves({
      send,
      close,
    })

    testBrowserCriClient = proxyquire('../lib/browsers/browser-cri-client', {
      'chrome-remote-interface': criImport,
    })

    const mockPageClient = {}

    send.withArgs('Target.getTargets').resolves({ targetInfos: [{ targetId: '1', url: 'about:blank' }] })
    criClientCreateStub.withArgs('1', onError, HOST, PORT).resolves(mockPageClient)

    getClient = () => testBrowserCriClient.BrowserCriClient.attachToBrowserAndTargetUrl(PORT, 'Chrome', 'about:blank', onError)
  })

  context('.attachToBrowserAndTargetUrl', function () {
    it('returns an instance of the Browser CRI client', async function () {
      const { browserCriClient } = await getClient()

      expect(browserCriClient.attachToNewUrl).to.be.instanceOf(Function)
    })

    it('throws an error when _connectAsync fails', async function () {
      (protocol._connectAsync as any).restore()
      sinon.stub(protocol, '_connectAsync').throws()

      await expect(getClient()).to.be.rejected
    })

    it('retries when Version fails', async function () {
      sinon.stub(protocol, '_getDelayMsForRetry')
      .onFirstCall().returns(100)
      .onSecondCall().returns(100)
      .onThirdCall().returns(100)

      const { browserCriClient } = await testBrowserCriClient.BrowserCriClient.attachToBrowserAndTargetUrl(THROWS_PORT, 'Chrome', 'about:blank', onError)

      expect(browserCriClient.attachToNewUrl).to.be.instanceOf(Function)

      expect(criImport.Version).to.be.calledThrice
    })

    it('throws when Version fails more than allowed', async function () {
      sinon.stub(protocol, '_getDelayMsForRetry')
      .onFirstCall().returns(100)
      .onSecondCall().returns(undefined)

      await expect(testBrowserCriClient.BrowserCriClient.attachToBrowserAndTargetUrl(THROWS_PORT, 'Chrome', 'about:blank', onError)).to.be.rejected

      expect(criImport.Version).to.be.calledTwice
    })

    context('#ensureMinimumProtocolVersion', function () {
      function withProtocolVersion (actual, test) {
        return getClient()
        .then((attachedBrowserAndPage: any) => {
          attachedBrowserAndPage.browserCriClient.versionInfo = { 'Protocol-Version': actual }

          return attachedBrowserAndPage.browserCriClient.ensureMinimumProtocolVersion(test)
        })
      }

      it('resolves if protocolVersion = current', function () {
        return expect(withProtocolVersion('1.3', '1.3')).to.be.fulfilled
      })

      it('resolves if protocolVersion > current', function () {
        return expect(withProtocolVersion('1.4', '1.3')).to.be.fulfilled
      })

      it('rejects if protocolVersion < current', function () {
        return expect(withProtocolVersion('1.2', '1.3')).to.be
        .rejected.then((err) => {
          expect(stripAnsi(err.message)).to.eq(`A minimum CDP version of 1.3 is required, but the current browser has 1.2.`)
        })
      })
    })

    context('#attachToNewUrl', function () {
      it('creates new target and creates a page client with the passed in url', async function () {
        const mockPageClient = {}

        send.withArgs('Target.createTarget', { url: 'http://foo.com' }).resolves({ targetId: '10' })
        criClientCreateStub.withArgs('10', onError, HOST, PORT).resolves(mockPageClient)

        const { browserCriClient } = await getClient()

        const client = await browserCriClient.attachToNewUrl('http://foo.com')

        expect(client).to.be.equal(mockPageClient)
      })
    })

    context('#closeCurrentTarget', function () {
      it('closes the currently attached target', async function () {
        const mockCurrentlyAttachedTarget = {
          targetId: '100',
          close: sinon.stub().resolves(sinon.stub().resolves()),
        }

        send.withArgs('Target.closeTarget', { targetId: '100' }).resolves()

        const { browserCriClient } = await getClient() as any

        browserCriClient.currentlyAttachedTarget = mockCurrentlyAttachedTarget

        await browserCriClient.closeCurrentTarget()

        expect(mockCurrentlyAttachedTarget.close).to.be.called
      })

      it('throws when there is no currently attached target', async function () {
        const { browserCriClient } = await getClient() as any

        await expect(browserCriClient.closeCurrentTarget()).to.be.rejected
      })
    })

    context('#close', function () {
      it('closes the currently attached target if it exists and the browser client', async function () {
        const mockCurrentlyAttachedTarget = {
          close: sinon.stub().resolves(),
        }

        const { browserCriClient } = await getClient() as any

        browserCriClient.currentlyAttachedTarget = mockCurrentlyAttachedTarget

        await browserCriClient.close()

        expect(mockCurrentlyAttachedTarget.close).to.be.called
        expect(close).to.be.called
      })

      it('just the browser client with no currently attached target', async function () {
        const { browserCriClient } = await getClient() as any

        browserCriClient.currentlyAttachedTarget = undefined

        await browserCriClient.close()

        expect(close).to.be.called
      })
    })
  })
})
