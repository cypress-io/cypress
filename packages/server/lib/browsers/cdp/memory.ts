import debugModule from 'debug'
import si from 'systeminformation'
import browsers from '../../browsers'

const debugVerbose = debugModule('cypress-verbose:server:browsers:cdp:memory')

const MEMORY_THRESHOLD_PERCENTAGE = 50

const getJsHeapSizeLimit = async ({ sendDebuggerCommandFn }) => {
  return (await sendDebuggerCommandFn('Runtime.evaluate', { expression: 'performance?.memory?.jsHeapSizeLimit', returnByValue: true }))?.result?.value
}

const findRendererProcess = async () => {
  const processes = await si.processes()
  const instance = browsers.getBrowserInstance()
  // electron will return a list of pids, since it's not a hierarchy
  const pids: number[] = instance?.allPids ? instance.allPids : [instance?.pid]

  // filter down to renderer processes, they could be a child process (chrome, edge, etc) or the main process (electron)
  const childBrowserProcesses = processes.list.filter((process) => (pids.includes(process.parentPid) || pids.includes(process.pid)) && process.params.includes('--type=renderer'))

  // assume the renderer process with the most memory is the one we're interested in
  const maxRendererProcess = childBrowserProcesses.reduce((prev, current) => (prev.memRss > current.memRss) ? prev : current)

  debugVerbose('renderer processes memory: %o', { pid: maxRendererProcess.pid, 'memRss(bytes)': maxRendererProcess.memRss * 1024 })

  return maxRendererProcess
}

export default {
  collectGarbage: async ({ sendDebuggerCommandFn }) => {
    const jsHeapSizeLimit = await getJsHeapSizeLimit({ sendDebuggerCommandFn })

    debugVerbose('jsHeapSizeLimit:', jsHeapSizeLimit)

    const maxRendererProcess = await findRendererProcess()

    // only collect garbage if we're using more than 50% of the heap
    const shouldCollectGarbage = ((maxRendererProcess.memRss * 1024) / jsHeapSizeLimit) >= MEMORY_THRESHOLD_PERCENTAGE

    if (shouldCollectGarbage) {
      debugVerbose('forcing garbage collection')
      performance.mark('gc-start')
      await sendDebuggerCommandFn('HeapProfiler.collectGarbage')
      performance.mark('gc-end')

      debugVerbose(performance.measure('garbage collection', 'gc-start', 'gc-end'))
    } else {
      debugVerbose('skipping garbage collection')
    }
  },
}
