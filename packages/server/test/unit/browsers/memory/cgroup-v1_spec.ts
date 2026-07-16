const { expect, sinon } = require('../../../spec_helper')

import fs from 'fs-extra'

const memory = require('../../../../lib/browsers/memory/cgroup-v1').default

describe('lib/browsers/memory/cgroup-v1', () => {
  context('#getTotalMemoryLimit', () => {
    it('returns total memory limit from limit_in_bytes', async () => {
      sinon.stub(fs, 'readFile').withArgs('/sys/fs/cgroup/memory/memory.limit_in_bytes', 'utf8').resolves('100\n')

      expect(await memory.getTotalMemoryLimit()).to.eq(100)
    })
  })

  context('#getAvailableMemory', () => {
    it('returns available memory from cgroup', async () => {
      const readFile = sinon.stub(fs, 'readFile')

      readFile.withArgs('/sys/fs/cgroup/memory/memory.usage_in_bytes', 'utf8').resolves('100\n')
      readFile.withArgs('/sys/fs/cgroup/memory/memory.stat', 'utf8').resolves('total_inactive_file 50\n')

      expect(await memory.getAvailableMemory(200)).to.eq(150)
    })
  })
})
