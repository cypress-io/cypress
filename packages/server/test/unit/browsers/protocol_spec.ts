import '../../spec_helper'
import { connect } from '@packages/network'
import CRI from 'chrome-remote-interface'
import { expect } from 'chai'
import protocol from '../../../lib/browsers/protocol'
import sinon from 'sinon'
import snapshot from 'snap-shot-it'

describe('lib/browsers/protocol', function () {
  context('._getDelayMsForRetry', function () {
    it('retries as expected', function () {
      let delays = []
      let delay : number
      let i = 0

      while ((delay = protocol._getDelayMsForRetry(i))) {
        delays.push(delay)
        i++
      }

      snapshot(delays)
    })
  })

  context('.getWsTargetFor', function () {
    it('rejects if CDP connection fails', function () {
      sinon.stub(connect, 'createRetryingSocket').callsArgWith(1, new Error('cdp connection failure'))
      const p = protocol.getWsTargetFor(12345)

      return expect(p).to.eventually.be.rejected
    })

    it('returns the debugger URL of the first about:blank tab', function () {
      const targets = [
        {
          type: 'page',
          url: 'chrome://newtab',
          webSocketDebuggerUrl: 'foo',
        },
        {
          type: 'page',
          url: 'about:blank',
          webSocketDebuggerUrl: 'bar',
        },
      ]

      sinon.stub(CRI, 'List').withArgs({ port: 12345 }).resolves(targets)
      sinon.stub(connect, 'createRetryingSocket').callsArg(1)

      const p = protocol.getWsTargetFor(12345)

      return expect(p).to.eventually.equal('bar')
    })
  })
})
