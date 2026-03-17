/* eslint-disable no-console */
import Debug from 'debug'
import { randomUUID } from 'crypto'
import os from 'os'

const debug = Debug('cypress:server:teardown-queue')

export interface TeardownStep {
  name: string
  fn: (code: number, expectedCode: number) => Promise<void> | void
}

export class TeardownQueue {
  private static instance: TeardownQueue | null = null
  private static get singleton () {
    return this.instance ?? (this.instance = new TeardownQueue())
  }

  private processTeardown: Promise<void[]> | null = null
  private steps: Map<string, TeardownStep> = new Map()

  constructor () {
    const signals = ['SIGINT', 'SIGTERM'] as const

    for (const signal of signals) {
      process.on(signal, async (signal) => {
        if (this.processTeardown) {
          console.log(`${signal} received during graceful exit. Forcing exit.`)
          this.forceExit()
        } else {
          console.log(`${signal} received. Gracefully exiting.`)
          await TeardownQueue.exitGracefully(128 + os.constants.signals[signal])
        }
      })
    }
  }

  static addStep (teardownFn: () => Promise<void> | void): void
  static addStep (nameOrFn: string | (() => Promise<void> | void), teardownFn?: () => Promise<void> | void): string {
    const fn: (() => Promise<void> | void) = typeof nameOrFn === 'function' ? nameOrFn : teardownFn!
    const name = typeof nameOrFn === 'string' ? nameOrFn : fn!.name
    const key = randomUUID()

    TeardownQueue.singleton.steps.set(key, { name, fn })

    return key
  }

  private forceExit () {
    process.exit(1)
  }

  static async exitGracefully (code: number): Promise<void[]> {
    let expectedCode = code === null ? 0 : code
    const queue = TeardownQueue.singleton

    if (queue.processTeardown) {
      return queue.processTeardown
    }

    let hadErrors = false

    queue.processTeardown = Promise.all(Array.from(queue.steps.values()).map(async ({ name, fn }) => {
      try {
        return await fn(hadErrors ? 1 : expectedCode, expectedCode)
      } catch (error) {
        debug(`Error executing teardown step: ${name}`, error)
        hadErrors = true
        // log & continue to attempt a graceful exit

        console.error('Error executing teardown step; continuing with teardown process.', error)
      }
    })).finally(() => {
      if (hadErrors) {
        debug('Errors were encountered during teardown process; exiting with code 1')
        process.exit(1)
      }

      process.exit(code)
    })

    return queue.processTeardown
  }
}
