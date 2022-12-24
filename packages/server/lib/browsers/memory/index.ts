import debugModule from 'debug'
import si from 'systeminformation'
import os from 'os'
import fs from 'fs-extra'
import { groupCyProcesses } from '../../util/process_profiler'
import pid from 'pidusage'

import type { SendDebuggerCommand } from '../cdp_automation'

const debug = debugModule('cypress:server:browsers:memory')
const debugVerbose = debugModule('cypress-verbose:server:browsers:memory')

const MEMORY_THRESHOLD_PERCENTAGE = 50
const KIBIBYTE = 1024
const FOUR_GIBIBYTES = 4294967296

export type MemoryHandler = {
  getTotalMemoryLimit: () => Promise<number>
  getAvailableMemory: (totalMemoryLimit: number) => Promise<number>
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

const getJsHeapSizeLimit = async (sendDebuggerCommandFn) => {
  return measure('getJsHeapSizeLimit', async () => {
    let heapLimit = (await sendDebuggerCommandFn('Runtime.evaluate', { expression: 'performance?.memory?.jsHeapSizeLimit', returnByValue: true }))?.result?.value

    if (!heapLimit) {
      debugVerbose('no heap size limit found, using default of four kibibytes')

      heapLimit = FOUR_GIBIBYTES
    }

    debugVerbose('jsHeapSizeLimit:', heapLimit)

    return heapLimit
  })
}

const getMemoryHandler = async (): Promise<MemoryHandler> => {
  if (os.platform() === 'linux') {
    debug('using cgroup v2 memory handler')

    // TODO: need to actually check for cgroup v2
    return (await import('./cgroup-v2')).default
  }

  debug('using default memory handler')

  return (await import('./default')).default
}

const measure = (name: string, fn: () => Promise<any>) => {
  performance.mark(`${name}-start`)

  return fn().then((result) => {
    performance.mark(`${name}-end`)
    const measurement = performance.measure(name, `${name}-start`, `${name}-end`)

    debugVerbose('%s took %dms', name, measurement.duration)

    return result
  })
}

export default class Memory {
  private rendererProcess: any
  private testCount: number = 0

  constructor (private sendDebuggerCommand: SendDebuggerCommand, private handler: MemoryHandler, private totalMemoryLimit: number, private jsHeapSizeLimit: number) {}

  static async create (sendDebuggerCommand: SendDebuggerCommand) {
    const handler = await getMemoryHandler()
    const [totalMemoryLimit, jsHeapSizeLimit] = await Promise.all([handler.getTotalMemoryLimit(), getJsHeapSizeLimit(sendDebuggerCommand)])
    const memory = new Memory(sendDebuggerCommand, handler, totalMemoryLimit, jsHeapSizeLimit)

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

  private async getRendererMemoryUsage (): Promise<number | null> {
    if (!this.rendererProcess) {
      const processes = await measure('si.process', si.processes)

      const rendererProcess = this.getRendererProcess(processes)

      if (!rendererProcess) return null

      this.rendererProcess = rendererProcess

      return rendererProcess.memRss * KIBIBYTE
    }

    const rendererProcess = await measure('pid', () => pid(this.rendererProcess.pid))

    return rendererProcess.memory
  }

  async checkMemoryAndCollectGarbage (sendDebuggerCommandFn: SendDebuggerCommand) {
    return measure('checkMemoryAndCollectGarbage', async () => {
      const [currentAvailableMemory, rendererProcessMemRss] = await Promise.all([this.handler.getAvailableMemory(this.totalMemoryLimit), this.getRendererMemoryUsage()])

      if (rendererProcessMemRss === null) {
        debugVerbose('no renderer process found, skipping garbage collection')

        return
      }

      const maxAvailableRendererMemory = Math.min(this.jsHeapSizeLimit, currentAvailableMemory + rendererProcessMemRss)

      debugVerbose('rendererProcess.memRss:', rendererProcessMemRss, 'bytes')
      debugVerbose('maxAvailableRendererMemory:', maxAvailableRendererMemory, 'bytes')

      // only collect garbage if less than the MEMORY_THRESHOLD_PERCENTAGE of the heap left
      const shouldCollectGarbage = (rendererProcessMemRss / maxAvailableRendererMemory) * 100 >= MEMORY_THRESHOLD_PERCENTAGE

      if (shouldCollectGarbage) {
        debug('forcing garbage collection')
        await measure('garbage collection', () => sendDebuggerCommandFn('HeapProfiler.collectGarbage'))
      } else {
        debug('skipping garbage collection')
      }

      if (debugVerbose.enabled) {
        this.logMemory({
          memRss: rendererProcessMemRss,
          garbageCollected: shouldCollectGarbage,
          currentAvailableMemory,
          maxAvailableRendererMemory,
          jsHeapSizeLimit: this.jsHeapSizeLimit,
        })
      }
    })
  }

  private logMemory ({ memRss, garbageCollected, currentAvailableMemory, maxAvailableRendererMemory, jsHeapSizeLimit }) {
    this.testCount++
    const log = {
      test: this.testCount,
      memRss,
      garbageCollected,
      currentAvailableMemory,
      maxAvailableRendererMemory,
      jsHeapSizeLimit,
    }

    fs.appendFile('/tmp/memory.json', JSON.stringify(log))
  }
}
