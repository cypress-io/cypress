const { expect, sinon } = require('../../../spec_helper')

import os from 'os'
import si from 'systeminformation'
import memory from '../../../../lib/browsers/memory/default'

describe('lib/browsers/memory', () => {
  context('#getTotalMemoryLimit', () => {
    it('returns total memory limit from os', async () => {
      sinon.stub(os, 'totalmem').returns(100)

      expect(await memory.getTotalMemoryLimit()).to.eq(100)
    })
  })

  context('#getAvailableMemory', () => {
    it('returns available memory from os', async () => {
      sinon.stub(si, 'mem').returns({ available: 50 })

      expect(await memory.getAvailableMemory(100)).to.eq(50)
    })
  })
})
