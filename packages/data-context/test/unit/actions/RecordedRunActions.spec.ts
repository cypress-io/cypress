import { createTestDataContext } from '../helper'
import type { DataContext } from '../../../src'
import { expect } from 'chai'

describe('RecordedRunActions', () => {
  let ctx: DataContext

  beforeEach(() => {
    ctx = createTestDataContext('open')
  })

  describe('startRun', () => {
    it('updates the current run id', () => {
      ctx.actions.recordedRun.startRun('12345')

      expect(ctx.coreData.currentRecordingInfo.runId).to.equal('12345')
    })
  })

  describe('startInstance', () => {
    it('updates the current instance id', () => {
      ctx.actions.recordedRun.startInstance('12345')

      expect(ctx.coreData.currentRecordingInfo.instanceId).to.equal('12345')
    })
  })
})
