import { createTestDataContext } from '../helper'
import type { DataContext } from '../../../src'
import { expect } from 'chai'

describe('CurrentRecordingActions', () => {
  let ctx: DataContext

  beforeEach(() => {
    ctx = createTestDataContext('open')
  })

  describe('startRun', () => {
    it('updates the current run id', () => {
      ctx.actions.currentRecording.startRun('12345')

      expect(ctx.coreData.currentRecordingInfo.runId).to.equal('12345')
    })
  })

  describe('startInstance', () => {
    it('updates the current instance id', () => {
      ctx.actions.currentRecording.startInstance('12345')

      expect(ctx.coreData.currentRecordingInfo.instanceId).to.equal('12345')
    })
  })
})
