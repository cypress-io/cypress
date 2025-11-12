import Debug from 'debug'
import type { CommandPerformanceEntry } from '@packages/types'
import path from 'path'
import fs from 'fs/promises'
import fsSync from 'fs'

const debug = Debug('cypress-verbose:server:automation:commands:record_performance_entry')

function logFilePath () {
  return process.env.CYPRESS_INTERNAL_PERFORMANCE_LOG_FILE_PATH ?? path.join(process.cwd(), 'cypress', 'logs')
}

function performanceLogsEnabled () {
  return ['1', 'true'].includes(process.env.CYPRESS_INTERNAL_COMMAND_PERFORMANCE_LOGGING ?? 'false')
}

const COLUMNS = [
  'startTime',
  'duration',
  'name',
  'numElements',
  'runnable',
  'spec',
]

export function initializePerformanceLogFile () {
  if (!performanceLogsEnabled()) {
    return
  }

  debug('initializing performance log file: %s', path.join(logFilePath(), 'performance.log'))

  fsSync.mkdirSync(logFilePath(), { recursive: true })
  fsSync.writeFileSync(path.join(logFilePath(), 'performance.log'), `${COLUMNS.join(',')}\n`, { flag: 'w' })
}

export async function recordPerformanceEntry (entry: CommandPerformanceEntry) {
  debug('recording performance entry %o', entry)

  if (!performanceLogsEnabled()) {
    return
  }

  const {
    startTime,
    duration,
    name,
    detail: {
      numElements,
      runnable: {
        title,
        type,
      },
      spec,
    },
  } = entry

  await fs.writeFile(
    path.join(logFilePath(), 'performance.log'),
    [startTime, duration, name, numElements, `${title} (${type})`, spec].join(',') + '\n',
    { flag: 'a' },
  )
}
