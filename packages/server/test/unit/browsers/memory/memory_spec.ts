import os from 'os'
import si from 'systeminformation'
import fs from 'fs-extra'
import browsers from '../../../../lib/browsers'
import * as memory from '../../../../lib/browsers/memory'
import defaultHandler from '../../../../lib/browsers/memory/default'
import cgroupV1Handler from '../../../../lib/browsers/memory/cgroup-v1'
import { proxyquire, expect, sinon } from '../../../spec_helper'
import { Automation } from '../../../../lib/automation'

describe('lib/browsers/memory', () => {
  before(() => {
    sinon.useFakeTimers()
  })

  afterEach(() => {
    memory.default.endProfiling()
  })

  context('#getJsHeapSizeLimit', () => {
    it('retrieves the jsHeapSizeLimit from performance.memory', async () => {
      const automation = sinon.createStubInstance(Automation)

      automation.request.withArgs('get:heap:size:limit', null, null).resolves({ result: { value: 50 } })

      expect(await memory.getJsHeapSizeLimit(automation)).to.eq(50)
    })

    it('defaults the jsHeapSizeLimit to four gibibytes', async () => {
      const automation = sinon.createStubInstance(Automation)

      automation.request.withArgs('get:heap:size:limit', null, null).throws(new Error('performance not available'))

      expect(await memory.getJsHeapSizeLimit(automation)).to.eq(4294967296)
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

  context('#startProfiling', () => {
    it('starts the profiling', async () => {
      const automation = sinon.createStubInstance(Automation)

      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(1000),
        getTotalMemoryLimit: sinon.stub().resolves(2000),
      }

      sinon.stub(memory, 'getJsHeapSizeLimit').resolves(100)
      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      sinon.stub(memory, 'gatherMemoryStats').resolves()

      sinon.stub(global, 'setTimeout').onFirstCall().callsFake(async (fn) => {
        await fn()
      })

      await memory.default.startProfiling(automation)

      expect(memory.gatherMemoryStats).to.be.calledTwice
    })

    it('doesn\'t start twice', async () => {
      const automation = sinon.createStubInstance(Automation)

      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(1000),
        getTotalMemoryLimit: sinon.stub().resolves(2000),
      }

      sinon.stub(memory, 'getJsHeapSizeLimit').resolves(100)
      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      sinon.stub(memory, 'gatherMemoryStats').resolves()

      await memory.default.startProfiling(automation)

      // second call doesn't do anything
      await memory.default.startProfiling(automation)

      expect(memory.gatherMemoryStats).to.be.calledOnce
    })
  })

  context('#maybeCollectGarbage', () => {
    // afterEach(() => {
    //   memory.default.endProfiling()
    // })

    it('collects memory when renderer process is greater than the default threshold', async () => {
      const automation = sinon.createStubInstance(Automation)
      const gcStub = automation.request.withArgs('collect:garbage').resolves()
      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(1000),
        getTotalMemoryLimit: sinon.stub().resolves(2000),
      }

      sinon.stub(memory, 'getJsHeapSizeLimit').resolves(100)
      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      sinon.stub(memory, 'getRendererMemoryUsage').resolves(75)

      await memory.default.startProfiling(automation)

      await memory.default.maybeCollectGarbage({ automation, test: { title: 'test', order: 1, currentRetry: 0 } })

      expect(gcStub).to.be.calledOnce
    })

    it('collects memory when renderer process is greater than the custom threshold', async () => {
      process.env.CYPRESS_INTERNAL_MEMORY_THRESHOLD_PERCENTAGE = '25'

      const memory = proxyquire('../lib/browsers/memory', {})

      const automation = sinon.createStubInstance(Automation)
      const gcStub = automation.request.withArgs('collect:garbage').resolves()
      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(1000),
        getTotalMemoryLimit: sinon.stub().resolves(2000),
      }

      sinon.stub(memory, 'getJsHeapSizeLimit').resolves(100)
      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      sinon.stub(memory, 'getRendererMemoryUsage').resolves(25)

      await memory.default.startProfiling(automation)

      await memory.default.maybeCollectGarbage({ automation, test: { title: 'test', order: 1, currentRetry: 0 } })

      expect(gcStub).to.be.calledOnce
    })

    it('collects memory when renderer process is equal to the threshold', async () => {
      const automation = sinon.createStubInstance(Automation)
      const gcStub = automation.request.withArgs('collect:garbage').resolves()
      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(1000),
        getTotalMemoryLimit: sinon.stub().resolves(2000),
      }

      sinon.stub(memory, 'getJsHeapSizeLimit').resolves(100)
      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      sinon.stub(memory, 'getRendererMemoryUsage').resolves(50)

      await memory.default.startProfiling(automation)

      await memory.default.maybeCollectGarbage({ automation, test: { title: 'test', order: 1, currentRetry: 0 } })

      expect(gcStub).to.be.calledOnce
    })

    it('uses the available memory limit if it\'s less than the jsHeapSizeLimit', async () => {
      const automation = sinon.createStubInstance(Automation)
      const gcStub = automation.request.withArgs('collect:garbage').resolves()
      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(10),
        getTotalMemoryLimit: sinon.stub().resolves(2000),
      }

      sinon.stub(memory, 'getJsHeapSizeLimit').resolves(100)
      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      sinon.stub(memory, 'getRendererMemoryUsage').resolves(25)

      await memory.default.startProfiling(automation)

      await memory.default.maybeCollectGarbage({ automation, test: { title: 'test', order: 1, currentRetry: 0 } })

      expect(gcStub).to.be.calledOnce
    })

    it('skips collecting memory when renderer process is less than the threshold', async () => {
      const automation = sinon.createStubInstance(Automation)
      const gcStub = automation.request.withArgs('collect:garbage').resolves()
      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(1000),
        getTotalMemoryLimit: sinon.stub().resolves(2000),
      }

      sinon.stub(memory, 'getJsHeapSizeLimit').resolves(100)
      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      sinon.stub(memory, 'getRendererMemoryUsage').resolves(25)

      await memory.default.startProfiling(automation)

      await memory.default.maybeCollectGarbage({ automation, test: { title: 'test', order: 1, currentRetry: 0 } })

      expect(gcStub).to.not.be.called
    })

    it('skips collecting memory if the renderer process is not found', async () => {
      const automation = sinon.createStubInstance(Automation)
      const gcStub = automation.request.withArgs('collect:garbage').resolves()
      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(1000),
        getTotalMemoryLimit: sinon.stub().resolves(2000),
      }

      sinon.stub(si, 'processes').resolves({ list: [
        { name: 'foo', pid: process.pid },
      ] })

      sinon.stub(memory, 'getJsHeapSizeLimit').resolves(100)
      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)

      await memory.default.startProfiling(automation)

      await memory.default.maybeCollectGarbage({ automation, test: { title: 'test', order: 1, currentRetry: 0 } })

      expect(gcStub).to.not.be.called
    })

    it('finds the renderer process from the process.command', async () => {
      const automation = sinon.createStubInstance(Automation)
      const gcStub = automation.request.withArgs('collect:garbage').resolves()
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

      sinon.stub(memory, 'getJsHeapSizeLimit').resolves(2000)
      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)

      await memory.default.startProfiling(automation)

      await memory.default.maybeCollectGarbage({ automation, test: { title: 'test', order: 1, currentRetry: 0 } })

      expect(gcStub).to.be.calledOnce
      expect(processesMock).to.be.calledOnce
    })

    it('finds the renderer process from the process.params', async () => {
      const automation = sinon.createStubInstance(Automation)
      const gcStub = automation.request.withArgs('collect:garbage').resolves()
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

      sinon.stub(memory, 'getJsHeapSizeLimit').resolves(2000)
      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)

      await memory.default.startProfiling(automation)

      await memory.default.maybeCollectGarbage({ automation, test: { title: 'test', order: 1, currentRetry: 0 } })

      expect(gcStub).to.be.calledOnce
      expect(processesMock).to.be.calledOnce
    })

    it('selects the renderer process with the most memory', async () => {
      const automation = sinon.createStubInstance(Automation)
      const gcStub = automation.request.withArgs('collect:garbage').resolves()
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

      sinon.stub(memory, 'getJsHeapSizeLimit').resolves(10000)
      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)

      await memory.default.startProfiling(automation)

      await memory.default.maybeCollectGarbage({ automation, test: { title: 'test', order: 1, currentRetry: 0 } })

      expect(gcStub).to.be.calledOnce
      expect(processesMock).to.be.calledOnce
    })

    it('uses the existing process id to obtain the memory usage', async () => {
      const pidStub = sinon.stub().resolves({ memory: 2000 })

      const memory = proxyquire('../lib/browsers/memory', { pidusage: pidStub })

      const automation = sinon.createStubInstance(Automation)
      const gcStub = automation.request.withArgs('collect:garbage').resolves()
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

      sinon.stub(memory, 'getJsHeapSizeLimit').resolves(3000)
      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)

      // first call will find the renderer process and use si.processes
      await memory.default.startProfiling(automation)

      // second call will use the existing process id and use pidusage
      await memory.default.checkMemory()

      await memory.default.maybeCollectGarbage({ automation, test: { title: 'test', order: 1, currentRetry: 0 } })

      expect(gcStub).to.be.calledOnce
      expect(processesMock).to.be.calledOnce
      expect(pidStub).to.be.calledOnce
    })

    it('collects memory when a previous checkMemory call goes over the threshold', async () => {
      const automation = sinon.createStubInstance(Automation)
      const gcStub = automation.request.withArgs('collect:garbage').resolves()
      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(1000),
        getTotalMemoryLimit: sinon.stub().resolves(2000),
      }

      sinon.stub(memory, 'getJsHeapSizeLimit').resolves(100)
      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      sinon.stub(memory, 'getRendererMemoryUsage')
      .onFirstCall().resolves(75)
      .onSecondCall().resolves(25)

      sinon.stub(global, 'setTimeout').onFirstCall().callsFake(async (fn) => {
        await fn()
      })

      await memory.default.startProfiling(automation)

      await memory.default.maybeCollectGarbage({ automation, test: { title: 'test', order: 1, currentRetry: 0 } })

      expect(gcStub).to.be.calledOnce
      expect(memory.getRendererMemoryUsage).to.be.calledTwice
    })
  })

  context('#endProfiling', () => {
    it('stops the profiling', async () => {
      const automation = sinon.createStubInstance(Automation)

      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(1000),
        getTotalMemoryLimit: sinon.stub().resolves(2000),
      }

      sinon.stub(memory, 'getJsHeapSizeLimit').resolves(100)
      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      sinon.stub(memory, 'gatherMemoryStats').resolves()

      await memory.default.startProfiling(automation)
      await memory.default.endProfiling()

      // move the clock forward by 5 seconds, but no more collections should occur
      await sinon._clock.tickAsync(1000)
      await sinon._clock.tickAsync(1000)
      await sinon._clock.tickAsync(1000)
      await sinon._clock.tickAsync(1000)
      await sinon._clock.tickAsync(1000)

      expect(memory.gatherMemoryStats).to.be.calledOnce
    })

    it('saves the cumulative memory stats to a file', async () => {
      process.env.CYPRESS_INTERNAL_SAVE_MEMORY_STATS = 'true'

      const fileStub = sinon.stub(fs, 'outputFile').withArgs('cypress/logs/memory/memory_spec.json').resolves()

      const automation = sinon.createStubInstance(Automation)

      await memory.default.startProfiling(automation, { fileName: 'memory_spec' })
      await memory.default.endProfiling()

      expect(fileStub).to.be.calledOnce
    })
  })
})
