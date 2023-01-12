import debugModule from 'debug'
import _ from 'lodash'
import si from 'systeminformation'
import os from 'os'
import fs from 'fs-extra'
import { performance, PerformanceObserver } from 'perf_hooks'
import { groupCyProcesses, Process } from '../../util/process_profiler'
import pid from 'pidusage'

import type { Automation } from '../../automation'
import path from 'path'

const debug = debugModule('cypress:server:browsers:memory')
const debugVerbose = debugModule('cypress-verbose:server:browsers:memory')

const MEMORY_THRESHOLD_PERCENTAGE = Number(process.env.CYPRESS_INTERNAL_MEMORY_THRESHOLD_PERCENTAGE) || 50
const MEMORY_PROFILER_INTERVAL = Number(process.env.CYPRESS_MEMORY_PROFILER_INTERVAL) || 1000
const MEMORY_FOLDER = 'cypress/logs/memory'
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
let currentSpec
let perfObserver: PerformanceObserver | null
let currentStats: { [key: string]: any } = {}

export type MemoryHandler = {
  getTotalMemoryLimit: () => Promise<number>
  getAvailableMemory: (totalMemoryLimit: number, log?: { [key: string]: any }) => Promise<number>
}

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

export const getJsHeapSizeLimit = async (automation: Automation): Promise<number> => {
  let heapLimit

  try {
    heapLimit = (await automation.request('get:heap:size:limit', null, null)).result.value
  } catch (err) {
    debug('could not get jsHeapSizeLimit from browser, using default of four gibibytes')

    heapLimit = FOUR_GIBIBYTES
  }

  return heapLimit
}

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

const _getRendererProcess = (processes: si.Systeminformation.ProcessesData) => {
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

const _getRendererMemoryUsage = async (): Promise<number | null> => {
  if (!rendererProcess) {
    let _rendererProcess: Process | null = null

    const processes = await si.processes()

    _rendererProcess = getRendererProcess(processes)

    if (!_rendererProcess) return null

    rendererProcess = _rendererProcess

    return rendererProcess.memRss * KIBIBYTE
  }

  try {
    return (await pid(rendererProcess.pid)).memory
  } catch {
    rendererProcess = null

    return getRendererMemoryUsage()
  }
}

const _getAvailableMemory = (stats: { [key: string]: any }) => {
  return handler.getAvailableMemory(totalMemoryLimit, stats)
}

const _gatherMemoryStats = async () => {
  let stats: { [key: string]: any } = {}

  const [currentAvailableMemory, rendererProcessMemRss] = await Promise.all([
    getAvailableMemory(stats),
    getRendererMemoryUsage(),
  ])

  if (rendererProcessMemRss === null) {
    debug('no renderer process found, skipping memory stat collection')

    return
  }

  const maxAvailableRendererMemory = Math.min(jsHeapSizeLimit, currentAvailableMemory + rendererProcessMemRss)

  // if we're using more than MEMORY_THRESHOLD_PERCENTAGE of the available memory, force a garbage collection
  const rendererUsagePercentage = (rendererProcessMemRss / maxAvailableRendererMemory) * 100
  const shouldCollectGarbage = rendererUsagePercentage >= MEMORY_THRESHOLD_PERCENTAGE && process.env.CYPRESS_INTERNAL_FORCE_GC !== '0'

  collectGarbageOnNextTest = collectGarbageOnNextTest || shouldCollectGarbage

  stats.rendererProcessMemRss = rendererProcessMemRss
  stats.shouldCollectGarbage = shouldCollectGarbage
  stats.rendererUsagePercentage = rendererUsagePercentage
  stats.rendererMemoryThreshold = maxAvailableRendererMemory * (MEMORY_THRESHOLD_PERCENTAGE / 100)
  stats.currentAvailableMemory = currentAvailableMemory
  stats.maxAvailableRendererMemory = maxAvailableRendererMemory
  stats.jsHeapSizeLimit = jsHeapSizeLimit
  stats.totalMemoryLimit = totalMemoryLimit
  stats.timestamp = Date.now()

  return stats
}

export const _maybeCollectGarbage = async ({ automation, test }: { automation: Automation, test: { title: string, order: number, currentRetry: number }}) => {
  const log: { [key: string]: any } = {}

  if (collectGarbageOnNextTest) {
    debug('forcing garbage collection')
    await automation.request('collect:garbage', null, null)
  } else {
    debug('skipping garbage collection')
  }

  log.testTitle = test.title
  log.testOrder = Number(`${test.order}.${test.currentRetry}`)
  log.garbageCollected = collectGarbageOnNextTest
  log.timestamp = Date.now()

  collectGarbageOnNextTest = false

  return log
}

const checkMemory = async () => {
  await gatherMemoryStats()
  scheduleMemoryCheck()
}

const scheduleMemoryCheck = () => {
  if (started) {
    // not setinterval, since checkMemory is asynchronous
    timer = setTimeout(checkMemory, MEMORY_PROFILER_INTERVAL)
  }
}

const perfObserverHandler = (list, observer) => {
  list.getEntries().forEach((entry) => {
    const { name, duration } = entry

    if (currentStats) {
      // @ts-ignore
      currentStats[`${name}Duration`] = duration
    } else {
      // @ts-ignore
      debugVerbose('%s took %dms', name, duration)
    }

    if (name === '_gatherMemoryStats' || name === '_maybeCollectGarbage') {
      // debugVerbose('memory stats: %o', combinedStats)
      if (['1', 'true'].includes(process.env.CYPRESS_INTERNAL_SAVE_MEMORY_STATS as string)) {
        cumulativeStats.push(combinedStats)
      }

      currentStats = {}
    }
  })
}

async function startProfiling (automation: Automation, spec: { fileName: string }) {
  if (started) {
    return
  }

  debugVerbose('start memory profiler')

  started = true
  currentSpec = spec

  perfObserver = new PerformanceObserver(perfObserverHandler)
  perfObserver.observe({ entryTypes: ['function'] })

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
  if (['1', 'true'].includes(process.env.CYPRESS_INTERNAL_SAVE_MEMORY_STATS as string) && currentSpec) {
    try {
      await fs.outputFile(path.join(MEMORY_FOLDER, `${currentSpec.fileName}.json`), JSON.stringify(cumulativeStats))
    } catch (err) {
      debugVerbose('error creating memory stats file: %o', err)
    }
  }

  cumulativeStats = []
}

async function endProfiling () {
  if (timer) clearTimeout(timer)

  perfObserver?.disconnect()
  started = false

  await saveCumulativeStats()

  rendererProcess = null
  cumulativeStats = []
  collectGarbageOnNextTest = false
  currentSpec = null
  perfObserver = null
  timer = null
  currentStats = {}

  debugVerbose('end memory profiler')
}

const getCumulativeStats = () => {
  return _.clone(cumulativeStats)
}

export const getRendererProcess = performance.timerify(_getRendererProcess)

export const getRendererMemoryUsage = performance.timerify(_getRendererMemoryUsage)

export const gatherMemoryStats = performance.timerify(_gatherMemoryStats)

export const maybeCollectGarbage = performance.timerify(_maybeCollectGarbage)

export const getAvailableMemory = performance.timerify(_getAvailableMemory)

export default {
  startProfiling,
  endProfiling,
  checkMemory,
  maybeCollectGarbage,
  getCumulativeStats,
}
