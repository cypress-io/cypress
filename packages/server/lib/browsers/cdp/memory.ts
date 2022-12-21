import debugModule from 'debug'
import si from 'systeminformation'
import { _groupCyProcesses } from '../../util/process_profiler'
import type { SendDebuggerCommand } from './cdp_automation'

const debugVerbose = debugModule('cypress-verbose:server:browsers:cdp:memory')

const MEMORY_THRESHOLD_PERCENTAGE = 50
const KILOBYTE = 1024

const getJsHeapSizeLimit = async ({ sendDebuggerCommandFn }) => {
  return (await sendDebuggerCommandFn('Runtime.evaluate', { expression: 'performance?.memory?.jsHeapSizeLimit', returnByValue: true }))?.result?.value
}

const findRendererProcess = async () => {
  const processes = await si.processes()

  // filter down to the renderer processes
  const groupedProcesses = _groupCyProcesses(processes)
  const rendererProcesses = groupedProcesses.filter((p) => p.group === 'browser' && (p.command.includes('--type=renderer') || p.params.includes('--type=renderer')))

  if (rendererProcesses.length === 0) return null

  // assume the renderer process with the most memory is the one we're interested in
  const maxRendererProcess = rendererProcesses.reduce((prev, current) => (prev.memRss > current.memRss) ? prev : current)

  debugVerbose('renderer processes memory: %o', { pid: maxRendererProcess.pid, 'memRss(bytes)': maxRendererProcess.memRss * KILOBYTE })

  return maxRendererProcess
}

const checkMemoryAndCollectGarbage = async (sendDebuggerCommandFn: SendDebuggerCommand) => {
  const jsHeapSizeLimit = await getJsHeapSizeLimit({ sendDebuggerCommandFn })

  debugVerbose('jsHeapSizeLimit:', jsHeapSizeLimit)

  const rendererProcess = await findRendererProcess()

  if (!rendererProcess) {
    debugVerbose('no renderer process found, skipping garbage collection')

    return
  }

  // only collect garbage if we're using more than the MEMORY_THRESHOLD_PERCENTAGE of the heap
  const shouldCollectGarbage = ((rendererProcess.memRss * KILOBYTE) / jsHeapSizeLimit) >= MEMORY_THRESHOLD_PERCENTAGE

  if (shouldCollectGarbage) {
    debugVerbose('forcing garbage collection')
    performance.mark('gc-start')
    await sendDebuggerCommandFn('HeapProfiler.collectGarbage')
    performance.mark('gc-end')

    debugVerbose(performance.measure('garbage collection', 'gc-start', 'gc-end'))
  } else {
    debugVerbose('skipping garbage collection')
  }
}

export {
  checkMemoryAndCollectGarbage,
}
