import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import * as XhrServer from '../../lib/xhr_ws_server'

chai.use(chaiAsPromised)

describe('lib/xhr_ws_server', function () {
  context('#create', function () {
    let xhrServer

    beforeEach(function () {
      xhrServer = XhrServer.create()
    })

    it('resolves a response when incomingXhr is received before request', function () {
      xhrServer.onIncomingXhr('foo', 'bar')
      expect(xhrServer.getDeferredResponse('foo')).to.eq('bar')
    })

    it('resolves a response when incomingXhr is received after request', async function () {
      const p = xhrServer.getDeferredResponse('foo')
      const q = xhrServer.getDeferredResponse('foo')

      xhrServer.onIncomingXhr('foo', 'bar')

      await expect(p).to.eventually.deep.eq('bar')
      await expect(q).to.eventually.deep.eq('bar')
    })

    it('rejects a response when incomingXhr is received and test gets reset', function () {
      const p = xhrServer.getDeferredResponse('foo')

      xhrServer.reset()

      return expect(p).to.be.rejectedWith('This stubbed XHR was pending')
    })
  })
})
