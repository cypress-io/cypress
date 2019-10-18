import '../../spec_helper'
import _ from 'lodash'
import 'chai-as-promised' // for the types!
import chalk from 'chalk'
import { connect } from '@packages/network'
import CRI from 'chrome-remote-interface'
import { expect } from 'chai'
import humanInterval from 'human-interval'
import protocol from '../../../lib/browsers/protocol'
import sinon from 'sinon'
import snapshot from 'snap-shot-it'
import { stripIndents } from 'common-tags'

describe('lib/browsers/protocol', function () {
  context('._getDelayMsForRetry', function () {
    it('retries as expected for up to 5 seconds', function () {
      let delays = []
      let delay: number
      let i = 0

      while ((delay = protocol._getDelayMsForRetry(i))) {
        delays.push(delay)
        i++
      }

      expect(_.sum(delays)).to.eq(humanInterval('5 seconds'))

      snapshot(delays)
    })
  })

  context('.getWsTargetFor', function () {
    it('rejects if CDP connection fails', function () {
      const innerErr = new Error('cdp connection failure')

      sinon.stub(connect, 'createRetryingSocket').callsArgWith(1, innerErr)
      const p = protocol.getWsTargetFor(12345)

      const expectedError = stripIndents`
        Cypress failed to make a connection to the Chrome DevTools Protocol after retrying for 5 seconds.

        This usually indicates there was a problem opening the Chrome browser.

        The CDP port requested was ${chalk.yellow('12345')}.

        Error details:
      `

      return expect(p).to.eventually.be.rejected
      .and.property('message').include(expectedError)
      .and.include(innerErr.message)
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
