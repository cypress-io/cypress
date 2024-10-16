import os from 'os'
import si from 'systeminformation'
import fs from 'fs-extra'
import browsers from '../../../../lib/browsers'
import { proxyquire, expect, sinon } from '../../../spec_helper'
import { Automation } from '../../../../lib/automation'

describe('lib/browsers/memory', () => {
  let memory: typeof import('../../../../lib/browsers/memory')

  before(() => {
    delete require.cache[require.resolve('../../../../lib/browsers/memory')]
    process.env.CYPRESS_INTERNAL_MEMORY_SAVE_STATS = 'true'

    memory = require('../../../../lib/browsers/memory')
  })

  beforeEach(() => {
    sinon.useFakeTimers()
  })

  afterEach(async () => {
    await memory.default.endProfiling()
  })

  after(() => {
    sinon.restore()
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
      const defaultHandler = require('../../../../lib/browsers/memory/default').default

      sinon.stub(os, 'platform').returns('darwin')

      expect(await memory.getMemoryHandler()).to.eq(defaultHandler)
    })

    it('returns "cgroup-v1" for linux cgroup v1', async () => {
      const cgroupV1Handler = require('../../../../lib/browsers/memory/cgroup-v1').default

      sinon.stub(os, 'platform').returns('linux')
      sinon.stub(fs, 'pathExists').withArgs('/sys/fs/cgroup/cgroup.controllers').resolves(false)

      expect(await memory.getMemoryHandler()).to.eq(cgroupV1Handler)
    })

    it('returns "default" for linux cgroup v2', async () => {
      const defaultHandler = require('../../../../lib/browsers/memory/default').default

      sinon.stub(os, 'platform').returns('linux')
      sinon.stub(fs, 'pathExists').withArgs('/sys/fs/cgroup/cgroup.controllers').resolves(true)

      expect(await memory.getMemoryHandler()).to.eq(defaultHandler)
    })
  })

  context('#startProfiling', () => {
    it('starts the profiling', async () => {
      // restore the fake timers since we are stubbing setTimeout directly
      sinon._clock.restore()

      const automation = sinon.createStubInstance(Automation)

      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(1000),
        getTotalMemoryLimit: sinon.stub().resolves(2000),
      }

      sinon.stub(memory, 'getJsHeapSizeLimit').resolves(100)
      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      sinon.stub(memory, 'calculateMemoryStats').resolves()

      sinon.stub(global, 'setTimeout').onFirstCall().callsFake(async (fn) => {
        await fn()
      })

      await memory.default.startProfiling(automation, { fileName: 'memory_spec' })

      expect(memory.calculateMemoryStats).to.be.calledTwice
    })

    it('doesn\'t start twice', async () => {
      const automation = sinon.createStubInstance(Automation)

      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(1000),
        getTotalMemoryLimit: sinon.stub().resolves(2000),
      }

      sinon.stub(memory, 'getJsHeapSizeLimit').resolves(100)
      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      sinon.stub(memory, 'calculateMemoryStats').resolves()

      await memory.default.startProfiling(automation, { fileName: 'memory_spec' })

      // second call doesn't do anything
      await memory.default.startProfiling(automation, { fileName: 'memory_spec' })

      expect(memory.calculateMemoryStats).to.be.calledOnce
    })
  })

  context('#checkMemoryPressure', () => {
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

      await memory.default.startProfiling(automation, { fileName: 'memory_spec' })

      await memory.default.checkMemoryPressure({ automation, test: { title: 'test', order: 1, currentRetry: 0 } })

      const expected = [
        {
          getAvailableMemoryDuration: 0,
          jsHeapSizeLimit: 100,
          totalMemoryLimit: 2000,
          rendererProcessMemRss: 75,
          rendererUsagePercentage: 75,
          rendererMemoryThreshold: 50,
          currentAvailableMemory: 1000,
          maxAvailableRendererMemory: 100,
          shouldCollectGarbage: true,
          timestamp: 0,
          calculateMemoryStatsDuration: 0,
        },
        {
          checkMemoryPressureDuration: 0,
          testTitle: 'test',
          testOrder: 1,
          garbageCollected: true,
          timestamp: 0,
        },
      ]

      expect(gcStub).to.be.calledOnce
      expect(memory.default.getMemoryStats()).to.deep.eql(expected)
    })

    it('collects memory when renderer process is greater than the custom threshold', async () => {
      process.env.CYPRESS_INTERNAL_MEMORY_THRESHOLD_PERCENTAGE = '25'
      process.env.CYPRESS_INTERNAL_MEMORY_SAVE_STATS = 'true'

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

      await memory.default.startProfiling(automation, { fileName: 'memory_spec' })

      await memory.default.checkMemoryPressure({ automation, test: { title: 'test', order: 1, currentRetry: 0 } })

      const expected = [
        {
          getAvailableMemoryDuration: 0,
          jsHeapSizeLimit: 100,
          totalMemoryLimit: 2000,
          rendererProcessMemRss: 25,
          rendererUsagePercentage: 25,
          rendererMemoryThreshold: 25,
          currentAvailableMemory: 1000,
          maxAvailableRendererMemory: 100,
          shouldCollectGarbage: true,
          timestamp: 0,
          calculateMemoryStatsDuration: 0,
        },
        {
          checkMemoryPressureDuration: 0,
          testTitle: 'test',
          testOrder: 1,
          garbageCollected: true,
          timestamp: 0,
        },
      ]

      expect(gcStub).to.be.calledOnce
      expect(memory.default.getMemoryStats()).to.deep.eql(expected)
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

      await memory.default.startProfiling(automation, { fileName: 'memory_spec' })

      await memory.default.checkMemoryPressure({ automation, test: { title: 'test', order: 1, currentRetry: 0 } })

      const expected = [
        {
          getAvailableMemoryDuration: 0,
          jsHeapSizeLimit: 100,
          totalMemoryLimit: 2000,
          rendererProcessMemRss: 50,
          rendererUsagePercentage: 50,
          rendererMemoryThreshold: 50,
          currentAvailableMemory: 1000,
          maxAvailableRendererMemory: 100,
          shouldCollectGarbage: true,
          timestamp: 0,
          calculateMemoryStatsDuration: 0,
        },
        {
          checkMemoryPressureDuration: 0,
          testTitle: 'test',
          testOrder: 1,
          garbageCollected: true,
          timestamp: 0,
        },
      ]

      expect(gcStub).to.be.calledOnce
      expect(memory.default.getMemoryStats()).to.deep.eql(expected)
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

      await memory.default.startProfiling(automation, { fileName: 'memory_spec' })

      await memory.default.checkMemoryPressure({ automation, test: { title: 'test', order: 1, currentRetry: 0 } })

      const expected = [
        {
          getAvailableMemoryDuration: 0,
          jsHeapSizeLimit: 100,
          totalMemoryLimit: 2000,
          rendererProcessMemRss: 25,
          rendererUsagePercentage: 71.42857142857143,
          rendererMemoryThreshold: 17.5,
          currentAvailableMemory: 10,
          maxAvailableRendererMemory: 35,
          shouldCollectGarbage: true,
          timestamp: 0,
          calculateMemoryStatsDuration: 0,
        },
        {
          checkMemoryPressureDuration: 0,
          testTitle: 'test',
          testOrder: 1,
          garbageCollected: true,
          timestamp: 0,
        },
      ]

      expect(gcStub).to.be.calledOnce
      expect(memory.default.getMemoryStats()).to.deep.eql(expected)
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

      await memory.default.startProfiling(automation, { fileName: 'memory_spec' })

      await memory.default.checkMemoryPressure({ automation, test: { title: 'test', order: 1, currentRetry: 0 } })

      const expected = [
        {
          getAvailableMemoryDuration: 0,
          jsHeapSizeLimit: 100,
          totalMemoryLimit: 2000,
          rendererProcessMemRss: 25,
          rendererUsagePercentage: 25,
          rendererMemoryThreshold: 50,
          currentAvailableMemory: 1000,
          maxAvailableRendererMemory: 100,
          shouldCollectGarbage: false,
          timestamp: 0,
          calculateMemoryStatsDuration: 0,
        },
        {
          checkMemoryPressureDuration: 0,
          testTitle: 'test',
          testOrder: 1,
          garbageCollected: false,
          timestamp: 0,
        },
      ]

      expect(gcStub).to.not.be.called
      expect(memory.default.getMemoryStats()).to.deep.eql(expected)
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

      await memory.default.startProfiling(automation, { fileName: 'memory_spec' })

      await memory.default.checkMemoryPressure({ automation, test: { title: 'test', order: 1, currentRetry: 0 } })

      const expected = [
        {
          getAvailableMemoryDuration: 0,
          getRendererMemoryUsageDuration: 0,
          calculateMemoryStatsDuration: 0,
        },
        {
          checkMemoryPressureDuration: 0,
          testTitle: 'test',
          testOrder: 1,
          garbageCollected: false,
          timestamp: 0,
        },
      ]

      expect(gcStub).to.not.be.called
      expect(memory.default.getMemoryStats()).to.deep.eql(expected)
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
        once: sinon.stub().resolves(),
        removeListener: sinon.stub(),
      })

      sinon.stub(memory, 'getJsHeapSizeLimit').resolves(2000)
      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)

      await memory.default.startProfiling(automation, { fileName: 'memory_spec' })

      await memory.default.checkMemoryPressure({ automation, test: { title: 'test', order: 1, currentRetry: 0 } })

      const expected = [
        {
          getAvailableMemoryDuration: 0,
          getRendererMemoryUsageDuration: 0,
          jsHeapSizeLimit: 2000,
          totalMemoryLimit: 3000,
          rendererProcessMemRss: 1024,
          rendererUsagePercentage: 51.2,
          rendererMemoryThreshold: 1000,
          currentAvailableMemory: 2000,
          maxAvailableRendererMemory: 2000,
          shouldCollectGarbage: true,
          timestamp: 0,
          calculateMemoryStatsDuration: 0,
        },
        {
          checkMemoryPressureDuration: 0,
          testTitle: 'test',
          testOrder: 1,
          garbageCollected: true,
          timestamp: 0,
        },
      ]

      expect(gcStub).to.be.calledOnce
      expect(processesMock).to.be.calledOnce
      expect(memory.default.getMemoryStats()).to.deep.eql(expected)
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
        once: sinon.stub().resolves(),
        removeListener: sinon.stub(),
      })

      sinon.stub(memory, 'getJsHeapSizeLimit').resolves(2000)
      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)

      await memory.default.startProfiling(automation, { fileName: 'memory_spec' })

      await memory.default.checkMemoryPressure({ automation, test: { title: 'test', order: 1, currentRetry: 0 } })

      const expected = [
        {
          getAvailableMemoryDuration: 0,
          getRendererMemoryUsageDuration: 0,
          jsHeapSizeLimit: 2000,
          totalMemoryLimit: 3000,
          rendererProcessMemRss: 1024,
          rendererUsagePercentage: 51.2,
          rendererMemoryThreshold: 1000,
          currentAvailableMemory: 2000,
          maxAvailableRendererMemory: 2000,
          shouldCollectGarbage: true,
          timestamp: 0,
          calculateMemoryStatsDuration: 0,
        },
        {
          checkMemoryPressureDuration: 0,
          testTitle: 'test',
          testOrder: 1,
          garbageCollected: true,
          timestamp: 0,
        },
      ]

      expect(gcStub).to.be.calledOnce
      expect(processesMock).to.be.calledOnce
      expect(memory.default.getMemoryStats()).to.deep.eql(expected)
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
        once: sinon.stub().resolves(),
        removeListener: sinon.stub(),
      })

      sinon.stub(memory, 'getJsHeapSizeLimit').resolves(10000)
      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)

      await memory.default.startProfiling(automation, { fileName: 'memory_spec' })

      await memory.default.checkMemoryPressure({ automation, test: { title: 'test', order: 1, currentRetry: 0 } })

      const expected = [
        {
          getAvailableMemoryDuration: 0,
          getRendererMemoryUsageDuration: 0,
          jsHeapSizeLimit: 10000,
          totalMemoryLimit: 20000,
          rendererProcessMemRss: 5120,
          rendererUsagePercentage: 51.2,
          rendererMemoryThreshold: 5000,
          currentAvailableMemory: 10000,
          maxAvailableRendererMemory: 10000,
          shouldCollectGarbage: true,
          timestamp: 0,
          calculateMemoryStatsDuration: 0,
        },
        {
          checkMemoryPressureDuration: 0,
          testTitle: 'test',
          testOrder: 1,
          garbageCollected: true,
          timestamp: 0,
        },
      ]

      expect(gcStub).to.be.calledOnce
      expect(processesMock).to.be.calledOnce
      expect(memory.default.getMemoryStats()).to.deep.eql(expected)
    })

    it('uses the existing process id to obtain the memory usage', async () => {
      process.env.CYPRESS_INTERNAL_MEMORY_SAVE_STATS = 'true'

      const pidStub = sinon.stub().resolves({ memory: 2000 })

      const memory: typeof import('../../../../lib/browsers/memory') = proxyquire('../lib/browsers/memory', { pidusage: pidStub })

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
        once: sinon.stub().resolves(),
        removeListener: sinon.stub(),
      })

      sinon.stub(memory, 'getJsHeapSizeLimit').resolves(3000)
      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)

      // first call will find the renderer process and use si.processes
      await memory.default.startProfiling(automation, { fileName: 'memory_spec' })

      // second call will use the existing process id and use pidusage
      await memory.default.gatherMemoryStats()

      await memory.default.checkMemoryPressure({ automation, test: { title: 'test', order: 1, currentRetry: 0 } })

      const expected = [
        {
          getAvailableMemoryDuration: 0,
          getRendererMemoryUsageDuration: 0,
          jsHeapSizeLimit: 3000,
          totalMemoryLimit: 4000,
          rendererProcessMemRss: 1024,
          rendererUsagePercentage: 34.13333333333333,
          rendererMemoryThreshold: 1500,
          currentAvailableMemory: 3000,
          maxAvailableRendererMemory: 3000,
          shouldCollectGarbage: false,
          timestamp: 0,
          calculateMemoryStatsDuration: 0,
        },
        {
          getAvailableMemoryDuration: 0,
          getRendererMemoryUsageDuration: 0,
          jsHeapSizeLimit: 3000,
          totalMemoryLimit: 4000,
          rendererProcessMemRss: 2000,
          rendererUsagePercentage: 66.66666666666666,
          rendererMemoryThreshold: 1500,
          currentAvailableMemory: 3000,
          maxAvailableRendererMemory: 3000,
          shouldCollectGarbage: true,
          timestamp: 0,
          calculateMemoryStatsDuration: 0,
        },
        {
          checkMemoryPressureDuration: 0,
          testTitle: 'test',
          testOrder: 1,
          garbageCollected: true,
          timestamp: 0,
        },
      ]

      expect(gcStub).to.be.calledOnce
      expect(processesMock).to.be.calledOnce
      expect(pidStub).to.be.calledOnce
      expect(memory.default.getMemoryStats()).to.deep.eql(expected)
    })

    it('collects memory when a previous interval call goes over the threshold', async () => {
      const automation = sinon.createStubInstance(Automation)
      const gcStub = automation.request.withArgs('collect:garbage').resolves()
      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(1000),
        getTotalMemoryLimit: sinon.stub().resolves(2000),
      }

      sinon.stub(memory, 'getJsHeapSizeLimit').resolves(100)
      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      sinon.stub(memory, 'getRendererMemoryUsage')
      .onFirstCall().resolves(75) // above threshold
      .onSecondCall().resolves(25) // below threshold

      await memory.default.startProfiling(automation, { fileName: 'memory_spec' })
      await memory.default.gatherMemoryStats()
      await memory.default.checkMemoryPressure({ automation, test: { title: 'test', order: 1, currentRetry: 0 } })

      const expected = [
        {
          getAvailableMemoryDuration: 0,
          jsHeapSizeLimit: 100,
          totalMemoryLimit: 2000,
          rendererProcessMemRss: 75,
          rendererUsagePercentage: 75,
          rendererMemoryThreshold: 50,
          currentAvailableMemory: 1000,
          maxAvailableRendererMemory: 100,
          shouldCollectGarbage: true,
          timestamp: 0,
          calculateMemoryStatsDuration: 0,
        },
        {
          getAvailableMemoryDuration: 0,
          jsHeapSizeLimit: 100,
          totalMemoryLimit: 2000,
          rendererProcessMemRss: 25,
          rendererUsagePercentage: 25,
          rendererMemoryThreshold: 50,
          currentAvailableMemory: 1000,
          maxAvailableRendererMemory: 100,
          shouldCollectGarbage: false,
          timestamp: 0,
          calculateMemoryStatsDuration: 0,
        },
        {
          checkMemoryPressureDuration: 0,
          testTitle: 'test',
          testOrder: 1,
          garbageCollected: true,
          timestamp: 0,
        },
      ]

      expect(gcStub).to.be.calledOnce
      expect(memory.getRendererMemoryUsage).to.be.calledTwice
      expect(memory.default.getMemoryStats()).to.deep.eql(expected)
    })
  })

  context('#endProfiling', () => {
    it('stops the profiling', async () => {
      // restore the fake timers since we are stubbing setTimeout/clearTimeout directly
      sinon._clock.restore()

      const automation = sinon.createStubInstance(Automation)

      const mockHandler = {
        getAvailableMemory: sinon.stub().resolves(1000),
        getTotalMemoryLimit: sinon.stub().resolves(2000),
      }

      sinon.stub(memory, 'getJsHeapSizeLimit').resolves(100)
      sinon.stub(memory, 'getMemoryHandler').resolves(mockHandler)
      sinon.stub(memory, 'calculateMemoryStats').resolves()

      const timer = sinon.stub()

      sinon.stub(global, 'setTimeout').returns(timer)
      sinon.stub(global, 'clearTimeout')

      await memory.default.startProfiling(automation, { fileName: 'memory_spec' })
      await memory.default.endProfiling()

      expect(memory.calculateMemoryStats).to.be.calledOnce
      expect(global.clearTimeout).to.be.calledWith(timer)
    })

    it('saves the cumulative memory stats to a file', async () => {
      const fileStub = sinon.stub(fs, 'outputFile').withArgs('cypress/logs/memory/memory_spec.json').resolves()

      const automation = sinon.createStubInstance(Automation)

      await memory.default.startProfiling(automation, { fileName: 'memory_spec' })
      await memory.default.endProfiling()

      expect(fileStub).to.be.calledOnce
    })
  })
})
