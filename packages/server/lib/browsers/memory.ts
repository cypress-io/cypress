import debugModule from 'debug'
import si from 'systeminformation'
import os from 'os'
import fs from 'fs-extra'
import { execSync, exec } from 'child_process'
import util from 'util'
import { groupCyProcesses } from '../util/process_profiler'

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

export const setup = async () => {

}

let isCgroupMemoryAvailable
let usage
export default class Memory {

  constructor (private sendDebuggerCommand: SendDebuggerCommand) {
    this.totalMemoryLimit = await this._getTotalMemoryLimit()
  }

private _isLinux () {
  return os.platform() === 'linux'
}


private _isCgroupMemoryAvailable() {
  if (isCgroupMemoryAvailable !== undefined) return isCgroupMemoryAvailable

  try {
    if (!this._isLinux()) return false

    // TODO: this is only checking for cgroup v2, we should also check and support cgroup v1
    execSync('cat /sys/fs/cgroup/memory/memory.usage_in_bytes', { encoding: 'utf8' })

    debugVerbose('cgroup memory available')

    return true
  } catch (err) {
    debugVerbose('cgroup v2 memory not available, will use system information instead')

    return false
  }
}

private _getTotalMemoryLimit() {
  let limit

  if (this._isCgroupMemoryAvailable()) {
    limit = Number(execSync('cat /sys/fs/cgroup/memory/memory.limit_in_bytes', { encoding: 'utf8' }))
  } else {
    limit = os.totalmem()
  }

  debugVerbose('total memory limit', limit)

  return limit
}

private async _getAvailableMemory() {
  let available

  if (this._isCgroupMemoryAvailable()) {
    usage = Number((await execAsync('cat /sys/fs/cgroup/memory/memory.usage_in_bytes', { encoding: 'utf8' })).stdout)
    const stats = this._getMemoryStats()

    available = totalMemoryLimit - (usage - stats.total_inactive_file)
  } else {
    available = (await si.mem()).available
  }

  debugVerbose('memory available', available)

  return available
}

export const _getMemoryStats = async () => {
  if (_isCgroupMemoryAvailable()) {
    const rawStats = (await execAsync('cat /sys/fs/cgroup/memory/memory.stat', { encoding: 'utf8' })).stdout
    const stats = rawStats.split('\n').filter(Boolean).reduce((acc, arr) => {
      const stat = arr.split(' ')

      acc[stat[0]] = stat[1]

      return acc
    }, {})

    return stats
  }

  return {}
}

export const _getJsHeapSizeLimit = async ({ sendDebuggerCommandFn }) => {
  performance.mark('get-heap-size-limit-start')
  const heapLimit = (await sendDebuggerCommandFn('Runtime.evaluate', { expression: 'performance?.memory?.jsHeapSizeLimit', returnByValue: true }))?.result?.value

  performance.mark('get-heap-size-limit-end')

  const measurement = performance.measure('getJsHeapSizeLimit', 'get-heap-size-limit-start', 'get-heap-size-limit-end')

  debugVerbose(measurement)

  return heapLimit
}

export const _findRendererProcess = async () => {
  const processes = await si.processes()

  // filter down to the renderer processes
  const groupedProcesses = groupCyProcesses(processes)
  const rendererProcesses = groupedProcesses.filter((p) => p.group === 'browser' && (p.command.includes('--type=renderer') || p.params.includes('--type=renderer')))

  if (rendererProcesses.length === 0) return null

  // assume the renderer process with the most memory is the one we're interested in
  const maxRendererProcess = rendererProcesses.reduce((prev, current) => (prev.memRss > current.memRss) ? prev : current)

  debugVerbose('renderer processes memory: %o', { pid: maxRendererProcess.pid, 'memRss(bytes)': maxRendererProcess.memRss * KIBIBYTE })

  return maxRendererProcess
}

export const checkMemoryAndCollectGarbage = async (sendDebuggerCommandFn: SendDebuggerCommand) => {
  performance.mark('check-and-collect-gc-start')

  let jsHeapSizeLimit = (await _getJsHeapSizeLimit({ sendDebuggerCommandFn }))

  if (!jsHeapSizeLimit) {
    debugVerbose('no heap size limit found, using default of four kibibytes')

    jsHeapSizeLimit = FOUR_GIBIBYTES
  }

  debugVerbose('jsHeapSizeLimit:', jsHeapSizeLimit)

  const rendererProcess = await _findRendererProcess()

  if (!rendererProcess) {
    debugVerbose('no renderer process found, skipping garbage collection')

    return
  }

  const currentAvailableMemory = await _getAvailableMemory()

  const maxAvailableRendererMemory = Math.min(jsHeapSizeLimit, currentAvailableMemory + (rendererProcess.memRss * KIBIBYTE))

  debugVerbose('maxAvailableRendererMemory:', maxAvailableRendererMemory, 'bytes')

  // only collect garbage if less than the MEMORY_THRESHOLD_PERCENTAGE of the heap left
  const shouldCollectGarbage = ((rendererProcess.memRss * KIBIBYTE) / maxAvailableRendererMemory) * 100 >= MEMORY_THRESHOLD_PERCENTAGE
  // const shouldCollectGarbage = testCount === 24

  let measurement

  const memoryStats = _getMemoryStats()

  if (shouldCollectGarbage) {
    debug('forcing garbage collection')
    performance.mark('gc-start')
    await sendDebuggerCommandFn('HeapProfiler.collectGarbage')
    performance.mark('gc-end')

    measurement = performance.measure('garbage collection', 'gc-start', 'gc-end')
    debugVerbose(measurement)
  } else {
    debug('skipping garbage collection')
  }

  performance.mark('check-and-collect-gc-end')
  const checkAndCollectGcMeasurement = performance.measure('garbage collection', 'check-and-collect-gc-start', 'check-and-collect-gc-end')

  debugVerbose(checkAndCollectGcMeasurement)

  if (debugVerbose.enabled) {
    logMemory({
      memRss: rendererProcess.memRss * KIBIBYTE,
      garbageCollected: shouldCollectGarbage,
      gcDuration: measurement?.duration,
      checkAndCollectGcDuration: checkAndCollectGcMeasurement.duration,
      currentAvailableMemory,
      maxAvailableRendererMemory,
      jsHeapSizeLimit,
      memoryStats,
    })
  }
}

let testCount = 0
const logMemory = ({ memRss, garbageCollected, gcDuration, currentAvailableMemory, maxAvailableRendererMemory, jsHeapSizeLimit, memoryStats, checkAndCollectGcDuration }) => {
  testCount++
  const log = {
    test: testCount,
    memRss,
    garbageCollected,
    gcDuration,
    // checkAndCollectGcDuration,
    currentAvailableMemory,
    maxAvailableRendererMemory,
    jsHeapSizeLimit,
    memoryStats: {
      ...memoryStats,
      usage_in_bytes: usage,
    },
  }

  fs.appendFile('/tmp/memory.json', JSON.stringify(log))
}
}
