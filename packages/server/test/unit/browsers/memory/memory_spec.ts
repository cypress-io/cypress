const { expect, sinon } = require('../../../spec_helper')

import os from 'os'
import fs from 'fs-extra'
import { getJsHeapSizeLimit, getMemoryHandler } from '../../../../lib/browsers/memory'
import defaultHandler from '../../../../lib/browsers/memory/default'
import cgroupV1Handler from '../../../../lib/browsers/memory/cgroup-v1'

describe('lib/browsers/memory', () => {
  let sendDebuggerCommand

  beforeEach(() => {
    sendDebuggerCommand = sinon.stub()
  })

  context('#getJsHeapSizeLimit', () => {
    it('retrieves the jsHeapSizeLimit from performance.memory', async () => {
      sendDebuggerCommand.withArgs('Runtime.evaluate', { expression: 'performance.memory.jsHeapSizeLimit' }).resolves({ result: { value: 50 } })

      expect(await getJsHeapSizeLimit(sendDebuggerCommand)).to.eq(50)
    })

    it('defaults the jsHeapSizeLimit to four gibibytes', async () => {
      sendDebuggerCommand.withArgs('Runtime.evaluate', { expression: 'performance.memory.jsHeapSizeLimit' }).resolves({ result: {} })

      expect(await getJsHeapSizeLimit(sendDebuggerCommand)).to.eq(4294967296)
    })
  })

  context('#getMemoryHandler', () => {
    it('returns "default" for non-linux', async () => {
      sinon.stub(os, 'platform').returns('darwin')

      expect(await getMemoryHandler()).to.eq(defaultHandler)
    })

    it('returns "cgroup-v1" for linux cgroup v1', async () => {
      sinon.stub(os, 'platform').returns('linux')
      sinon.stub(fs, 'pathExists').withArgs('/sys/fs/cgroup/cgroup.controllers').resolves(false)

      expect(await getMemoryHandler()).to.eq(cgroupV1Handler)
    })

    it('returns "default" for linux cgroup v2', async () => {
      sinon.stub(os, 'platform').returns('linux')
      sinon.stub(fs, 'pathExists').withArgs('/sys/fs/cgroup/cgroup.controllers').resolves(true)

      expect(await getMemoryHandler()).to.eq(defaultHandler)
    })
  })

  context('#checkMemoryAndCollectGarbage', () => {
    it('collects memory when renderer process is greater than the threshold', async () => {

    })

    it('skips collecting memory when renderer process is less than the threshold', async () => {

    })
  })
})
