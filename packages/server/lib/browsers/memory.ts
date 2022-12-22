import debugModule from 'debug'
import si from 'systeminformation'
import os from 'os'
import fs from 'fs-extra'
import { execSync } from 'child_process'
import { groupCyProcesses } from '../util/process_profiler'

import type { SendDebuggerCommand } from './cdp_automation'

const debug = debugModule('cypress:server:browsers:memory')
const debugVerbose = debugModule('cypress-verbose:server:browsers:memory')

const MEMORY_THRESHOLD_PERCENTAGE = 75
const KIBIBYTE = 1024
const FOUR_GIBIBYTES = 4294967296

/**
 * Algorithm:
 *
 * When Cypress first runs prior to launching the browser:
 *   1. set total mem limit for the container/host by reading off cgroup memory limits (if available) otherwise use os.totalmem()
*
* Before each test:
 *   1. set current mem usage for the container/host by reading off cgroup memory usage (if available) otherwise use si.mem().available
 *   2. set current renderer mem usage
 *   3. set max avail render mem to minimum of v8 heap size limit and (total mem limit - current mem usage)
 *   4. calc % of memory used, current renderer mem usage / max avail render mem
 *   5. if that exceeds the defined memory threshold percentage (e.g. 50%) do a GC
 */

const isCgroupMemoryAvailable = (() => {
  try {
    // TODO: this is only checking for cgroup v2, we should also check and support cgroup v1
    execSync('cat /sys/fs/cgroup/memory/memory.usage_in_bytes', { encoding: 'utf8' })

    debugVerbose('cgroup memory available')

    return true
  } catch (err) {
    debugVerbose('cgroup v2 memory not available, will use system information instead')

    return false
  }
})()

const getTotalMemoryLimit = () => {
  let limit

  if (isCgroupMemoryAvailable) {
    limit = Number(execSync('cat /sys/fs/cgroup/memory/memory.limit_in_bytes', { encoding: 'utf8' }))
  } else {
    limit = os.totalmem()
  }

  debugVerbose('total memory limit', limit)

  return limit
}

const getAvailableMemory = async () => {
  let available

  if (isCgroupMemoryAvailable) {
    const usage = Number(execSync('cat /sys/fs/cgroup/memory/memory.usage_in_bytes', { encoding: 'utf8' }))

    debugVerbose('memory usage from cgroup', usage)

    available = totalMemoryLimit - usage
  } else {
    available = (await si.mem()).available
  }

  debugVerbose('memory available', available)

  return available
}

const getMemoryStats = () => {
  if (isCgroupMemoryAvailable) {
    const rawStats = execSync('cat /sys/fs/cgroup/memory/memory.stat', { encoding: 'utf8' })
    const stats = rawStats.split('\n').filter(Boolean).reduce((acc, arr) => {
      const stat = arr.split(' ')

      acc[stat[0]] = stat[1]

      return acc
    }, {})

    return stats
  }

  return {}
}

// retrieve the total memory limit for the container/host at startup
const totalMemoryLimit = getTotalMemoryLimit()

const getJsHeapSizeLimit = async ({ sendDebuggerCommandFn }) => {
  return (await sendDebuggerCommandFn('Runtime.evaluate', { expression: 'performance?.memory?.jsHeapSizeLimit', returnByValue: true }))?.result?.value
}

const findRendererProcess = async () => {
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

const checkMemoryAndCollectGarbage = async (sendDebuggerCommandFn: SendDebuggerCommand) => {
  let jsHeapSizeLimit = (await getJsHeapSizeLimit({ sendDebuggerCommandFn }))

  if (!jsHeapSizeLimit) {
    debugVerbose('no heap size limit found, using default of four kibibytes')

    jsHeapSizeLimit = FOUR_GIBIBYTES
  }

  debugVerbose('jsHeapSizeLimit:', jsHeapSizeLimit)

  const rendererProcess = await findRendererProcess()

  if (!rendererProcess) {
    debugVerbose('no renderer process found, skipping garbage collection')

    return
  }

  const currentAvailableMemory = await getAvailableMemory()

  const maxAvailableRendererMemory = Math.min(jsHeapSizeLimit, currentAvailableMemory)

  debugVerbose('maxAvailableRendererMemory:', maxAvailableRendererMemory, 'bytes')

  // only collect garbage if less than the MEMORY_THRESHOLD_PERCENTAGE of the heap left
  const shouldCollectGarbage = ((rendererProcess.memRss * KIBIBYTE) / maxAvailableRendererMemory) * 100 >= MEMORY_THRESHOLD_PERCENTAGE

  let measurement

  const memoryStats = getMemoryStats()

  if (testCount === 25) {
    debug('forcing garbage collection')
    performance.mark('gc-start')
    await sendDebuggerCommandFn('HeapProfiler.collectGarbage')
    performance.mark('gc-end')

    measurement = performance.measure('garbage collection', 'gc-start', 'gc-end')
    debugVerbose(measurement)
  } else {
    debug('skipping garbage collection')
  }

  if (debugVerbose.enabled) {
    logMemory({
      memRss: rendererProcess.memRss * KIBIBYTE,
      garbageCollected: shouldCollectGarbage,
      gcDuration: measurement?.duration,
      currentAvailableMemory,
      maxAvailableRendererMemory,
      jsHeapSizeLimit,
      memoryStats,
    })
  }
}

let testCount = 0
const logMemory = ({ memRss, garbageCollected, gcDuration, currentAvailableMemory, maxAvailableRendererMemory, jsHeapSizeLimit, memoryStats }) => {
  testCount++
  const log = {
    test: testCount,
    memRss,
    garbageCollected,
    gcDuration,
    currentAvailableMemory,
    maxAvailableRendererMemory,
    jsHeapSizeLimit,
    memoryStats: {
      ...memoryStats,
    },
  }

  fs.appendFile('/tmp/memory.json', JSON.stringify(log))
}

export {
  checkMemoryAndCollectGarbage,
}
