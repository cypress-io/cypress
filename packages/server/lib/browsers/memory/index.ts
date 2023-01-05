import debugModule from 'debug'
import si from 'systeminformation'
import os from 'os'
import fs from 'fs-extra'
import { groupCyProcesses } from '../../util/process_profiler'
import pid from 'pidusage'

import type { SendDebuggerCommand } from '../cdp_automation'

const debug = debugModule('cypress:server:browsers:memory')
const debugVerbose = debugModule('cypress-verbose:server:browsers:memory')

const MEMORY_THRESHOLD_PERCENTAGE = Number(process.env.CYPRESS_INTERNAL_MEMORY_THRESHOLD_PERCENTAGE || 50)
const KIBIBYTE = 1024
const FOUR_GIBIBYTES = 4 * 1024 * 1024 * 1024

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

export const getJsHeapSizeLimit = async (sendDebuggerCommandFn) => {
  return measure({ name: 'getJsHeapSizeLimit' }, async () => {
    let heapLimit = (await sendDebuggerCommandFn('Runtime.evaluate', { expression: 'performance.memory.jsHeapSizeLimit' })).result?.value

    if (!heapLimit) {
      debugVerbose('no heap size limit found, using default of four kibibytes')

      heapLimit = FOUR_GIBIBYTES
    }

    return heapLimit
  })
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

const measure = async ({ name, log }: { name: string, log?: {}}, fn: () => Promise<any>) => {
  performance.mark(`${name}-start`)

  const result = await fn()

  performance.mark(`${name}-end`)
  const measurement = performance.measure(name, `${name}-start`, `${name}-end`)

  if (log) {
    log[`${name}Duration`] = measurement.duration
  } else {
    debugVerbose('%s took %dms', name, measurement.duration)
  }

  return result
}

export default class Memory {
  private rendererProcess: any

  constructor (private handler: MemoryHandler, private sendDebuggerCommand, private totalMemoryLimit: number, private jsHeapSizeLimit: number) {}

  static async create (sendDebuggerCommand: SendDebuggerCommand) {
    const handler = await getMemoryHandler()
    const [totalMemoryLimit, jsHeapSizeLimit] = await Promise.all([handler.getTotalMemoryLimit(), getJsHeapSizeLimit(sendDebuggerCommand)])
    const memory = new Memory(handler, sendDebuggerCommand, totalMemoryLimit, jsHeapSizeLimit)

    return memory
  }

  private getRendererProcess = (processes: si.Systeminformation.ProcessesData) => {
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

  private async getRendererMemoryUsage (log?: { [key: string]: any }): Promise<number | null> {
    if (!this.rendererProcess) {
      let rendererProcess

      await measure({ name: 'retrieveRenderer', log }, async () => {
        const processes = await measure({ name: 'retrieveProcesses' }, si.processes)

        rendererProcess = this.getRendererProcess(processes)
      })

      if (!rendererProcess) return null

      this.rendererProcess = rendererProcess

      return rendererProcess.memRss * KIBIBYTE
    }

    const rendererProcess = await measure({ name: 'retrieveRenderer', log }, async () => await pid(this.rendererProcess.pid))

    return rendererProcess.memory
  }

  async checkMemoryAndCollectGarbage ({ test }: { test: { title: string, order: number, currentRetry: number }}) {
    const log: { [key: string]: any } | undefined = debugVerbose.enabled ? {} : undefined

    await measure({ name: 'checkMemoryAndCollectGarbage', log }, async () => {
      const [currentAvailableMemory, rendererProcessMemRss] = await Promise.all([
        this.handler.getAvailableMemory(this.totalMemoryLimit, log),
        this.getRendererMemoryUsage(log),
      ])

      if (rendererProcessMemRss === null) {
        debug('no renderer process found, skipping garbage collection')

        return
      }

      const maxAvailableRendererMemory = Math.min(this.jsHeapSizeLimit, currentAvailableMemory + rendererProcessMemRss)

      // if we're using more than MEMORY_THRESHOLD_PERCENTAGE of the available memory, force a garbage collection
      const rendererUsagePercentage = (rendererProcessMemRss / maxAvailableRendererMemory) * 100
      const shouldCollectGarbage = rendererUsagePercentage >= MEMORY_THRESHOLD_PERCENTAGE && process.env.CYPRESS_INTERNAL_FORCE_GC !== '0'

      if (shouldCollectGarbage) {
        debug('forcing garbage collection')
        await measure({ name: 'garbageCollection', log }, async () => await this.sendDebuggerCommand('HeapProfiler.collectGarbage'))
      } else {
        debug('skipping garbage collection')
      }

      if (log) {
        log.testTitle = test.title
        log.testOrder = test.order
        log.testCurrentRetry = test.currentRetry
        log.rendererProcessMemRss = rendererProcessMemRss
        log.garbageCollected = shouldCollectGarbage
        log.rendererUsagePercentage = rendererUsagePercentage
        log.rendererMemoryThreshold = maxAvailableRendererMemory * (MEMORY_THRESHOLD_PERCENTAGE / 100)
        log.currentAvailableMemory = currentAvailableMemory
        log.maxAvailableRendererMemory = maxAvailableRendererMemory
        log.jsHeapSizeLimit = this.jsHeapSizeLimit
        log.totalMemoryLimit = this.totalMemoryLimit
      }
    })

    if (log) {
      this.logMemory(log, test)
    }
  }

  private async logMemory (stats, test) {
    debugVerbose('memory stats: %o', stats)

    if (process.env.CYPRESS_INTERNAL_SAVE_MEMORY_STATS) {
      try {
        const isFirstTest = test.order === 1 && test.currentRetry === 0

        if (isFirstTest) {
          fs.writeFile(process.env.CYPRESS_INTERNAL_SAVE_MEMORY_STATS, JSON.stringify([stats]))
        } else {
          const data = await fs.readFile(process.env.CYPRESS_INTERNAL_SAVE_MEMORY_STATS, 'utf8')

          fs.writeFile(process.env.CYPRESS_INTERNAL_SAVE_MEMORY_STATS, `${data.slice(0, -1)},${JSON.stringify(stats)}]`)
        }
      } catch (e) {
        debugVerbose('error creating memory stats file: %o', e)
      }
    }
  }
}
