import Debug from 'debug'
import type { CommandPerformanceEntry } from '@packages/types'
import path from 'path'
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
  'runnableTitle',
  'spec',
]

/**
 * Escapes a value for CSV format according to RFC 4180.
 * - If the value contains comma, newline, or double quote, wrap it in double quotes
 * - Escape any double quotes within the value by doubling them
 */
function escapeCsvValue (value: string | number): string {
  const stringValue = String(value)

  // If value contains comma, newline, or double quote, wrap in quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    // Escape double quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

export function initializePerformanceLogFile () {
  try {
    if (!performanceLogsEnabled()) {
      return
    }

    debug('initializing performance log file: %s', path.join(logFilePath(), 'performance.log'))

    fsSync.mkdirSync(logFilePath(), { recursive: true })
    fsSync.writeFileSync(path.join(logFilePath(), 'performance.log'), `${COLUMNS.join(',')}\n`, { flag: 'w' })
  } catch (error) {
    debug('error initializing performance log file: %s', error)
  }
}

export function recordPerformanceEntry (entry: CommandPerformanceEntry) {
  debug('recording performance entry %o', entry)

  if (!performanceLogsEnabled()) {
    return
  }

  const {
    startTime,
    duration,
    name,
    detail: {
      runnableTitle,
      spec,
    },
  } = entry

  const row = [
    startTime,
    duration,
    name,
    runnableTitle,
    spec,
  ].map(escapeCsvValue).join(',')

  try {
    fsSync.appendFileSync(
      path.join(logFilePath(), 'performance.log'),
      `${row}\n`,
    )
  } catch (error) {
    debug('error recording performance entry: %s', error)
  }
}
