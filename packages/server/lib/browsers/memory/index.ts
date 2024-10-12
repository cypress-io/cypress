import debugModule from 'debug'
import _ from 'lodash'
import si from 'systeminformation'
import os from 'os'
import fs from 'fs-extra'
import path from 'path'
import pid from 'pidusage'
import { groupCyProcesses, Process } from '../../util/process_profiler'
import browsers from '..'
import { telemetry } from '@packages/telemetry'

import type { Automation } from '../../automation'
import type { BrowserInstance } from '../types'

const debug = debugModule('cypress:server:browsers:memory')
const debugVerbose = debugModule('cypress-verbose:server:browsers:memory')

const MEMORY_THRESHOLD_PERCENTAGE = Number(process.env.CYPRESS_INTERNAL_MEMORY_THRESHOLD_PERCENTAGE) || 50
const MEMORY_PROFILER_INTERVAL = Number(process.env.CYPRESS_INTERNAL_MEMORY_PROFILER_INTERVAL) || 1000
const MEMORY_FOLDER = process.env.CYPRESS_INTERNAL_MEMORY_FOLDER_PATH || path.join('cypress', 'logs', 'memory')
const CYPRESS_INTERNAL_MEMORY_SAVE_STATS = process.env.CYPRESS_INTERNAL_MEMORY_SAVE_STATS || 'false'
const SAVE_MEMORY_STATS = ['1', 'true'].includes(CYPRESS_INTERNAL_MEMORY_SAVE_STATS.toLowerCase())
const CYPRESS_INTERNAL_MEMORY_SKIP_GC = process.env.CYPRESS_INTERNAL_MEMORY_SKIP_GC || 'false'
const SKIP_GC = ['1', 'true'].includes(CYPRESS_INTERNAL_MEMORY_SKIP_GC.toLowerCase())
const KIBIBYTE = 1024
const FOUR_GIBIBYTES = 4 * (KIBIBYTE ** 3)

let rendererProcess: Process | null
let handler: MemoryHandler
let totalMemoryLimit: number
let jsHeapSizeLimit: number
let browserInstance: BrowserInstance | null = null
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
 * When the spec run starts:
 *   1. set total mem limit for the container/host by reading off cgroup memory limits (if available) otherwise use os.totalmem()
 *   2. set js heap size limit by reading off the browser
 *   3. turn on memory profiler
 *
 * On a defined interval (e.g. 1s):
 *   1. set current mem available for the container/host by reading off cgroup memory usage (if available) otherwise use si.mem().available
 *   2. set current renderer mem usage
 *   3. set max avail render mem to minimum of v8 heap size limit and total available mem (current available mem + current renderer mem usage)
 *   4. calc % of memory used, current renderer mem usage / max avail render mem
 *
 * Before each test:
 *   1. if any interval exceeded the defined memory threshold (e.g. 50%), do a GC
 *
 * After the spec run ends:
 *   1. turn off memory profiler
 */

/**
 * Returns a function that wraps the provided function and measures the duration of the function.
 * @param func the function to time
 * @param opts name of the function to time and whether to save the result to the log
 * @returns a function that wraps the provided function and measures the duration of the function
 */
const measure = (func: (...args) => any, opts: { name?: string, save?: boolean } = { save: true }) => {
  return async (...args) => {
    const start = performance.now()
    const result = await func.apply(this, args)
    const duration = performance.now() - start
    const name = opts.name || func.name

    if (opts?.save) {
      if (name === 'checkMemoryPressure') {
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

/**
 * Retrieves the JS heap size limit for the browser.
 * @param automation - the automation client to use
 * @returns the JS heap size limit in bytes for the browser. If not available, returns a default of four gibibytes.
 */
export const getJsHeapSizeLimit: (automation: Automation) => Promise<number> = measure(async (automation: Automation) => {
  let heapLimit: Number

  try {
    heapLimit = (await automation.request('get:heap:size:limit', null, null)).result.value
  } catch (err) {
    debug('could not get jsHeapSizeLimit from browser, using default of four gibibytes')

    heapLimit = FOUR_GIBIBYTES
  }

  return heapLimit
}, { name: 'getJsHeapSizeLimit', save: false })

/**
 * @returns the memory handler to use based on the platform and if linux, the cgroup version
 */
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

/**
 * Attempts to find the browser's renderer process running the Cypress tests.
 * @param processes - all of the system processes
 * @returns the renderer process or null if there is no renderer process
 */
const findRendererProcess = (processes: si.Systeminformation.ProcessesData) => {
  // group the processes by their group (e.g. browser, cypress, launchpad, etc...)
  const groupedProcesses = groupCyProcesses(processes)

  // filter down to the renderer processes by looking at the 'browser' group and the command/params with type renderer
  const browserProcesses = groupedProcesses.filter((p) => p.group === 'browser')

  // if we only have one browser process assume it's the renderer process, otherwise filter down to the renderer processes
  const rendererProcesses = browserProcesses.length === 1 ? browserProcesses : browserProcesses.filter(
    (p) => p.group === 'browser' && (p.command?.includes('--type=renderer') || p.params?.includes('--type=renderer')),
  )

  // if there are no renderer processes, return null
  if (rendererProcesses.length === 0) return null

  // assume the renderer process with the most memory is the one we're interested in
  const maxRendererProcess = rendererProcesses.reduce((prev, current) => (prev.memRss > current.memRss) ? prev : current)

  debugVerbose('renderer processes found: %o', maxRendererProcess)

  return maxRendererProcess
}

/**
 * Retrieves the memory usage for the renderer process.
 * @returns the memory usage in bytes for the renderer process or null if there is no renderer process
 */
export const getRendererMemoryUsage: () => Promise<number | null> = measure(async () => {
  // if we don't have a renderer process yet, find it.
  // this is done once since the renderer process will not change
  if (!rendererProcess) {
    let process: Process | null = null
    let processes: si.Systeminformation.ProcessesData

    try {
      processes = await si.processes()
    } catch (err) {
      debug('could not get processes to find renderer process: %o', err)

      return null
    }

    process = findRendererProcess(processes)

    if (!process) return null

    // if we found a renderer process, save it so we don't have to find it again
    rendererProcess = process

    // return the memory usage for the renderer process
    return rendererProcess.memRss * KIBIBYTE
  }

  try {
    // if we have a renderer process, get the memory usage for it
    return (await pid(rendererProcess.pid)).memory
  } catch {
    // if we can't get the memory usage for the renderer process,
    // assume it's gone and clear it out so we can find it again
    rendererProcess = null

    return getRendererMemoryUsage()
  }
}, { name: 'getRendererMemoryUsage', save: true })

/**
 * Retrieves the available memory for the container/host.
 * @returns the available memory in bytes for the container/host
 */
export const getAvailableMemory: () => Promise<number> = measure(() => {
  return handler.getAvailableMemory(totalMemoryLimit, statsLog)
}, { name: 'getAvailableMemory', save: true })

/**
 * Calculates the memory stats used to determine if garbage collection should be run before the next test starts.
 */
export const calculateMemoryStats: () => Promise<void> = measure(async () => {
  // retrieve the available memory and the renderer process memory usage
  const [currentAvailableMemory, rendererProcessMemRss] = await Promise.all([
    getAvailableMemory(),
    getRendererMemoryUsage(),
  ])

  if (rendererProcessMemRss === null) {
    debug('no renderer process found, skipping memory stat collection')

    return
  }

  // the max available memory is the minimum of the js heap size limit and
  // the current available memory plus the renderer process memory usage
  const maxAvailableRendererMemory = Math.min(jsHeapSizeLimit, currentAvailableMemory + rendererProcessMemRss)

  const rendererUsagePercentage = (rendererProcessMemRss / maxAvailableRendererMemory) * 100
  // if the renderer's memory is above the MEMORY_THRESHOLD_PERCENTAGE, we should collect garbage on the next test
  const shouldCollectGarbage = rendererUsagePercentage >= MEMORY_THRESHOLD_PERCENTAGE && !SKIP_GC

  // if we should collect garbage, set the flag to true so we can collect garbage on the next test
  collectGarbageOnNextTest = collectGarbageOnNextTest || shouldCollectGarbage

  // set all the memory stats on the stats log
  statsLog.jsHeapSizeLimit = jsHeapSizeLimit
  statsLog.totalMemoryLimit = totalMemoryLimit
  statsLog.rendererProcessMemRss = rendererProcessMemRss
  statsLog.rendererUsagePercentage = rendererUsagePercentage
  statsLog.rendererMemoryThreshold = maxAvailableRendererMemory * (MEMORY_THRESHOLD_PERCENTAGE / 100)
  statsLog.currentAvailableMemory = currentAvailableMemory
  statsLog.maxAvailableRendererMemory = maxAvailableRendererMemory
  statsLog.shouldCollectGarbage = shouldCollectGarbage
  statsLog.timestamp = Date.now()
}, { name: 'calculateMemoryStats', save: true })

/**
 * Collects garbage if needed and logs the test information.
 * @param automation - the automation client used to collect garbage
 * @param test - the current test
 */
const checkMemoryPressureAndLog = async ({ automation, test }: { automation: Automation, test: { title: string, order: number, currentRetry: number }}) => {
  await checkMemoryPressure(automation)

  gcLog.testTitle = test.title
  gcLog.testOrder = Number(`${test.order}.${test.currentRetry}`)
  gcLog.garbageCollected = collectGarbageOnNextTest
  gcLog.timestamp = Date.now()

  addCumulativeStats(gcLog)

  gcLog = {}

  // clear the flag so we don't collect garbage on every test
  collectGarbageOnNextTest = false
}

/**
 * Collects the browser's garbage if it previously exceeded the threshold when it was measured.
 * @param automation the automation client used to collect garbage
 */
const checkMemoryPressure: (automation: Automation) => Promise<void> = measure(async (automation: Automation) => {
  if (collectGarbageOnNextTest) {
    debug('forcing garbage collection')
    let span

    try {
      span = telemetry.startSpan({ name: 'checkMemoryPressure:collect:garbage' })
      await automation.request('collect:garbage', null, null)
    } catch (err) {
      debug('error collecting garbage: %o', err)
    } finally {
      span?.end()
    }
  } else {
    debug('skipping garbage collection')
  }
}, { name: 'checkMemoryPressure', save: true })

/**
 * Adds the memory stats to the cumulative stats.
 * @param stats - memory stats to add to the cumulative stats
 */
const addCumulativeStats = (stats: { [key: string]: any }) => {
  debugVerbose('memory stats: %o', stats)

  if (SAVE_MEMORY_STATS) {
    cumulativeStats.push(_.clone(stats))
  }
}

/**
 * Gathers the memory stats and schedules the next check.
 */
const gatherMemoryStats = async () => {
  try {
    await calculateMemoryStats()
    addCumulativeStats(statsLog)
    statsLog = {}
  } catch (err) {
    debug('error gathering memory stats: %o', err)
  }
  scheduleMemoryCheck()
}

/**
 * Schedules the next gathering of memory stats based on the MEMORY_PROFILER_INTERVAL.
 */
const scheduleMemoryCheck = () => {
  if (started) {
    // not setinterval, since gatherMemoryStats is asynchronous
    timer = setTimeout(gatherMemoryStats, MEMORY_PROFILER_INTERVAL)
  }
}

/**
 * Starts the memory profiler.
 * @param automation - the automation client used to interact with the browser
 * @param spec - the current spec file
 */
async function startProfiling (automation: Automation, spec: { fileName: string }) {
  if (started) {
    return
  }

  debugVerbose('start memory profiler')

  try {
    // ensure we are starting from a clean state
    reset()

    started = true

    browserInstance = browsers.getBrowserInstance()

    // stop the profiler when the browser exits
    browserInstance?.once('exit', endProfiling)

    // save the current spec file name to be used later for saving the cumulative stats
    currentSpecFileName = spec?.fileName

    handler = await getMemoryHandler()

    // get the js heap size limit and total memory limit once
    // since they don't change during the spec run
    await Promise.all([
      jsHeapSizeLimit = await getJsHeapSizeLimit(automation),
      totalMemoryLimit = await handler.getTotalMemoryLimit(),
    ])

    await gatherMemoryStats()
  } catch (err) {
    debug('error starting memory profiler: %o', err)
  }
}

/**
 * Saves the cumulative stats to a file.
 */
const saveCumulativeStats = async () => {
  if (SAVE_MEMORY_STATS && currentSpecFileName) {
    try {
      // save the cumulative stats to a file named after the spec file
      await fs.outputFile(path.join(MEMORY_FOLDER, `${currentSpecFileName}.json`), JSON.stringify(cumulativeStats))
    } catch (err) {
      debugVerbose('error creating memory stats file: %o', err)
    }
  }
}

/**
 * Resets all of the state.
 */
const reset = () => {
  started = false
  rendererProcess = null
  cumulativeStats = []
  collectGarbageOnNextTest = false
  timer = null
  currentSpecFileName = null
  statsLog = {}
  gcLog = {}
  browserInstance?.removeListener('exit', endProfiling)
  browserInstance = null
}

/**
 * Ends the memory profiler.
 */
const endProfiling = async () => {
  if (!started) return

  // clear the timer
  if (timer) clearTimeout(timer)

  // save the cumulative stats to a file
  await saveCumulativeStats()

  reset()

  debugVerbose('end memory profiler')
}

/**
 * Returns all of the memory stats collected thus far.
 * @returns Array of memory stats.
 */
const getMemoryStats = () => {
  return _.clone(cumulativeStats)
}

export default {
  startProfiling,
  endProfiling,
  gatherMemoryStats,
  checkMemoryPressure: checkMemoryPressureAndLog,
  getMemoryStats,
}
