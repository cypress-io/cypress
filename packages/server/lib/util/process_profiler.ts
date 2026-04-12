import Debug from 'debug'
import la from 'lazy-ass'
import si from 'systeminformation'
import { concatStream } from '@packages/network'

const browsers = require('../browsers')
const plugins = require('../plugins')

type Group = 'browser' | 'cypress' | 'launchpad' | 'plugin' | 'ffmpeg' | 'electron-shared' | 'other'
export type Process = si.Systeminformation.ProcessesProcessData & {
  group?: Group
}

const debug = Debug('cypress:server:util:process_profiler')
const debugVerbose = Debug('cypress-verbose:server:util:process_profiler')

const interval = Number(process.env.CYPRESS_PROCESS_PROFILER_INTERVAL) || 10000
let started = false

let groupsOverTime = {}

export const _reset = () => {
  groupsOverTime = {}
}

const formatPidDisplay = (groupedProcesses) => {
  const pids = groupedProcesses.map((p) => p.pid)
  const maxArrayLength = 6

  let display = pids.slice(0, maxArrayLength).join(', ')

  if (pids.length > maxArrayLength) {
    display += ` ... ${pids.length - maxArrayLength} more items`
  }

  return display
}

export const groupCyProcesses = ({ list }: si.Systeminformation.ProcessesData) => {
  const cyProcesses: Process[] = []
  const thisProcess: Process = list.find((p) => p.pid === process.pid)!

  la(thisProcess, 'expected to find current pid in process list', process.pid)

  const isParentProcessInGroup = (proc: Process, group: Group) => {
    return cyProcesses
    .filter((p) => p.group === group)
    .map((p) => p.pid)
    .includes(proc.parentPid)
  }

  // is this a browser process launched to run Cypress tests?
  const isBrowserProcess = (proc: Process): boolean => {
    const instance = browsers.getBrowserInstance()
    // electron will return a list of pids, since it's not a hierarchy
    const pids: number[] = instance?.allPids ? instance.allPids : [instance?.pid]

    return (pids.includes(proc.pid))
      || isParentProcessInGroup(proc, 'browser')
  }

  const isPluginProcess = (proc: Process): boolean => {
    return proc.pid === plugins.getPluginPid()
      || isParentProcessInGroup(proc, 'plugin')
  }

  // is this the renderer for the launchpad?
  const isDesktopGuiProcess = (proc: Process): boolean => {
    return proc.params?.includes('--type=renderer')
      && !isBrowserProcess(proc)
  }

  // these processes may be shared between the AUT and launchpad.
  // rather than treat them as part of the `browser` in `run` mode and have
  // their usage in `open` mode be ambiguous, just put them in their own group
  const isElectronSharedProcess = (proc: Process): boolean => {
    const isType = (type) => {
      return proc.params?.includes(`--type=${type}`)
    }

    return isType('broker')
      || isType('gpu-process')
      || isType('utility')
      || isType('zygote')
  }

  const isFfmpegProcess = (proc: Process): boolean => {
    return proc.parentPid === thisProcess.pid
      && /ffmpeg/i.test(proc.name)
  }

  const getProcessGroup = (proc: Process): Group => {
    if (proc === thisProcess) {
      return 'cypress'
    }

    if (isBrowserProcess(proc)) {
      return 'browser'
    }

    if (isPluginProcess(proc)) {
      return 'plugin'
    }

    if (isDesktopGuiProcess(proc)) {
      return 'launchpad'
    }

    if (isFfmpegProcess(proc)) {
      return 'ffmpeg'
    }

    if (isElectronSharedProcess(proc)) {
      return 'electron-shared'
    }

    return 'other'
  }

  const classifyProcess = (proc: Process) => {
    const classify = (group: Group) => {
      proc.group = group
      cyProcesses.push(proc)

      // queue all children
      list
      .filter((p) => p.parentPid === proc.pid)
      .forEach(classifyProcess)
    }

    classify(getProcessGroup(proc))
  }

  classifyProcess(thisProcess)

  return cyProcesses
}

export const _renameBrowserGroup = (processes: Process[]) => {
  const instance = browsers.getBrowserInstance()
  const displayName = instance?.browser?.displayName

  processes.forEach((proc) => {
    if (!displayName) {
      return
    }

    if (proc.group === 'browser') {
      proc.group = displayName
    }
  })

  return processes
}

export const _aggregateGroups = (processes: Process[]) => {
  debugVerbose('all Cypress-launched processes: %s', require('util').inspect(processes))

  const grouped: Record<string, Process[]> = {}

  processes.forEach((proc) => {
    const key = proc.group || 'other'

    if (!grouped[key]) {
      grouped[key] = []
    }

    grouped[key].push(proc)
  })

  const sumBy = (arr, prop: string) => arr.reduce((sum, item) => sum + (item[prop] || 0), 0)
  const meanBy = (arr, prop: string) => arr.length ? sumBy(arr, prop) / arr.length : 0
  const round = (num: number, precision: number) => {
    const factor = Math.pow(10, precision)

    return Math.round(num * factor) / factor
  }

  const groupTotals = Object.entries(grouped)
  .map(([group, groupedProcesses]) => {
    return {
      group,
      processCount: groupedProcesses.length,
      pids: formatPidDisplay(groupedProcesses),
      cpuPercent: sumBy(groupedProcesses, 'cpu'),
      memRssMb: sumBy(groupedProcesses, 'memRss') / 1024,
    }
  })
  .sort((a, b) => b.memRssMb - a.memRssMb)

  groupTotals.push(groupTotals.reduce((acc, val) => {
    acc.processCount += val.processCount
    acc.cpuPercent += val.cpuPercent
    acc.memRssMb += val.memRssMb

    return acc
  }, { group: 'TOTAL', processCount: 0, pids: '-', cpuPercent: 0, memRssMb: 0 }))

  groupTotals.forEach((total) => {
    if (!groupsOverTime[total.group]) {
      groupsOverTime[total.group] = []
    }

    const measurements = groupsOverTime[total.group]

    measurements.push(total)

    Object.assign(total, {
      meanCpuPercent: meanBy(measurements, 'cpuPercent'),
      meanMemRssMb: meanBy(measurements, 'memRssMb'),
      maxMemRssMb: Math.max(...measurements.map((m) => m.memRssMb)),
    })

    Object.keys(total).forEach((k) => {
      // round all numbers to 100ths precision
      if (typeof total[k] === 'number') {
        total[k] = round(total[k], 2)
      }
    })
  })

  return groupTotals
}

export const _printGroupedProcesses = (groupTotals) => {
  const consoleBuffer = concatStream((buf) => {
    // get rid of trailing newline
    debug(String(buf).trim())
  })

  // eslint-disable-next-line no-console
  const buffedConsole = new console.Console(consoleBuffer)

  buffedConsole.log('current & mean memory and CPU usage by process group:')
  buffedConsole.table(groupTotals, [
    'group',
    'processCount',
    'pids',
    'cpuPercent',
    'meanCpuPercent',
    'memRssMb',
    'meanMemRssMb',
    'maxMemRssMb',
  ])

  consoleBuffer.end()
}

function _checkProcesses () {
  return si.processes()
  .then(groupCyProcesses)
  .then(_renameBrowserGroup)
  .then(_aggregateGroups)
  .then(_printGroupedProcesses)
  .then(_scheduleProcessCheck)
  .catch((err) => {
    debug('error running process profiler: %o', err)
  })
}

function _scheduleProcessCheck () {
  // not setinterval, since checkProcesses is asynchronous
  setTimeout(_checkProcesses, interval)
}

export function start () {
  if (!debug.enabled && !debugVerbose.enabled) {
    debug('process profiler not enabled')

    return
  }

  if (started) {
    return
  }

  _checkProcesses().catch(() => {})

  started = true
}
