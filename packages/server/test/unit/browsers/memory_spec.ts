const { expect, sinon } = require('../../spec_helper')

import os from 'os'
import cp from 'child_process'
import si from 'systeminformation'
import util from 'util'
import * as memory from '../../../lib/browsers/memory'

describe('lib/browsers/memory', () => {
  context('#_isLinux', () => {
    it('returns true if platform is linux', () => {
      sinon.stub(os, 'platform').returns('linux')

      expect(memory._isLinux()).to.be.true
    })

    it('returns false if platform is not linux', () => {
      sinon.stub(os, 'platform').returns('darwin')

      expect(memory._isLinux()).to.be.false
    })
  })

  context('#_isCgroupMemoryAvailable', () => {
    it('returns true if cgroup memory is available', () => {
      sinon.stub(memory, '_isLinux').returns(true)
      sinon.stub(cp, 'execSync').returns('')

      expect(memory._isCgroupMemoryAvailable()).to.be.true
    })

    it('returns false if cgroup memory is not available', () => {
      sinon.stub(memory, '_isLinux').returns(true)
      sinon.stub(cp, 'execSync').throws()

      expect(memory._isCgroupMemoryAvailable()).to.be.false
    })

    it('returns false if not linux', () => {
      sinon.stub(memory, '_isLinux').returns(false)

      expect(memory._isCgroupMemoryAvailable()).to.be.false
    })
  })

  context('#_getTotalMemoryLimit', () => {
    it('returns total memory limit from cgroup', () => {
      sinon.stub(memory, '_isCgroupMemoryAvailable').returns(true)
      sinon.stub(cp, 'execSync').withArgs('cat /sys/fs/cgroup/memory/memory.limit_in_bytes', { encoding: 'utf8' }).returns('100')

      expect(memory._getTotalMemoryLimit()).to.eq(100)
    })

    it('returns total memory limit from os', () => {
      sinon.stub(memory, '_isCgroupMemoryAvailable').returns(false)
      sinon.stub(os, 'totalmem').returns(100)

      expect(memory._getTotalMemoryLimit()).to.eq(100)
    })
  })

  context('#_getAvailableMemory', () => {
    it('returns available memory from cgroup', async () => {
      sinon.stub(memory, '_isCgroupMemoryAvailable').returns(true)
      const mockExec = sinon.stub().resolves({ stdout: '100' })

      sinon.stub(util, 'promisify').returns(mockExec)

      sinon.stub(memory, '_getMemoryStats').returns({ total_inactive_file: 50 })

      expect(await memory._getAvailableMemory()).to.eq(50)
    })

    it('returns available memory from os', async () => {
      sinon.stub(memory, '_isCgroupMemoryAvailable').returns(false)
      sinon.stub(si, 'mem').returns({ available: 50 })

      expect(await memory._getAvailableMemory()).to.eq(50)
    })
  })
})
