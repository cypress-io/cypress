const { expect, sinon } = require('../../../spec_helper')

import os from 'os'
import si from 'systeminformation'
import fs from 'fs-extra'
import browsers from '../../../../lib/browsers'
import * as memory from '../../../../lib/browsers/memory'
import defaultHandler from '../../../../lib/browsers/memory/default'
import cgroupV1Handler from '../../../../lib/browsers/memory/cgroup-v1'
import { proxyquire } from '../../../spec_helper'

describe('lib/browsers/memory', () => {
  let sendDebuggerCommand

  beforeEach(() => {
    sendDebuggerCommand = sinon.stub()
  })

  context('#getJsHeapSizeLimit', () => {
    it('retrieves the jsHeapSizeLimit from performance.memory', async () => {
      sendDebuggerCommand.withArgs('Runtime.evaluate', { expression: 'performance.memory.jsHeapSizeLimit' }).resolves({ result: { value: 50 } })

      expect(await memory.getJsHeapSizeLimit(sendDebuggerCommand)).to.eq(50)
    })

    it('defaults the jsHeapSizeLimit to four gibibytes', async () => {
      sendDebuggerCommand.withArgs('Runtime.evaluate', { expression: 'performance.memory.jsHeapSizeLimit' }).resolves({ result: {} })

      expect(await memory.getJsHeapSizeLimit(sendDebuggerCommand)).to.eq(4294967296)
    })
  })

  context('#getMemoryHandler', () => {
    it('returns "default" for non-linux', async () => {
      sinon.stub(os, 'platform').returns('darwin')

      expect(await memory.getMemoryHandler()).to.eq(defaultHandler)
    })

    it('returns "cgroup-v1" for linux cgroup v1', async () => {
      sinon.stub(os, 'platform').returns('linux')
      sinon.stub(fs, 'pathExists').withArgs('/sys/fs/cgroup/cgroup.controllers').resolves(false)

      expect(await memory.getMemoryHandler()).to.eq(cgroupV1Handler)
    })

    it('returns "default" for linux cgroup v2', async () => {
      sinon.stub(os, 'platform').returns('linux')
      sinon.stub(fs, 'pathExists').withArgs('/sys/fs/cgroup/cgroup.controllers').resolves(true)

      expect(await memory.getMemoryHandler()).to.eq(defaultHandler)
    })
  })

  context('#checkMemoryAndCollectGarbage', () => {
    it('collects memory when renderer process is greater than the threshold', async () => {
      sendDebuggerCommand.withArgs('Runtime.evaluate', { expression: 'performance.memory.jsHeapSizeLimit' }).resolves({ result: { value: 100 } })
      const gcStub = sendDebuggerCommand.withArgs('HeapProfiler.collectGarbage').resolves()
      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(1000),
        getTotalMemoryLimit: sinon.stub().resolves(2000),
      }

      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      const memoryInstance = await memory.default.create(sendDebuggerCommand)

      sinon.stub(memoryInstance, 'getRendererMemoryUsage').resolves(75)

      await memoryInstance.checkMemoryAndCollectGarbage()

      expect(gcStub).to.be.calledOnce
    })

    it('collects memory when renderer process is equal to the threshold', async () => {
      sendDebuggerCommand.withArgs('Runtime.evaluate', { expression: 'performance.memory.jsHeapSizeLimit' }).resolves({ result: { value: 100 } })
      const gcStub = sendDebuggerCommand.withArgs('HeapProfiler.collectGarbage').resolves()
      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(1000),
        getTotalMemoryLimit: sinon.stub().resolves(2000),
      }

      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      const memoryInstance = await memory.default.create(sendDebuggerCommand)

      sinon.stub(memoryInstance, 'getRendererMemoryUsage').resolves(50)

      await memoryInstance.checkMemoryAndCollectGarbage()

      expect(gcStub).to.be.calledOnce
    })

    it('uses the available memory limit if it\'s less than the jsHeapSizeLimit', async () => {
      sendDebuggerCommand.withArgs('Runtime.evaluate', { expression: 'performance.memory.jsHeapSizeLimit' }).resolves({ result: { value: 100 } })
      const gcStub = sendDebuggerCommand.withArgs('HeapProfiler.collectGarbage').resolves()
      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(10),
        getTotalMemoryLimit: sinon.stub().resolves(2000),
      }

      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      const memoryInstance = await memory.default.create(sendDebuggerCommand)

      sinon.stub(memoryInstance, 'getRendererMemoryUsage').resolves(25)

      await memoryInstance.checkMemoryAndCollectGarbage()

      expect(gcStub).to.be.calledOnce
    })

    it('skips collecting memory when renderer process is less than the threshold', async () => {
      sendDebuggerCommand.withArgs('Runtime.evaluate', { expression: 'performance.memory.jsHeapSizeLimit' }).resolves({ result: { value: 100 } })
      const gcStub = sendDebuggerCommand.withArgs('HeapProfiler.collectGarbage').resolves()
      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(1000),
        getTotalMemoryLimit: sinon.stub().resolves(2000),
      }

      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      const memoryInstance = await memory.default.create(sendDebuggerCommand)

      sinon.stub(memoryInstance, 'getRendererMemoryUsage').resolves(25)

      await memoryInstance.checkMemoryAndCollectGarbage()

      expect(gcStub).to.not.be.called
    })

    it('skips collecting memory if the renderer process is not found', async () => {
      sendDebuggerCommand.withArgs('Runtime.evaluate', { expression: 'performance.memory.jsHeapSizeLimit' }).resolves({ result: { value: 100 } })
      const gcStub = sendDebuggerCommand.withArgs('HeapProfiler.collectGarbage').resolves()
      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(1000),
        getTotalMemoryLimit: sinon.stub().resolves(2000),
      }

      sinon.stub(si, 'processes').resolves({ list: [
        { name: 'foo', pid: process.pid },
      ] })

      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      const memoryInstance = await memory.default.create(sendDebuggerCommand)

      await memoryInstance.checkMemoryAndCollectGarbage()

      expect(gcStub).to.not.be.called
    })

    it('skips collecting memory if the renderer process is not found', async () => {
      sendDebuggerCommand.withArgs('Runtime.evaluate', { expression: 'performance.memory.jsHeapSizeLimit' }).resolves({ result: { value: 100 } })
      const gcStub = sendDebuggerCommand.withArgs('HeapProfiler.collectGarbage').resolves()
      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(1000),
        getTotalMemoryLimit: sinon.stub().resolves(2000),
      }

      const processesMock = sinon.stub(si, 'processes').resolves({ list: [
        { name: 'foo', pid: process.pid },
      ] })

      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      const memoryInstance = await memory.default.create(sendDebuggerCommand)

      await memoryInstance.checkMemoryAndCollectGarbage()

      expect(gcStub).to.not.be.called
      expect(processesMock).to.be.calledOnce
    })

    it('finds the renderer process from the process.command', async () => {
      sendDebuggerCommand.withArgs('Runtime.evaluate', { expression: 'performance.memory.jsHeapSizeLimit' }).resolves({ result: { value: 2000 } })
      const gcStub = sendDebuggerCommand.withArgs('HeapProfiler.collectGarbage').resolves()
      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(2000),
        getTotalMemoryLimit: sinon.stub().resolves(3000),
      }

      const processesMock = sinon.stub(si, 'processes').resolves({ list: [
        { name: 'cypress', pid: process.pid },
        { name: 'browser', pid: 1234, parentPid: process.pid, command: 'browser.exe' },
        { name: 'renderer', pid: 12345, parentPid: 1234, command: '--type=renderer', memRss: 1 },
      ] })

      sinon.stub(browsers, 'getBrowserInstance').returns({
        pid: 1234,
      })

      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      const memoryInstance = await memory.default.create(sendDebuggerCommand)

      await memoryInstance.checkMemoryAndCollectGarbage()

      expect(gcStub).to.be.calledOnce
      expect(processesMock).to.be.calledOnce
    })

    it('finds the renderer process from the process.params', async () => {
      sendDebuggerCommand.withArgs('Runtime.evaluate', { expression: 'performance.memory.jsHeapSizeLimit' }).resolves({ result: { value: 2000 } })
      const gcStub = sendDebuggerCommand.withArgs('HeapProfiler.collectGarbage').resolves()
      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(2000),
        getTotalMemoryLimit: sinon.stub().resolves(3000),
      }

      const processesMock = sinon.stub(si, 'processes').resolves({ list: [
        { name: 'cypress', pid: process.pid },
        { name: 'browser', pid: 1234, parentPid: process.pid, command: 'browser.exe' },
        { name: 'renderer', pid: 12345, parentPid: 1234, command: 'browser.exe', params: '--type=renderer', memRss: 1 },
      ] })

      sinon.stub(browsers, 'getBrowserInstance').returns({
        pid: 1234,
      })

      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      const memoryInstance = await memory.default.create(sendDebuggerCommand)

      await memoryInstance.checkMemoryAndCollectGarbage()

      expect(gcStub).to.be.calledOnce
      expect(processesMock).to.be.calledOnce
    })

    it('selects the renderer process with the most memory', async () => {
      sendDebuggerCommand.withArgs('Runtime.evaluate', { expression: 'performance.memory.jsHeapSizeLimit' }).resolves({ result: { value: 10000 } })
      const gcStub = sendDebuggerCommand.withArgs('HeapProfiler.collectGarbage').resolves()
      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(10000),
        getTotalMemoryLimit: sinon.stub().resolves(20000),
      }

      const processesMock = sinon.stub(si, 'processes').resolves({ list: [
        { name: 'cypress', pid: process.pid },
        { name: 'browser', pid: 1234, parentPid: process.pid, command: 'browser.exe' },
        { name: 'renderer', pid: 12345, parentPid: 1234, command: '--type=renderer', memRss: 1 },
        { name: 'max-renderer', pid: 123456, parentPid: 1234, command: '--type=renderer', memRss: 5 },
      ] })

      sinon.stub(browsers, 'getBrowserInstance').returns({
        pid: 1234,
      })

      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      const memoryInstance = await memory.default.create(sendDebuggerCommand)

      await memoryInstance.checkMemoryAndCollectGarbage()

      expect(gcStub).to.be.calledOnce
      expect(processesMock).to.be.calledOnce
    })

    it('uses the existing process id to obtain the memory usage', async () => {
      const pidStub = sinon.stub().resolves({ memory: 2000 })

      const memory = proxyquire('../lib/browsers/memory', { pidusage: pidStub })

      sendDebuggerCommand.withArgs('Runtime.evaluate', { expression: 'performance.memory.jsHeapSizeLimit' }).resolves({ result: { value: 3000 } })
      const gcStub = sendDebuggerCommand.withArgs('HeapProfiler.collectGarbage').resolves()
      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(3000),
        getTotalMemoryLimit: sinon.stub().resolves(4000),
      }

      const processesMock = sinon.stub(si, 'processes').resolves({ list: [
        { name: 'cypress', pid: process.pid },
        { name: 'browser', pid: 1234, parentPid: process.pid, command: 'browser.exe' },
        { name: 'renderer', pid: 12345, parentPid: 1234, command: '--type=renderer', memRss: 1 },
      ] })

      sinon.stub(browsers, 'getBrowserInstance').returns({
        pid: 1234,
      })

      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      let memoryInstance = await memory.default.create(sendDebuggerCommand)

      // first call will find the renderer process
      await memoryInstance.checkMemoryAndCollectGarbage()

      // second call will use the existing process id
      await memoryInstance.checkMemoryAndCollectGarbage()

      expect(gcStub).to.be.calledOnce
      expect(processesMock).to.be.calledOnce
      expect(pidStub).to.be.calledOnce
    })
  })
})
