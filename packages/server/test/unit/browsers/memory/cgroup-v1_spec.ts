const { expect, sinon } = require('../../../spec_helper')

import util from 'util'

const mockExec = sinon.stub()

sinon.stub(util, 'promisify').returns(mockExec)

import memory from '../../../../lib/browsers/memory/cgroup-v1'

describe('lib/browsers/memory/cgroup-v1', () => {
  context('#getTotalMemoryLimit', () => {
    it('returns total memory limit from limit_in_bytes', async () => {
      mockExec.withArgs('cat /sys/fs/cgroup/memory/memory.limit_in_bytes', { encoding: 'utf8' }).resolves({ stdout: '100' })

      expect(await memory.getTotalMemoryLimit()).to.eq(100)
    })
  })

  context('#getAvailableMemory', () => {
    it('returns available memory from cgroup', async () => {
      mockExec.withArgs('cat /sys/fs/cgroup/memory/memory.usage_in_bytes').resolves({ stdout: '100' })
      mockExec.withArgs('cat /sys/fs/cgroup/memory/memory.stat').resolves({ stdout: 'total_inactive_file 50' })

      expect(await memory.getAvailableMemory(200)).to.eq(150)
    })
  })
})
