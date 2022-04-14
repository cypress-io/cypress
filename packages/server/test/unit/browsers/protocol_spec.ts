import '../../spec_helper'
import 'chai-as-promised' // for the types!
import { expect } from 'chai'
import humanInterval from 'human-interval'
import _ from 'lodash'
import sinon from 'sinon'
import snapshot from 'snap-shot-it'
import stripAnsi from 'strip-ansi'
import { connect } from '@packages/network'
import * as protocol from '../../../lib/browsers/protocol'

describe('lib/browsers/protocol', () => {
  context('._getDelayMsForRetry', () => {
    it('retries as expected for up to 50 seconds', () => {
      const log = sinon.spy(console, 'log')

      let delays = []
      let delay: number
      let i = 0

      while ((delay = protocol._getDelayMsForRetry(i, 'foobrowser'))) {
        delays.push(delay)
        i++
      }

      expect(_.sum(delays)).to.eq(humanInterval('50 seconds'))

      log.getCalls().forEach((log, i) => {
        const line = stripAnsi(log.args[0])

        expect(line).to.include(`Still waiting to connect to Foobrowser, retrying in 1 second (attempt ${i + 18}/62)`)
      })

      snapshot(delays)
    })
  })

  context('._connectAsync', () => {
    it('creates a retrying socket to test the connection', async function () {
      const end = sinon.stub()

      sinon.stub(connect, 'createRetryingSocket').callsArgWith(1, null, { end })

      const opts = {
        host: '127.0.0.1',
        port: 3333,
      }

      await protocol._connectAsync(opts)
      expect(end).to.be.calledOnce
    })
  })
})
