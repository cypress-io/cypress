import _ from 'lodash'
import { concatStream } from '@packages/network'
import Debug from 'debug'
import la from 'lazy-ass'
import si from 'systeminformation'

const debug = Debug('cypress:server:util:process_profiler')
const debugVerbose = Debug('cypress-verbose:server:util:process_profiler')

const interval = Number(process.env.CYPRESS_PROCESS_PROFILER_INTERVAL) || 10000
let started = false

let groupsOverTime = {}

function checkProcesses () {
  si.processes()
  .then(({ list }) => {
    let knownParents: number[] = [process.pid]
    let cyProcesses: Set<si.Systeminformation.ProcessesProcessData> = new Set()

    const thisProcess = _.find(list, { pid: process.pid })

    la(thisProcess, 'expected to find current pid in process list')
    cyProcesses.add(thisProcess!)

    function findNewChildren () {
      return _.filter(list, (v) => {
        return knownParents.includes(v.parentPid) && !cyProcesses.has(v)
      })
    }

    let newChildren: si.Systeminformation.ProcessesProcessData[] = []

    // build the proc tree one layer at a time until no new children can be found
    do {
      newChildren = findNewChildren()
      newChildren.forEach((child) => {
        cyProcesses.add(child)
        knownParents.push(child.pid)
      })
    } while (newChildren.length > 0)

    return Array.from(cyProcesses.values())
  })
  .then((processes) => {
    debugVerbose('all Cypress-launched processes: %o', processes)

    const consoleBuffer = concatStream(debug)
    // eslint-disable-next-line no-console
    const buffedConsole = new console.Console(consoleBuffer)

    const groupTotals = _.chain(processes)
    .groupBy((proc) => proc!.name.split(' ')[0])
    .mapValues((groupedProcesses, groupName) => {
      return {
        groupName,
        processCount: groupedProcesses.length,
        pids: _.map(groupedProcesses, _.property('pid')),
        totalCpuPercent: _.sumBy(groupedProcesses, 'pcpu'),
        totalMemRssMb: _.sumBy(groupedProcesses, 'mem_rss') / 1024,
      }
    })
    .values()
    .sortBy('totalMemRssMb')
    .reverse()
    .value()

    buffedConsole.log('current & mean memory and CPU usage by process group:')
    groupTotals.push(_.reduce(groupTotals, (acc, val) => {
      acc.processCount += val.processCount
      acc.totalCpuPercent += val.totalCpuPercent
      acc.totalMemRssMb += val.totalMemRssMb

      return acc
    }, { groupName: '[TOTAL]', processCount: 0, pids: [], totalCpuPercent: 0, totalMemRssMb: 0 }))

    groupTotals.forEach((total) => {
      if (!groupsOverTime[total.groupName]) {
        groupsOverTime[total.groupName] = []
      }

      const measurements = groupsOverTime[total.groupName]

      measurements.push(total)

      _.merge(total, {
        meanProcessCount: _.meanBy(measurements, 'processCount'),
        meanCpuPercent: _.meanBy(measurements, 'totalCpuPercent'),
        meanMemRssMb: _.meanBy(measurements, 'totalMemRssMb'),
        maxMemRssMb: _.max(_.map(measurements, _.property('totalMemRssMb'))),
      })

      _.forEach(total, (v, k) => {
        // round all numbers to 100ths precision
        if (_.isNumber(v)) {
          total[k] = _.round(v, 2)
        }
      })
    })

    buffedConsole.table(groupTotals, [
      'groupName',
      'processCount',
      'meanProcessCount',
      'pids',
      'totalCpuPercent',
      'meanCpuPercent',
      'totalMemRssMb',
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
  if (!debug.enabled) {
    debug('process profiler not enabled')

    return
  }

  if (started) {
    return
  }

  checkProcesses()

  started = true
}
