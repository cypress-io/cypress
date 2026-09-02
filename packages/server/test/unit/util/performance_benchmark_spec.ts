import '../../spec_helper'

import { performance } from 'perf_hooks'
import * as electronApp from '../../../lib/util/electron-app'
import { debugElapsedTime, initializeStartTime } from '../../../lib/util/performance_benchmark'

describe('lib/util/performance_benchmark', () => {
  let originalBinaryStartTime: number | undefined
  let originalServerStartTime: number | undefined

  beforeEach(() => {
    originalBinaryStartTime = global.cypressBinaryStartTime
    originalServerStartTime = global.cypressServerStartTime
  })

  afterEach(() => {
    global.cypressBinaryStartTime = originalBinaryStartTime
    global.cypressServerStartTime = originalServerStartTime
  })

  context('.initializeStartTime', () => {
    beforeEach(() => {
      global.cypressBinaryStartTime = undefined
      global.cypressServerStartTime = undefined
    })

    it('records both start times when running in Electron', () => {
      sinon.stub(electronApp, 'isRunning').returns(true)
      sinon.stub(performance, 'now').returns(1234)

      initializeStartTime()

      expect(global.cypressBinaryStartTime).to.eq(performance.timeOrigin)
      expect(global.cypressServerStartTime).to.eq(1234)
    })

    it('does nothing outside of Electron', () => {
      sinon.stub(electronApp, 'isRunning').returns(false)

      initializeStartTime()

      expect(global.cypressBinaryStartTime).to.be.undefined
      expect(global.cypressServerStartTime).to.be.undefined
    })
  })

  context('.debugElapsedTime', () => {
    // start-cypress.js adds this return value back onto cypressServerStartTime
    // to close the v8 snapshot telemetry span, so it has to stay a delta
    it('returns the time elapsed since the server start time', () => {
      sinon.stub(performance, 'now').returns(1500)
      global.cypressServerStartTime = 400

      expect(debugElapsedTime('v8-snapshot-startup-time')).to.eq(1100)
    })

    it('returns NaN when no server start time was recorded', () => {
      global.cypressServerStartTime = undefined

      expect(debugElapsedTime('v8-snapshot-startup-time')).to.be.NaN
    })
  })
})
