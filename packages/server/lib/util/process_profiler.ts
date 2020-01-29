import Debug from 'debug'
import la from 'lazy-ass'
import _ from 'lodash'
import si from 'systeminformation'
import { concatStream } from '@packages/network'

const { getBrowserPid } = require('../browsers')
const { getPluginPid } = require('../plugins')
const { getFfmpegPid } = require('../video_capture')

type Group = 'browser' | 'cypress' | 'plugin' | 'desktop-gui' | 'ffmpeg' | 'electron-shared' | 'other'
type Process = si.Systeminformation.ProcessesProcessData & {
  group?: Group
}

const debug = Debug('cypress:server:util:process_profiler')
const debugVerbose = Debug('cypress-verbose:server:util:process_profiler')

const interval = Number(process.env.CYPRESS_PROCESS_PROFILER_INTERVAL) || 10000
let started = false

let groupsOverTime = {}

const formatPidDisplay = (groupedProcesses) => {
  const pids = _.map(groupedProcesses, 'pid')
  const maxArrayLength = 6

  let display = pids.slice(0, maxArrayLength).join(', ')

  if (pids.length > maxArrayLength) {
    display += ` ... ${pids.length - maxArrayLength} more items`
  }

  return display
}

function checkProcesses () {
  return si.processes()
  .then(({ list }) => {
    const cyProcesses: Process[] = []
    const thisProcess: Process = _.find(list, { pid: process.pid })!

    la(thisProcess, 'expected to find current pid in process list')

    const isParentProcessInGroup = (proc: Process, group: Group) => {
      return _.chain(cyProcesses).filter({ group }).map('pid').includes(proc.parentPid).value()
    }

    // is this a browser process launched to run Cypress tests?
    const isBrowserProcess = (proc: Process): boolean => {
      // electron will return a list of pids, since it's not a hierarchy
      const pid: number | number[] = getBrowserPid()

      debug({ pid })

      return (Array.isArray(pid) ? (pid as number[]).includes(proc.pid) : proc.pid === pid)
        || isParentProcessInGroup(proc, 'browser')
    }

    const isPluginProcess = (proc: Process): boolean => {
      return proc.pid === getPluginPid()
        || isParentProcessInGroup(proc, 'plugin')
    }

    // is this the renderer for the desktop-gui?
    const isDesktopGuiProcess = (proc: Process): boolean => {
      return proc.params.includes('--type=renderer')
        && !isBrowserProcess(proc)
    }

    // these processes may be shared between the AUT and desktop-gui
    // rather than treat them as part of the `browser` in `run` mode and have
    // their usage in `open` mode be ambiguous, just put them in their own group
    const isElectronSharedProcess = (proc: Process): boolean => {
      return proc.params.includes('--type=broker')
      || proc.params.includes('--type=gpu-process')
      || proc.params.includes('--type=utility')
      || proc.params.includes('--type=zygote')
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
        return 'desktop-gui'
      }

      if (proc.pid === getFfmpegPid()) {
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
        _.chain(list)
        .filter({ parentPid: proc.pid })
        .map(classifyProcess)
        .value()
      }

      classify(getProcessGroup(proc))
    }

    classifyProcess(thisProcess)

    return cyProcesses
  })
  .then((processes) => {
    debugVerbose('all Cypress-launched processes: %s', require('util').inspect(processes))

    const consoleBuffer = concatStream((buf) => {
      // get rid of trailing newline
      debug(String(buf).trim())
    })

    // eslint-disable-next-line no-console
    const buffedConsole = new console.Console(consoleBuffer)

    const groupTotals = _.chain(processes)
    .groupBy('group')
    .mapValues((groupedProcesses, group) => {
      return {
        group,
        processCount: groupedProcesses.length,
        pids: formatPidDisplay(groupedProcesses),
        cpuPercent: _.sumBy(groupedProcesses, 'pcpu'),
        memRssMb: _.sumBy(groupedProcesses, 'mem_rss') / 1024,
      }
    })
    .values()
    .sortBy('memRssMb')
    .reverse()
    .value()

    buffedConsole.log('current & mean memory and CPU usage by process group:')
    groupTotals.push(_.reduce(groupTotals, (acc, val) => {
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

      _.merge(total, {
        meanCpuPercent: _.meanBy(measurements, 'cpuPercent'),
        meanMemRssMb: _.meanBy(measurements, 'memRssMb'),
        maxMemRssMb: _.max(_.map(measurements, _.property('memRssMb'))),
      })

      _.forEach(total, (v, k) => {
        // round all numbers to 100ths precision
        if (_.isNumber(v)) {
          total[k] = _.round(v, 2)
        }
      })
    })

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
  })
  .then(scheduleProcessCheck)
  .catch((err) => {
    debug('error running process profiler: %o', err)
  })
}

function scheduleProcessCheck () {
  // not setinterval, since checkProcesses is asynchronous
  setTimeout(checkProcesses, interval)
}

export function start () {
  if (!debug.enabled && !debugVerbose.enabled) {
    debug('process profiler not enabled')

    return
  }

  if (started) {
    return
  }

  checkProcesses()

  started = true
}
