// The SUT calls its own exports internally, which only the CJS build routes through
// the exports object, so it is loaded with the ts require hook to keep those stubs effective
import '@packages/ts/register'
import { createRequire } from 'module'
import _ from 'lodash'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock, MockInstance } from 'vitest'
import type osModule from 'os'
import type siModule from 'systeminformation'
import type fsModule from 'fs-extra'
import type browsersModule from '../../../../lib/browsers'

type MemoryModule = typeof import('../../../../lib/browsers/memory')

// Same CJS instances the SUT's require() sees
const requireCjs = createRequire(import.meta.url)
const os: typeof osModule = requireCjs('os')
const si: typeof siModule = requireCjs('systeminformation')
const fs: typeof fsModule = requireCjs('fs-extra')
const browsers: typeof browsersModule = requireCjs('../../../../lib/browsers').default

const memoryPath = requireCjs.resolve('../../../../lib/browsers/memory')
const requireFromMemory = createRequire(memoryPath)

// Loads a fresh copy of the SUT, so its module-level env reads and state start over
const loadMemory = (stubs: Record<string, unknown> = {}): MemoryModule => {
  const previous = new Map<string, NodeModule | undefined>()

  for (const [name, exports] of Object.entries(stubs)) {
    const resolved = requireFromMemory.resolve(name)

    previous.set(resolved, requireCjs.cache[resolved])
    requireCjs.cache[resolved] = { exports } as NodeModule
  }

  previous.set(memoryPath, requireCjs.cache[memoryPath])
  delete requireCjs.cache[memoryPath]

  try {
    return requireCjs(memoryPath)
  } finally {
    for (const [resolved, mod] of previous) {
      if (mod) {
        requireCjs.cache[resolved] = mod
      } else {
        delete requireCjs.cache[resolved]
      }
    }
  }
}

type AnyMock = Mock<(...args: any[]) => any> | MockInstance<(...args: any[]) => any>

const matchesLeadingArgs = (args: unknown[], expected: unknown[]) => _.isEqual(args.slice(0, expected.length), expected)

type Answer = [unknown[], () => unknown]

const argMatchers = new WeakMap<AnyMock, Answer[]>()

// sinon `withArgs`: a call whose leading args match gets that behavior, any other call returns undefined
const argMatcher = (mock: AnyMock) => {
  const answers = argMatchers.get(mock) ?? []

  if (!argMatchers.has(mock)) {
    argMatchers.set(mock, answers)
    mock.mockImplementation((...args: unknown[]) => answers.find(([expected]) => matchesLeadingArgs(args, expected))?.[1]())
  }

  const add = (answer: Answer) => {
    answers.push(answer)
  }

  return {
    withArgs: (...expected: unknown[]) => {
      return {
        resolves: (value?: unknown) => add([expected, () => Promise.resolve(value)]),
        rejects: (err: Error) => add([expected, () => Promise.reject(err)]),
        throws: (err: Error) => {
          add([expected, () => {
            throw err
          }])
        },
      }
    },
  }
}

const callsWith = (mock: AnyMock, ...expected: unknown[]) => mock.mock.calls.filter((args) => matchesLeadingArgs(args, expected))

const createAutomation = () => ({ request: vi.fn() }) as any

const originalEnv = { ...process.env }

describe('lib/browsers/memory', () => {
  let memory: MemoryModule

  beforeAll(() => {
    process.env.CYPRESS_INTERNAL_MEMORY_SAVE_STATS = 'true'

    memory = loadMemory()
  })

  beforeEach(() => {
    vi.useFakeTimers({ now: 0 })
  })

  afterEach(async () => {
    await memory.default.endProfiling()

    vi.useRealTimers()
    vi.restoreAllMocks()
    process.env = { ...originalEnv }
  })

  describe('#getJsHeapSizeLimit', () => {
    it('retrieves the jsHeapSizeLimit from performance.memory', async () => {
      const automation = createAutomation()

      argMatcher(automation.request).withArgs('get:heap:size:limit', null, null).resolves({ result: { value: 50 } })

      expect(await memory.getJsHeapSizeLimit(automation)).toBe(50)
    })

    it('defaults the jsHeapSizeLimit to four gibibytes', async () => {
      const automation = createAutomation()

      argMatcher(automation.request).withArgs('get:heap:size:limit', null, null).throws(new Error('performance not available'))

      expect(await memory.getJsHeapSizeLimit(automation)).toBe(4294967296)
    })
  })

  describe('#getMemoryHandler', () => {
    it('returns "default" for non-linux', async () => {
      const defaultHandler = requireCjs('../../../../lib/browsers/memory/default').default

      vi.spyOn(os, 'platform').mockReturnValue('darwin')

      expect(await memory.getMemoryHandler()).toBe(defaultHandler)
    })

    it('returns "cgroup-v1" for linux cgroup v1', async () => {
      const cgroupV1Handler = requireCjs('../../../../lib/browsers/memory/cgroup-v1').default

      vi.spyOn(os, 'platform').mockReturnValue('linux')
      argMatcher(vi.spyOn(fs, 'pathExists')).withArgs('/sys/fs/cgroup/cgroup.controllers').resolves(false)

      expect(await memory.getMemoryHandler()).toBe(cgroupV1Handler)
    })

    it('returns "cgroup-v2" for linux cgroup v2 when the cgroup has a memory limit', async () => {
      const cgroupV2Handler = requireCjs('../../../../lib/browsers/memory/cgroup-v2').default

      vi.spyOn(os, 'platform').mockReturnValue('linux')
      argMatcher(vi.spyOn(fs, 'pathExists')).withArgs('/sys/fs/cgroup/cgroup.controllers').resolves(true)

      const readFile = argMatcher(vi.spyOn(fs, 'readFile'))

      readFile.withArgs('/proc/self/cgroup', 'utf8').resolves('0::/\n')
      readFile.withArgs('/sys/fs/cgroup/memory.max', 'utf8').resolves('2147483648\n')

      expect(await memory.getMemoryHandler()).toBe(cgroupV2Handler)
    })

    it('returns "default" for linux cgroup v2 when the cgroup is unconstrained', async () => {
      const defaultHandler = requireCjs('../../../../lib/browsers/memory/default').default

      vi.spyOn(os, 'platform').mockReturnValue('linux')
      argMatcher(vi.spyOn(fs, 'pathExists')).withArgs('/sys/fs/cgroup/cgroup.controllers').resolves(true)

      const readFile = argMatcher(vi.spyOn(fs, 'readFile'))

      readFile.withArgs('/proc/self/cgroup', 'utf8').resolves('0::/\n')
      readFile.withArgs('/sys/fs/cgroup/memory.max', 'utf8').resolves('max\n')

      expect(await memory.getMemoryHandler()).toBe(defaultHandler)
    })

    it('returns "default" for linux cgroup v2 when the memory files are not readable', async () => {
      const defaultHandler = requireCjs('../../../../lib/browsers/memory/default').default

      vi.spyOn(os, 'platform').mockReturnValue('linux')
      argMatcher(vi.spyOn(fs, 'pathExists')).withArgs('/sys/fs/cgroup/cgroup.controllers').resolves(true)

      const readFile = argMatcher(vi.spyOn(fs, 'readFile'))

      readFile.withArgs('/proc/self/cgroup', 'utf8').resolves('0::/\n')
      readFile.withArgs('/sys/fs/cgroup/memory.max', 'utf8').rejects(new Error('ENOENT'))

      expect(await memory.getMemoryHandler()).toBe(defaultHandler)
    })
  })

  describe('cgroup-v2 handler', () => {
    const cgroupV2 = requireCjs('../../../../lib/browsers/memory/cgroup-v2').default

    describe('#isAvailable', () => {
      it('is true when memory.max is a numeric limit', async () => {
        const readFile = argMatcher(vi.spyOn(fs, 'readFile'))

        readFile.withArgs('/proc/self/cgroup', 'utf8').resolves('0::/\n')
        readFile.withArgs('/sys/fs/cgroup/memory.max', 'utf8').resolves('2147483648\n')

        expect(await cgroupV2.isAvailable()).toBe(true)
      })

      it('is false when the cgroup is unconstrained (memory.max is "max")', async () => {
        const readFile = argMatcher(vi.spyOn(fs, 'readFile'))

        readFile.withArgs('/proc/self/cgroup', 'utf8').resolves('0::/\n')
        readFile.withArgs('/sys/fs/cgroup/memory.max', 'utf8').resolves('max\n')

        expect(await cgroupV2.isAvailable()).toBe(false)
      })

      it('is false when memory.max is not readable', async () => {
        const readFile = argMatcher(vi.spyOn(fs, 'readFile'))

        readFile.withArgs('/proc/self/cgroup', 'utf8').resolves('0::/\n')
        readFile.withArgs('/sys/fs/cgroup/memory.max', 'utf8').rejects(new Error('ENOENT'))

        expect(await cgroupV2.isAvailable()).toBe(false)
      })

      it('resolves the cgroup path from /proc/self/cgroup on a non-containerized host', async () => {
        const readFile = argMatcher(vi.spyOn(fs, 'readFile'))

        readFile.withArgs('/proc/self/cgroup', 'utf8').resolves('0::/user.slice/user-1000.slice\n')
        // only the resolved sub-cgroup path is stubbed, so a true result proves the path was resolved
        readFile.withArgs('/sys/fs/cgroup/user.slice/user-1000.slice/memory.max', 'utf8').resolves('2147483648\n')

        expect(await cgroupV2.isAvailable()).toBe(true)
      })
    })

    describe('#getTotalMemoryLimit', () => {
      it('reads the memory limit in bytes from memory.max', async () => {
        const readFile = argMatcher(vi.spyOn(fs, 'readFile'))

        readFile.withArgs('/proc/self/cgroup', 'utf8').resolves('0::/\n')
        readFile.withArgs('/sys/fs/cgroup/memory.max', 'utf8').resolves('2147483648\n')

        expect(await cgroupV2.getTotalMemoryLimit()).toBe(2147483648)
      })
    })

    describe('#getAvailableMemory', () => {
      it('subtracts the working set (usage minus inactive file cache) from the total limit', async () => {
        const readFile = argMatcher(vi.spyOn(fs, 'readFile'))

        readFile.withArgs('/proc/self/cgroup', 'utf8').resolves('0::/\n')
        readFile.withArgs('/sys/fs/cgroup/memory.current', 'utf8').resolves('1000\n')
        readFile.withArgs('/sys/fs/cgroup/memory.stat', 'utf8').resolves('anon 400\ninactive_file 300\n')

        const log: { [key: string]: any } = {}

        // working set = 1000 - 300 = 700, available = 2000 - 700 = 1300
        expect(await cgroupV2.getAvailableMemory(2000, log)).toBe(1300)
        expect(log.totalMemoryWorkingSetUsed).toBe(700)
      })
    })
  })

  describe('cgroup-util', () => {
    const cgroupUtil = requireCjs('../../../../lib/browsers/memory/cgroup-util')

    describe('#parseMemoryStat', () => {
      it('parses `key value` lines into a numeric lookup', () => {
        expect(cgroupUtil.parseMemoryStat('anon 400\ninactive_file 300\n')).toStrictEqual({ anon: 400, inactive_file: 300 })
      })
    })

    describe('#availableFromWorkingSet', () => {
      it('returns the limit minus the working set and records it on the log', () => {
        const log: { [key: string]: any } = {}

        // working set = 1000 - 300 = 700, available = 2000 - 700 = 1300
        expect(cgroupUtil.availableFromWorkingSet(2000, 1000, 300, log)).toBe(1300)
        expect(log.totalMemoryWorkingSetUsed).toBe(700)
      })
    })
  })

  describe('#startProfiling', () => {
    it('starts the profiling', async () => {
      // restore the fake timers since we are stubbing setTimeout directly
      vi.useRealTimers()

      const automation = createAutomation()

      const mockHandler = {
        getAvailableMemory: vi.fn().mockResolvedValue(1000),
        getTotalMemoryLimit: vi.fn().mockResolvedValue(2000),
      }

      vi.spyOn(memory, 'getJsHeapSizeLimit').mockResolvedValue(100)
      vi.spyOn(memory, 'getMemoryHandler').mockResolvedValue(mockHandler)
      vi.spyOn(memory, 'calculateMemoryStats').mockResolvedValue(undefined)

      vi.spyOn(globalThis, 'setTimeout').mockImplementation((() => undefined) as any).mockImplementationOnce((async (fn: () => Promise<void>) => {
        await fn()
      }) as any)

      await memory.default.startProfiling(automation, { fileName: 'memory_spec' })

      expect(memory.calculateMemoryStats).toHaveBeenCalledTimes(2)
    })

    it('doesn\'t start twice', async () => {
      const automation = createAutomation()

      const mockHandler = {
        getAvailableMemory: vi.fn().mockResolvedValue(1000),
        getTotalMemoryLimit: vi.fn().mockResolvedValue(2000),
      }

      vi.spyOn(memory, 'getJsHeapSizeLimit').mockResolvedValue(100)
      vi.spyOn(memory, 'getMemoryHandler').mockResolvedValue(mockHandler)
      vi.spyOn(memory, 'calculateMemoryStats').mockResolvedValue(undefined)

      await memory.default.startProfiling(automation, { fileName: 'memory_spec' })

      // second call doesn't do anything
      await memory.default.startProfiling(automation, { fileName: 'memory_spec' })

      expect(memory.calculateMemoryStats).toHaveBeenCalledOnce()
    })
  })

  describe('#checkMemoryPressure', () => {
    it('collects memory when renderer process is greater than the default threshold', async () => {
      const automation = createAutomation()

      argMatcher(automation.request).withArgs('collect:garbage').resolves()
      const mockHandler = {
        getAvailableMemory: vi.fn().mockResolvedValue(1000),
        getTotalMemoryLimit: vi.fn().mockResolvedValue(2000),
      }

      vi.spyOn(memory, 'getJsHeapSizeLimit').mockResolvedValue(100)
      vi.spyOn(memory, 'getMemoryHandler').mockResolvedValue(mockHandler)
      vi.spyOn(memory, 'getRendererMemoryUsage').mockResolvedValue(75)

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

      expect(callsWith(automation.request, 'collect:garbage')).toHaveLength(1)
      expect(memory.default.getMemoryStats()).toStrictEqual(expected)
    })

    it('collects memory when renderer process is greater than the custom threshold', async () => {
      process.env.CYPRESS_INTERNAL_MEMORY_THRESHOLD_PERCENTAGE = '25'
      process.env.CYPRESS_INTERNAL_MEMORY_SAVE_STATS = 'true'

      const memory = loadMemory()

      const automation = createAutomation()

      argMatcher(automation.request).withArgs('collect:garbage').resolves()
      const mockHandler = {
        getAvailableMemory: vi.fn().mockResolvedValue(1000),
        getTotalMemoryLimit: vi.fn().mockResolvedValue(2000),
      }

      vi.spyOn(memory, 'getJsHeapSizeLimit').mockResolvedValue(100)
      vi.spyOn(memory, 'getMemoryHandler').mockResolvedValue(mockHandler)
      vi.spyOn(memory, 'getRendererMemoryUsage').mockResolvedValue(25)

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

      expect(callsWith(automation.request, 'collect:garbage')).toHaveLength(1)
      expect(memory.default.getMemoryStats()).toStrictEqual(expected)
    })

    it('collects memory when renderer process is equal to the threshold', async () => {
      const automation = createAutomation()

      argMatcher(automation.request).withArgs('collect:garbage').resolves()
      const mockHandler = {
        getAvailableMemory: vi.fn().mockResolvedValue(1000),
        getTotalMemoryLimit: vi.fn().mockResolvedValue(2000),
      }

      vi.spyOn(memory, 'getJsHeapSizeLimit').mockResolvedValue(100)
      vi.spyOn(memory, 'getMemoryHandler').mockResolvedValue(mockHandler)
      vi.spyOn(memory, 'getRendererMemoryUsage').mockResolvedValue(50)

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

      expect(callsWith(automation.request, 'collect:garbage')).toHaveLength(1)
      expect(memory.default.getMemoryStats()).toStrictEqual(expected)
    })

    it('uses the available memory limit if it\'s less than the jsHeapSizeLimit', async () => {
      const automation = createAutomation()

      argMatcher(automation.request).withArgs('collect:garbage').resolves()
      const mockHandler = {
        getAvailableMemory: vi.fn().mockResolvedValue(10),
        getTotalMemoryLimit: vi.fn().mockResolvedValue(2000),
      }

      vi.spyOn(memory, 'getJsHeapSizeLimit').mockResolvedValue(100)
      vi.spyOn(memory, 'getMemoryHandler').mockResolvedValue(mockHandler)
      vi.spyOn(memory, 'getRendererMemoryUsage').mockResolvedValue(25)

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

      expect(callsWith(automation.request, 'collect:garbage')).toHaveLength(1)
      expect(memory.default.getMemoryStats()).toStrictEqual(expected)
    })

    it('skips collecting memory when renderer process is less than the threshold', async () => {
      const automation = createAutomation()

      argMatcher(automation.request).withArgs('collect:garbage').resolves()
      const mockHandler = {
        getAvailableMemory: vi.fn().mockResolvedValue(1000),
        getTotalMemoryLimit: vi.fn().mockResolvedValue(2000),
      }

      vi.spyOn(memory, 'getJsHeapSizeLimit').mockResolvedValue(100)
      vi.spyOn(memory, 'getMemoryHandler').mockResolvedValue(mockHandler)
      vi.spyOn(memory, 'getRendererMemoryUsage').mockResolvedValue(25)

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

      expect(callsWith(automation.request, 'collect:garbage')).toHaveLength(0)
      expect(memory.default.getMemoryStats()).toStrictEqual(expected)
    })

    it('skips collecting memory if the renderer process is not found', async () => {
      const automation = createAutomation()

      argMatcher(automation.request).withArgs('collect:garbage').resolves()
      const mockHandler = {
        getAvailableMemory: vi.fn().mockResolvedValue(1000),
        getTotalMemoryLimit: vi.fn().mockResolvedValue(2000),
      }

      vi.spyOn(si, 'processes').mockResolvedValue({ list: [
        { name: 'foo', pid: process.pid },
      ] })

      vi.spyOn(memory, 'getJsHeapSizeLimit').mockResolvedValue(100)
      vi.spyOn(memory, 'getMemoryHandler').mockResolvedValue(mockHandler)

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

      expect(callsWith(automation.request, 'collect:garbage')).toHaveLength(0)
      expect(memory.default.getMemoryStats()).toStrictEqual(expected)
    })

    it('finds the renderer process from the process.command', async () => {
      const automation = createAutomation()

      argMatcher(automation.request).withArgs('collect:garbage').resolves()
      const mockHandler = {
        getAvailableMemory: vi.fn().mockResolvedValue(2000),
        getTotalMemoryLimit: vi.fn().mockResolvedValue(3000),
      }

      const processesMock = vi.spyOn(si, 'processes').mockResolvedValue({ list: [
        { name: 'cypress', pid: process.pid },
        { name: 'browser', pid: 1234, parentPid: process.pid, command: 'browser.exe' },
        { name: 'renderer', pid: 12345, parentPid: 1234, command: '--type=renderer', memRss: 1 },
      ] })

      vi.spyOn(browsers, 'getBrowserInstance').mockReturnValue({
        pid: 1234,
        once: vi.fn().mockResolvedValue(undefined),
        removeListener: vi.fn(),
      })

      vi.spyOn(memory, 'getJsHeapSizeLimit').mockResolvedValue(2000)
      vi.spyOn(memory, 'getMemoryHandler').mockResolvedValue(mockHandler)

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

      expect(callsWith(automation.request, 'collect:garbage')).toHaveLength(1)
      expect(processesMock).toHaveBeenCalledOnce()
      expect(memory.default.getMemoryStats()).toStrictEqual(expected)
    })

    it('finds the renderer process from the process.params', async () => {
      const automation = createAutomation()

      argMatcher(automation.request).withArgs('collect:garbage').resolves()
      const mockHandler = {
        getAvailableMemory: vi.fn().mockResolvedValue(2000),
        getTotalMemoryLimit: vi.fn().mockResolvedValue(3000),
      }

      const processesMock = vi.spyOn(si, 'processes').mockResolvedValue({ list: [
        { name: 'cypress', pid: process.pid },
        { name: 'browser', pid: 1234, parentPid: process.pid, command: 'browser.exe' },
        { name: 'renderer', pid: 12345, parentPid: 1234, command: 'browser.exe', params: '--type=renderer', memRss: 1 },
      ] })

      vi.spyOn(browsers, 'getBrowserInstance').mockReturnValue({
        pid: 1234,
        once: vi.fn().mockResolvedValue(undefined),
        removeListener: vi.fn(),
      })

      vi.spyOn(memory, 'getJsHeapSizeLimit').mockResolvedValue(2000)
      vi.spyOn(memory, 'getMemoryHandler').mockResolvedValue(mockHandler)

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

      expect(callsWith(automation.request, 'collect:garbage')).toHaveLength(1)
      expect(processesMock).toHaveBeenCalledOnce()
      expect(memory.default.getMemoryStats()).toStrictEqual(expected)
    })

    it('selects the renderer process with the most memory', async () => {
      const automation = createAutomation()

      argMatcher(automation.request).withArgs('collect:garbage').resolves()
      const mockHandler = {
        getAvailableMemory: vi.fn().mockResolvedValue(10000),
        getTotalMemoryLimit: vi.fn().mockResolvedValue(20000),
      }

      const processesMock = vi.spyOn(si, 'processes').mockResolvedValue({ list: [
        { name: 'cypress', pid: process.pid },
        { name: 'browser', pid: 1234, parentPid: process.pid, command: 'browser.exe' },
        { name: 'renderer', pid: 12345, parentPid: 1234, command: '--type=renderer', memRss: 1 },
        { name: 'max-renderer', pid: 123456, parentPid: 1234, command: '--type=renderer', memRss: 5 },
      ] })

      vi.spyOn(browsers, 'getBrowserInstance').mockReturnValue({
        pid: 1234,
        once: vi.fn().mockResolvedValue(undefined),
        removeListener: vi.fn(),
      })

      vi.spyOn(memory, 'getJsHeapSizeLimit').mockResolvedValue(10000)
      vi.spyOn(memory, 'getMemoryHandler').mockResolvedValue(mockHandler)

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

      expect(callsWith(automation.request, 'collect:garbage')).toHaveLength(1)
      expect(processesMock).toHaveBeenCalledOnce()
      expect(memory.default.getMemoryStats()).toStrictEqual(expected)
    })

    it('uses the existing process id to obtain the memory usage', async () => {
      process.env.CYPRESS_INTERNAL_MEMORY_SAVE_STATS = 'true'

      const pidStub = vi.fn().mockResolvedValue({ memory: 2000 })

      const memory = loadMemory({ pidusage: pidStub })

      const automation = createAutomation()

      argMatcher(automation.request).withArgs('collect:garbage').resolves()
      const mockHandler = {
        getAvailableMemory: vi.fn().mockResolvedValue(3000),
        getTotalMemoryLimit: vi.fn().mockResolvedValue(4000),
      }

      const processesMock = vi.spyOn(si, 'processes').mockResolvedValue({ list: [
        { name: 'cypress', pid: process.pid },
        { name: 'browser', pid: 1234, parentPid: process.pid, command: 'browser.exe' },
        { name: 'renderer', pid: 12345, parentPid: 1234, command: '--type=renderer', memRss: 1 },
      ] })

      vi.spyOn(browsers, 'getBrowserInstance').mockReturnValue({
        pid: 1234,
        once: vi.fn().mockResolvedValue(undefined),
        removeListener: vi.fn(),
      })

      vi.spyOn(memory, 'getJsHeapSizeLimit').mockResolvedValue(3000)
      vi.spyOn(memory, 'getMemoryHandler').mockResolvedValue(mockHandler)

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

      expect(callsWith(automation.request, 'collect:garbage')).toHaveLength(1)
      expect(processesMock).toHaveBeenCalledOnce()
      expect(pidStub).toHaveBeenCalledOnce()
      expect(memory.default.getMemoryStats()).toStrictEqual(expected)
    })

    it('collects memory when a previous interval call goes over the threshold', async () => {
      const automation = createAutomation()

      argMatcher(automation.request).withArgs('collect:garbage').resolves()
      const mockHandler = {
        getAvailableMemory: vi.fn().mockResolvedValue(1000),
        getTotalMemoryLimit: vi.fn().mockResolvedValue(2000),
      }

      vi.spyOn(memory, 'getJsHeapSizeLimit').mockResolvedValue(100)
      vi.spyOn(memory, 'getMemoryHandler').mockResolvedValue(mockHandler)
      vi.spyOn(memory, 'getRendererMemoryUsage')
      .mockReturnValue(undefined as any)
      .mockResolvedValueOnce(75) // above threshold
      .mockResolvedValueOnce(25) // below threshold

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

      expect(callsWith(automation.request, 'collect:garbage')).toHaveLength(1)
      expect(memory.getRendererMemoryUsage).toHaveBeenCalledTimes(2)
      expect(memory.default.getMemoryStats()).toStrictEqual(expected)
    })
  })

  describe('#endProfiling', () => {
    it('stops the profiling', async () => {
      // restore the fake timers since we are stubbing setTimeout/clearTimeout directly
      vi.useRealTimers()

      const automation = createAutomation()

      const mockHandler = {
        getAvailableMemory: vi.fn().mockResolvedValue(1000),
        getTotalMemoryLimit: vi.fn().mockResolvedValue(2000),
      }

      vi.spyOn(memory, 'getJsHeapSizeLimit').mockResolvedValue(100)
      vi.spyOn(memory, 'getMemoryHandler').mockResolvedValue(mockHandler)
      vi.spyOn(memory, 'calculateMemoryStats').mockResolvedValue(undefined)

      const timer = vi.fn()

      vi.spyOn(globalThis, 'setTimeout').mockReturnValue(timer as any)
      const clearTimeoutStub = vi.spyOn(globalThis, 'clearTimeout').mockImplementation(() => {})

      await memory.default.startProfiling(automation, { fileName: 'memory_spec' })
      await memory.default.endProfiling()

      expect(memory.calculateMemoryStats).toHaveBeenCalledOnce()
      expect(clearTimeoutStub).toHaveBeenCalledWith(timer)
    })

    it('saves the cumulative memory stats to a file', async () => {
      const outputFile = vi.spyOn(fs, 'outputFile')

      argMatcher(outputFile).withArgs('cypress/logs/memory/memory_spec.json').resolves()

      const automation = createAutomation()

      await memory.default.startProfiling(automation, { fileName: 'memory_spec' })
      await memory.default.endProfiling()

      expect(callsWith(outputFile, 'cypress/logs/memory/memory_spec.json')).toHaveLength(1)
    })
  })
})
