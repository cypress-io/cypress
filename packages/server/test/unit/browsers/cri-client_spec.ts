import Bluebird from 'bluebird'
import { create } from '../../../lib/browsers/cri-client'

const { expect, proxyquire, sinon } = require('../../spec_helper')

const DEBUGGER_URL = 'http://foo'

describe('lib/browsers/cri-client', function () {
  let criClient: {
    create: typeof create
  }
  let send: sinon.SinonStub
  let criImport: sinon.SinonStub

  function getClient () {
    return criClient.create(DEBUGGER_URL)
  }

  beforeEach(function () {
    sinon.stub(Bluebird, 'promisify').returnsArg(0)

    send = sinon.stub()

    criImport = sinon.stub()
    .withArgs({
      target: DEBUGGER_URL,
      local: true,
    })
    .resolves({ send })

    criClient = proxyquire('../lib/browsers/cri-client', {
      'chrome-remote-interface': criImport,
    })
  })

  context('.create', function () {
    it('returns an instance of the CRI client', async function () {
      const client = await getClient()

      expect(client.send).to.be.instanceOf(Function)
    })

    context('#send', function () {
      it('calls cri.send with command and data', async function () {
        send.resolves()
        const client = await getClient()

        client.send('Browser.getVersion', { baz: 'quux' })
        expect(send).to.be.calledWith('Browser.getVersion', { baz: 'quux' })
      })
    })

    context('#ensureMinimumProtocolVersion', function () {
      function withProtocolVersion (actual, test) {
        if (actual) {
          send.withArgs('Browser.getVersion')
          .resolves({ protocolVersion: actual })
        }

        return getClient()
        .then((client) => {
          return client.ensureMinimumProtocolVersion(test)
        })
      }

      it('resolves if protocolVersion = current', function () {
        return expect(withProtocolVersion('1.3', '1.3')).to.be.fulfilled
      })

      it('resolves if protocolVersion > current', function () {
        return expect(withProtocolVersion('1.4', '1.3')).to.be.fulfilled
      })

      it('rejects if Browser.getVersion not supported yet', function () {
        send.withArgs('Browser.getVersion')
        .rejects()

        return expect(withProtocolVersion(null, '1.3')).to.be
        .rejectedWith('A minimum CDP version of v1.3 is required, but the current browser has an older version.')
      })

      it('rejects if protocolVersion < current', function () {
        return expect(withProtocolVersion('1.2', '1.3')).to.be
        .rejectedWith('A minimum CDP version of v1.3 is required, but the current browser has v1.2.')
      })
    })
  })
})
