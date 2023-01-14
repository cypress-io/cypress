import debugModule from 'debug'
import _ from 'lodash'
import si from 'systeminformation'
import os from 'os'
import fs from 'fs-extra'
import { performance } from 'perf_hooks'
import { groupCyProcesses, Process } from '../../util/process_profiler'
import pid from 'pidusage'

import type { Automation } from '../../automation'
import path from 'path'

const debug = debugModule('cypress:server:browsers:memory')
const debugVerbose = debugModule('cypress-verbose:server:browsers:memory')

const MEMORY_THRESHOLD_PERCENTAGE = Number(process.env.CYPRESS_INTERNAL_MEMORY_THRESHOLD_PERCENTAGE) || 50
const MEMORY_PROFILER_INTERVAL = Number(process.env.CYPRESS_INTERNAL_MEMORY_PROFILER_INTERVAL) || 1000
const MEMORY_FOLDER = process.env.CYPRESS_INTERNAL_MEMORY_FOLDER_PATH || path.join('cypress', 'logs', 'memory')
const KIBIBYTE = 1024
const FOUR_GIBIBYTES = 4 * (KIBIBYTE ** 3)

let rendererProcess: Process | null
let handler: MemoryHandler
let totalMemoryLimit: number
let jsHeapSizeLimit: number
let started = false
let cumulativeStats: { [key: string]: any }[] = []
let collectGarbageOnNextTest = false
let timer: NodeJS.Timeout | null
let currentSpecFileName: string | null
let statsLog: { [key: string]: any } = {}
let gcLog: { [key: string]: any } = {}

export type MemoryHandler = {
  getTotalMemoryLimit: () => Promise<number>
  getAvailableMemory: (totalMemoryLimit: number, log?: { [key: string]: any }) => Promise<number>
}

/**
 * Algorithm:
 *
 * When the test runs starts:
 *   1. set total mem limit for the container/host by reading off cgroup memory limits (if available) otherwise use os.totalmem()
 *
 * On a defined interval (e.g. 1s):
 *   1. set current mem available for the container/host by reading off cgroup memory usage (if available) otherwise use si.mem().available
 *   2. set current renderer mem usage
 *   3. set max avail render mem to minimum of v8 heap size limit and total available mem (current available mem + current renderer mem usage)
 *   4. calc % of memory used, current renderer mem usage / max avail render mem
 *
 * Before each test:
 *   1. if that exceeds the defined memory threshold percentage (e.g. 50%) do a GC
 */

const measure = (func: (...args) => any, opts: { name?: string, save?: boolean } = { save: true }) => {
  return async (...args) => {
    const start = performance.now()
    const result = await func.apply(this, args)
    const duration = performance.now() - start
    const name = opts.name || func.name

    if (opts?.save) {
      if (name === 'maybeCollectGarbage') {
        gcLog[`${name}Duration`] = duration
      } else {
        statsLog[`${name}Duration`] = duration
      }
    } else {
      debugVerbose('%s took %dms', name, duration)
    }

    return result
  }
}

export const getJsHeapSizeLimit = measure(async (automation: Automation): Promise<number> => {
  let heapLimit

  try {
    heapLimit = (await automation.request('get:heap:size:limit', null, null)).result.value
  } catch (err) {
    debug('could not get jsHeapSizeLimit from browser, using default of four gibibytes')

    heapLimit = FOUR_GIBIBYTES
  }

  return heapLimit
}, { name: 'getJsHeapSizeLimit', save: false })

export const getMemoryHandler = async (): Promise<MemoryHandler> => {
  if (os.platform() === 'linux') {
    if (await fs.pathExists('/sys/fs/cgroup/cgroup.controllers')) {
      // cgroup v2 can use the default handler so just pass through
    } else {
      debug('using cgroup v1 memory handler')

      return (await import('./cgroup-v1')).default
    }
  }

  debug('using default memory handler')

  return (await import('./default')).default
}

const findRendererProcess = (processes: si.Systeminformation.ProcessesData) => {
  // filter down to the renderer processes
  const groupedProcesses = groupCyProcesses(processes)
  const rendererProcesses = groupedProcesses.filter(
    (p) => p.group === 'browser' && (p.command?.includes('--type=renderer') || p.params?.includes('--type=renderer')),
  )

  if (rendererProcesses.length === 0) return null

  // assume the renderer process with the most memory is the one we're interested in
  const maxRendererProcess = rendererProcesses.reduce((prev, current) => (prev.memRss > current.memRss) ? prev : current)

  debugVerbose('renderer processes found: %o', maxRendererProcess)

  return maxRendererProcess
}

export const getRendererMemoryUsage: () => Promise<number | null> = measure(async () => {
  if (!rendererProcess) {
    let process: Process | null = null

    const processes = await si.processes()

    process = await findRendererProcess(processes)

    if (!process) return null

    rendererProcess = process

    return rendererProcess.memRss * KIBIBYTE
  }

  try {
    return (await pid(rendererProcess.pid)).memory
  } catch {
    rendererProcess = null

    return getRendererMemoryUsage()
  }
}, { name: 'getRendererMemoryUsage', save: true })

export const getAvailableMemory: () => Promise<number> = measure(() => {
  return handler.getAvailableMemory(totalMemoryLimit, statsLog)
}, { name: 'getAvailableMemory', save: true })

export const gatherMemoryStats: () => Promise<void> = measure(async () => {
  const [currentAvailableMemory, rendererProcessMemRss] = await Promise.all([
    getAvailableMemory(),
    getRendererMemoryUsage(),
  ])

  if (rendererProcessMemRss === null) {
    debug('no renderer process found, skipping memory stat collection')

    return
  }

  const maxAvailableRendererMemory = Math.min(jsHeapSizeLimit, currentAvailableMemory + rendererProcessMemRss)

  // if we're using more than MEMORY_THRESHOLD_PERCENTAGE of the available memory, force a garbage collection
  const rendererUsagePercentage = (rendererProcessMemRss / maxAvailableRendererMemory) * 100
  const shouldCollectGarbage = rendererUsagePercentage >= MEMORY_THRESHOLD_PERCENTAGE && !['0', 'false'].includes(process.env.CYPRESS_INTERNAL_FORCE_GC as string)

  collectGarbageOnNextTest = collectGarbageOnNextTest || shouldCollectGarbage

  statsLog.rendererProcessMemRss = rendererProcessMemRss
  statsLog.shouldCollectGarbage = shouldCollectGarbage
  statsLog.rendererUsagePercentage = rendererUsagePercentage
  statsLog.rendererMemoryThreshold = maxAvailableRendererMemory * (MEMORY_THRESHOLD_PERCENTAGE / 100)
  statsLog.currentAvailableMemory = currentAvailableMemory
  statsLog.maxAvailableRendererMemory = maxAvailableRendererMemory
  statsLog.jsHeapSizeLimit = jsHeapSizeLimit
  statsLog.totalMemoryLimit = totalMemoryLimit
  statsLog.timestamp = Date.now()
}, { name: 'gatherMemoryStats', save: true })

const maybeCollectGarbageAndLog = async ({ automation, test }: { automation: Automation, test: { title: string, order: number, currentRetry: number }}) => {
  await maybeCollectGarbage({ automation })

  gcLog.testTitle = test.title
  gcLog.testOrder = Number(`${test.order}.${test.currentRetry}`)
  gcLog.garbageCollected = collectGarbageOnNextTest
  gcLog.timestamp = Date.now()

  addCumulativeStats(gcLog)
}

const maybeCollectGarbage = measure(async ({ automation }: { automation: Automation }) => {
  if (collectGarbageOnNextTest) {
    debug('forcing garbage collection')
    await automation.request('collect:garbage', null, null)
    collectGarbageOnNextTest = false
  } else {
    debug('skipping garbage collection')
  }
}, { name: 'maybeCollectGarbage', save: true })

const addCumulativeStats = (stats: { [key: string]: any }) => {
  debugVerbose('memory stats: %o', stats)

  if (['1', 'true'].includes(process.env.CYPRESS_INTERNAL_SAVE_MEMORY_STATS as string)) {
    cumulativeStats.push(_.clone(stats))
  }

  stats = {}
}

const checkMemory = async () => {
  try {
    await gatherMemoryStats()
    addCumulativeStats(statsLog)
  } catch (err) {
    debug('error gathering memory stats: %o', err)
  }
  scheduleMemoryCheck()
}

const scheduleMemoryCheck = () => {
  if (started) {
    // not setinterval, since checkMemory is asynchronous
    timer = setTimeout(checkMemory, MEMORY_PROFILER_INTERVAL)
  }
}

async function startProfiling (automation: Automation, spec: { fileName: string }) {
  if (started) {
    return
  }

  debugVerbose('start memory profiler')

  reset()

  started = true
  currentSpecFileName = spec?.fileName

  try {
    handler = await getMemoryHandler()

    await Promise.all([
      jsHeapSizeLimit = await getJsHeapSizeLimit(automation),
      totalMemoryLimit = await handler.getTotalMemoryLimit(),
    ])

    await checkMemory()
  } catch (err) {
    debug('error checking memory: %o', err)
  }
}

const saveCumulativeStats = async () => {
  if (['1', 'true'].includes(process.env.CYPRESS_INTERNAL_SAVE_MEMORY_STATS as string) && currentSpecFileName) {
    try {
      await fs.outputFile(path.join(MEMORY_FOLDER, `${currentSpecFileName}.json`), JSON.stringify(cumulativeStats))
    } catch (err) {
      debugVerbose('error creating memory stats file: %o', err)
    }
  }
}

const reset = () => {
  started = false
  rendererProcess = null
  cumulativeStats = []
  collectGarbageOnNextTest = false
  timer = null
  currentSpecFileName = null
  statsLog = {}
  gcLog = {}
}

const endProfiling = async () => {
  if (timer) clearTimeout(timer)

  await saveCumulativeStats()

  reset()

  debugVerbose('end memory profiler')
}

const getCumulativeStats = () => {
  return _.clone(cumulativeStats)
}

export default {
  startProfiling,
  endProfiling,
  checkMemory,
  maybeCollectGarbage: maybeCollectGarbageAndLog,
  getCumulativeStats,
}
