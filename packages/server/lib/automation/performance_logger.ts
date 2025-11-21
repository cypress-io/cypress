import { randomUUID } from 'crypto'
import { createWriteStream, writeFileSync, mkdirSync } from 'fs'
import path from 'path'

import Debug from 'debug'

import type { CommandPerformanceEntry } from '@packages/types'
import type { WriteStream } from 'fs'

const debugVerbose = Debug('cypress-verbose:server:automation:performance-logger')
const debug = Debug('cypress:server:automation:performance-logger')
const commandPerformanceDebug = Debug('cypress-verbose:performance:command')

export class PerformanceLogger {
  static get enabled (): boolean {
    return ['1', 'true'].includes(process.env.CYPRESS_INTERNAL_COMMAND_PERFORMANCE_LOGGING ?? 'false')
  }

  static async close (): Promise<void> {
    if (!PerformanceLogger.enabled) {
      return
    }

    try {
      await this.instance?.close()
    } catch (error) {
      debug('error closing performance logger: %s', error)
    }
  }

  static async write (entry: CommandPerformanceEntry): Promise<void> {
    if (PerformanceLogger.enabled) {
      try {
        await this.instance?.write(entry)
      } catch (error) {
        debugVerbose('error writing performance entry: %s', error)
      }
    }

    if (commandPerformanceDebug.enabled) {
      try {
        this.instance?.writeToDebugger(entry)
      } catch (error) {
        debugVerbose('error writing performance entry to debugger: %s', error)
      }
    }
  }

  private static _instance: PerformanceLogger | undefined = undefined

  private static get instance () {
    if (!PerformanceLogger._instance && PerformanceLogger.enabled) {
      PerformanceLogger._instance = new PerformanceLogger()
    }

    return PerformanceLogger._instance
  }

  private logWriter: WriteStream | undefined = undefined
  private readonly columns: (keyof CommandPerformanceEntry)[] = [
    'startTime',
    'duration',
    'name',
  ]

  private commandDebuggers: Map<string, ReturnType<typeof Debug>> = new Map()

  private backpressurePause: Promise<void> | undefined = undefined

  private constructor () {
    const filePath = path.join(process.cwd(), 'cypress', 'logs')
    const fileName = `performance-${randomUUID()}.csv`

    mkdirSync(filePath, { recursive: true })
    writeFileSync(path.join(filePath, fileName), `${this.columns.join(',')}\n`, { flag: 'w' })
    this.logWriter = createWriteStream(path.join(filePath, fileName), { flags: 'a' })
    this.logWriter.on('error', (err) => {
      debugVerbose('error writing performance entry: %s', err)
    })
  }

  private async write (entry: CommandPerformanceEntry): Promise<void> {
    if (this.logWriter?.closed) {
      debugVerbose('log writer is closed, skipping write')

      return
    }

    if (this.backpressurePause) {
      await this.backpressurePause
      this.backpressurePause = undefined
    }

    const row = this.columns.map((column) => this.escapeCsvValue(entry[column])).join(',')

    const canWrite = this.logWriter?.write(`${row}\n`)

    if (!canWrite) {
      this.backpressurePause = this.backpressurePause ?? new Promise((resolve) => {
        this.logWriter?.once('drain', () => {
          resolve()
        })
      })
    }
  }

  private writeToDebugger (entry: CommandPerformanceEntry): void {
    if (!this.commandDebuggers.has(entry.name)) {
      this.commandDebuggers.set(entry.name, Debug(`${commandPerformanceDebug.namespace}:${entry.name}`))
    }

    this.commandDebuggers.get(entry.name)?.('%d ms', entry.duration)
  }

  private async close (): Promise<void> {
    if (this.logWriter?.closed || !this.logWriter) {
      return
    }

    const cleanup = () => {
      this.logWriter?.removeAllListeners()
      this.logWriter = undefined
    }

    return Promise.race<void>([
      new Promise((resolve) => {
        this.logWriter?.once('close', () => {
          cleanup()
          resolve()
        })

        this.logWriter?.end()
      }),
      new Promise((resolve) => {
        setTimeout(() => {
          cleanup()
          resolve()
        }, 5000)
      }),
    ])
  }

  /**
   * Escapes a value for CSV format according to RFC 4180.
   * - If the value contains comma, newline, or double quote, wrap it in double quotes
   * - Escape any double quotes within the value by doubling them
   */
  private escapeCsvValue (value: string | number): string {
    const stringValue = String(value)

    // If value contains comma, newline, or double quote, wrap in quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      // Escape double quotes by doubling them
      return `"${stringValue.replace(/"/g, '""')}"`
    }

    return stringValue
  }
}
