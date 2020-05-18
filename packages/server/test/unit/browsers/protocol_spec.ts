import '../../spec_helper'
import _ from 'lodash'
import Bluebird from 'bluebird'
import 'chai-as-promised' // for the types!
import chalk from 'chalk'
import { connect } from '@packages/network'
import CRI from 'chrome-remote-interface'
import { expect } from 'chai'
import humanInterval from 'human-interval'
import * as protocol from '../../../lib/browsers/protocol'
import sinon from 'sinon'
import snapshot from 'snap-shot-it'
import stripAnsi from 'strip-ansi'
import { stripIndents } from 'common-tags'

describe('lib/browsers/protocol', () => {
  // protocol connects explicitly to this host
  const host = '127.0.0.1'

  context('._getDelayMsForRetry', () => {
    it('retries as expected for up to 50 seconds', () => {
      const log = sinon.spy(console, 'log')

      let delays = []
      let delay: number
      let i = 0

      while ((delay = protocol._getDelayMsForRetry(i))) {
        delays.push(delay)
        i++
      }

      expect(_.sum(delays)).to.eq(humanInterval('50 seconds'))

      log.getCalls().forEach((log, i) => {
        const line = stripAnsi(log.args[0])

        expect(line).to.include(`Failed to connect to Chrome, retrying in 1 second (attempt ${i + 18}/62)`)
      })

      snapshot(delays)
    })
  })

  context('.getWsTargetFor', () => {
    const expectedCdpFailedError = stripIndents`
      Cypress failed to make a connection to the Chrome DevTools Protocol after retrying for 50 seconds.

      This usually indicates there was a problem opening the Chrome browser.

      The CDP port requested was ${chalk.yellow('12345')}.

      Error details:
    `

    it('rejects if CDP connection fails', () => {
      const innerErr = new Error('cdp connection failure')

      sinon.stub(connect, 'createRetryingSocket').callsArgWith(1, innerErr)
      const p = protocol.getWsTargetFor(12345)

      return expect(p).to.eventually.be.rejected
      .and.property('message').include(expectedCdpFailedError)
      .and.include(innerErr.message)
    })

    it('rejects if CRI.List fails', () => {
      const innerErr = new Error('cdp connection failure')

      sinon.stub(Bluebird, 'delay').resolves()

      sinon.stub(CRI, 'List')
      .withArgs({ host, port: 12345, getDelayMsForRetry: sinon.match.func })
      .rejects(innerErr)

      const end = sinon.stub()

      sinon.stub(connect, 'createRetryingSocket').callsArgWith(1, null, { end })

      const p = protocol.getWsTargetFor(12345)

      return expect(p).to.eventually.be.rejected
      .and.property('message').include(expectedCdpFailedError)
      .and.include(innerErr.message)
    })

    it('returns the debugger URL of the first about:blank tab', async () => {
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

      const end = sinon.stub()

      sinon.stub(CRI, 'List')
      .withArgs({ host, port: 12345, getDelayMsForRetry: sinon.match.func })
      .resolves(targets)

      sinon.stub(connect, 'createRetryingSocket').callsArgWith(1, null, { end })

      const p = protocol.getWsTargetFor(12345)

      await expect(p).to.eventually.equal('bar')
      expect(end).to.be.calledOnce
    })
  })

  context('CRI.List', () => {
    const port = 1234
    const targets = [
      {
        type: 'page',
        url: 'chrome://newtab',
        webSocketDebuggerUrl: 'foo',
      },
      {
        type: 'page',
        url: 'about:blank',
        webSocketDebuggerUrl: 'ws://debug-url',
      },
    ]

    it('retries several times if starting page cannot be found', async () => {
      const end = sinon.stub()

      sinon.stub(connect, 'createRetryingSocket').callsArgWith(1, null, { end })

      const criList = sinon.stub(CRI, 'List')
      .withArgs({ host, port, getDelayMsForRetry: sinon.match.func }).resolves(targets)
      .onFirstCall().resolves([])
      .onSecondCall().resolves([])
      .onThirdCall().resolves(targets)

      const targetUrl = await protocol.getWsTargetFor(port)

      expect(criList).to.have.been.calledThrice
      expect(targetUrl).to.equal('ws://debug-url')
    })

    it('logs correctly if retries occur while connecting to CDP and while listing CRI targets', async () => {
      const log = sinon.spy(console, 'log')

      const end = sinon.stub()

      // fail 20 times to get 2 log lines from connect failures
      sinon.stub(connect, 'createRetryingSocket').callsFake((opts, cb) => {
        _.times(20, (i) => {
          opts.getDelayMsForRetry(i, new Error)
        })

        // @ts-ignore
        return cb(null, { end })
      })

      sinon.stub(Bluebird, 'delay').resolves()

      // fail an additional 2 times on CRI.List
      const criList = sinon.stub(CRI, 'List')
      .withArgs({ host, port, getDelayMsForRetry: sinon.match.func }).resolves(targets)
      .onFirstCall().resolves([])
      .onSecondCall().resolves([])
      .onThirdCall().resolves(targets)

      const targetUrl = await protocol.getWsTargetFor(port)

      expect(criList).to.have.been.calledThrice
      expect(targetUrl).to.equal('ws://debug-url')

      // 2 from connect failing, 2 from CRI.List failing
      expect(log).to.have.callCount(4)

      log.getCalls().forEach((log, i) => {
        const line = stripAnsi(log.args[0])

        expect(line).to.include(`Failed to connect to Chrome, retrying in 1 second (attempt ${i + 18}/62)`)
      })
    })
  })
})
