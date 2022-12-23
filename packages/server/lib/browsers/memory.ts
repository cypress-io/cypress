import debugModule from 'debug'
import si from 'systeminformation'
import os from 'os'
import fs from 'fs-extra'
import { execSync, exec } from 'child_process'
import util from 'util'
import { groupCyProcesses } from '../util/process_profiler'
import pid from 'pidusage'

import type { SendDebuggerCommand } from './cdp_automation'

const debug = debugModule('cypress:server:browsers:memory')
const debugVerbose = debugModule('cypress-verbose:server:browsers:memory')

const MEMORY_THRESHOLD_PERCENTAGE = 75
const KIBIBYTE = 1024
const FOUR_GIBIBYTES = 4294967296

const execAsync = util.promisify(exec)

/**
 * Algorithm:
 *
 * When Cypress first runs prior to launching the browser:
 *   1. set total mem limit for the container/host by reading off cgroup memory limits (if available) otherwise use os.totalmem()
*
* Before each test:
 *   1. set current mem usage for the container/host by reading off cgroup memory usage (if available) otherwise use si.mem().available
 *   2. set current renderer mem usage
 *   3. set max avail render mem to minimum of v8 heap size limit and (total mem limit - current mem usage + current renderer mem usage)
 *   4. calc % of memory used, current renderer mem usage / max avail render mem
 *   5. if that exceeds the defined memory threshold percentage (e.g. 50%) do a GC
 */

const isLinux = () => {
  return os.platform() === 'linux'
}

const isCgroupMemoryAvailable = () => {
  try {
    if (!isLinux()) return false

    // TODO: this is only checking for cgroup v2, we should also check and support cgroup v1
    execSync('cat /sys/fs/cgroup/memory/memory.usage_in_bytes', { encoding: 'utf8' })

    debugVerbose('cgroup memory available')

    return true
  } catch (err) {
    debugVerbose('cgroup v2 memory not available, will use system information instead')

    return false
  }
}

const getTotalMemoryLimit = () => {
  let limit

  if (isCgroupMemoryAvailable()) {
    limit = Number(execSync('cat /sys/fs/cgroup/memory/memory.limit_in_bytes', { encoding: 'utf8' }))
  } else {
    limit = os.totalmem()
  }

  debugVerbose('total memory limit', limit)

  return limit
}

const getJsHeapSizeLimit = async (sendDebuggerCommandFn) => {
  performance.mark('get-heap-size-limit-start')
  let heapLimit = (await sendDebuggerCommandFn('Runtime.evaluate', { expression: 'performance?.memory?.jsHeapSizeLimit', returnByValue: true }))?.result?.value

  if (!heapLimit) {
    debugVerbose('no heap size limit found, using default of four kibibytes')

    heapLimit = FOUR_GIBIBYTES
  }

  debugVerbose('jsHeapSizeLimit:', heapLimit)

  performance.mark('get-heap-size-limit-end')

  const measurement = performance.measure('getJsHeapSizeLimit', 'get-heap-size-limit-start', 'get-heap-size-limit-end')

  debugVerbose('getJsHeapSizeLimit took %dms', measurement.duration)

  return heapLimit
}

export default class Memory {
  private isCgroupMemoryAvailable: boolean
  private rendererProcess: any
  private testCount: number = 0

  constructor (private sendDebuggerCommand: SendDebuggerCommand, private totalMemoryLimit: number, private jsHeapSizeLimit: number) {
    this.isCgroupMemoryAvailable = isCgroupMemoryAvailable()
  }

  static async create (sendDebuggerCommand: SendDebuggerCommand) {
    const [totalMemoryLimit, jsHeapSizeLimit] = await Promise.all([getTotalMemoryLimit(), getJsHeapSizeLimit(sendDebuggerCommand)])
    const memory = new Memory(sendDebuggerCommand, totalMemoryLimit, jsHeapSizeLimit)

    return memory
  }

  private getRendererProcess = (processes: si.Systeminformation.ProcessesData) => {
    // filter down to the renderer processes
    const groupedProcesses = groupCyProcesses(processes)
    const rendererProcesses = groupedProcesses.filter((p) => p.group === 'browser' && (p.command.includes('--type=renderer') || p.params.includes('--type=renderer')))

    if (rendererProcesses.length === 0) return null

    // assume the renderer process with the most memory is the one we're interested in
    const maxRendererProcess = rendererProcesses.reduce((prev, current) => (prev.memRss > current.memRss) ? prev : current)

    debugVerbose('renderer processes memory: %o', { pid: maxRendererProcess.pid, 'memRss(bytes)': maxRendererProcess.memRss * KIBIBYTE })

    return maxRendererProcess
  }

  private async getRendererMemoryUsage () {
    let rendererProcess

    if (!this.rendererProcess) {
      performance.mark('si.processes-start')
      const processes = await si.processes()

      performance.mark('si.processes-end')

      const measurement = performance.measure('si.processes', 'si.processes-start', 'si.processes-end')

      debugVerbose('si.processes took %dms', measurement.duration)

      rendererProcess = this.getRendererProcess(processes)

      this.rendererProcess = rendererProcess

      return rendererProcess.memRss * KIBIBYTE
    }

    rendererProcess = await pid(this.rendererProcess.pid)

    return rendererProcess.memory
  }

  private async getAvailableMemory () {
    let available

    if (this.isCgroupMemoryAvailable) {
      const [usageExecRes, rawStats] = await Promise.all([execAsync('cat /sys/fs/cgroup/memory/memory.usage_in_bytes', { encoding: 'utf8' }), execAsync('cat /sys/fs/cgroup/memory/memory.stat', { encoding: 'utf8' })])

      const stats = this.processRawStats(rawStats.stdout)
      const usage = Number(usageExecRes.stdout)

      available = this.totalMemoryLimit - (usage - stats.total_inactive_file)
    } else {
      available = (await si.mem()).available
    }

    debugVerbose('memory available', available)

    return available
  }

  private async processRawStats (rawStats) {
    const stats = rawStats.split('\n').filter(Boolean).reduce((acc, arr) => {
      const stat = arr.split(' ')

      acc[stat[0]] = stat[1]

      return acc
    }, {})

    return stats
  }

  async checkMemoryAndCollectGarbage (sendDebuggerCommandFn: SendDebuggerCommand) {
    performance.mark('check-mem-and-gc-start')

    const [currentAvailableMemory, rendererProcessMemRss] = await Promise.all([this.getAvailableMemory(), this.getRendererMemoryUsage()])

    const maxAvailableRendererMemory = Math.min(this.jsHeapSizeLimit, currentAvailableMemory + rendererProcessMemRss)

    debugVerbose('rendererProcess.memRss:', rendererProcessMemRss, 'bytes')

    debugVerbose('maxAvailableRendererMemory:', maxAvailableRendererMemory, 'bytes')

    // only collect garbage if less than the MEMORY_THRESHOLD_PERCENTAGE of the heap left
    const shouldCollectGarbage = (rendererProcessMemRss / maxAvailableRendererMemory) * 100 >= MEMORY_THRESHOLD_PERCENTAGE

    let measurement

    if (shouldCollectGarbage) {
      debug('forcing garbage collection')
      performance.mark('gc-start')
      await sendDebuggerCommandFn('HeapProfiler.collectGarbage')
      performance.mark('gc-end')

      measurement = performance.measure('garbage collection', 'gc-start', 'gc-end')
      debugVerbose('garbage collection took %dms', measurement.duration)
    } else {
      debug('skipping garbage collection')
    }

    performance.mark('check-mem-and-gc-end')
    const checkMemAndGcMeasurement = performance.measure('check memory and collect garbage', 'check-mem-and-gc-start', 'check-mem-and-gc-end')

    debugVerbose('checkMemoryAndCollectGarbage took %dms', checkMemAndGcMeasurement.duration)

    if (debugVerbose.enabled) {
      this.logMemory({
        memRss: rendererProcessMemRss,
        garbageCollected: shouldCollectGarbage,
        gcDuration: measurement?.duration,
        checkMemAndGcDuration: checkMemAndGcMeasurement.duration,
        currentAvailableMemory,
        maxAvailableRendererMemory,
        jsHeapSizeLimit: this.jsHeapSizeLimit,
        // memoryStats,
      })
    }
  }

  private logMemory ({ memRss, garbageCollected, gcDuration, currentAvailableMemory, maxAvailableRendererMemory, jsHeapSizeLimit, checkMemAndGcDuration }) {
    this.testCount++
    const log = {
      test: this.testCount,
      memRss,
      garbageCollected,
      gcDuration,
      checkMemAndGcDuration,
      currentAvailableMemory,
      maxAvailableRendererMemory,
      jsHeapSizeLimit,
      // memoryStats: {
      //   ...memoryStats,
      // },
    }

    fs.appendFile('/tmp/memory.json', JSON.stringify(log))
  }
}
