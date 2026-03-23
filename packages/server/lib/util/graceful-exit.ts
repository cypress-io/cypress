/* eslint-disable no-console */
import Debug from 'debug'
import { randomUUID } from 'crypto'
import os from 'os'

const TEARDOWN_TIMEOUT = 5000

export interface ExitStep {
  name: string
  fn: (code: number, expectedCode: number) => Promise<number | void> | void
}

export class GracefulExit {
  private static instance: GracefulExit | null = null
  private static get singleton () {
    return this.instance ?? (this.instance = new GracefulExit())
  }

  private readonly handledSignals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']
  private processTeardown: Promise<number | void> | null = null
  private steps: Map<string, ExitStep> = new Map()
  private debug: Debug.Debugger

  constructor () {
    this.debug = Debug(`cypress:server:graceful-exit:${process.pid}`)
    this.debug('initializing graceful exit in process %s', process.pid)

    for (const signal of this.handledSignals) {
      process.on(signal, async (signal) => {
        if (this.processTeardown) {
          console.log(`\n\n${signal} received during graceful exit. Forcing exit.`)
          this.forceExit()
        } else {
          console.log(`\n\n${signal} received. Gracefully exiting.`)
          await GracefulExit.exitGracefully(128 + os.constants.signals[signal])
        }
      })
    }
  }

  static addStep (teardownFn: () => Promise<void> | void, stepName?: string): string {
    GracefulExit.singleton.debug('adding step to graceful exit: %s', stepName)

    const key = randomUUID()
    const name = stepName ?? teardownFn.name ?? key

    GracefulExit.singleton.steps.set(key, { name, fn: teardownFn })

    return key
  }

  private forceExit () {
    process.exit(1)
  }

  private async flushSteps (code: number): Promise<number> {
    let hadErrors = false

    await Promise.all(Array.from(this.steps.entries()).map(async ([key, { name, fn }]) => {
      try {
        this.debug(`<${key}> executing teardown step: %s`, name)

        await fn(hadErrors ? 1 : code, code)

        this.debug(`<${key}> teardown step completed: %s`, name)
      } catch (error) {
        GracefulExit.singleton.debug(`<${key}> Error executing teardown step: ${name}`, error)
        hadErrors = true
      }
    }))

    return hadErrors ? 1 : code
  }

  static async exitGracefully (code: number): Promise<number | void> {
    const queue = GracefulExit.singleton

    if (queue.processTeardown) {
      return queue.processTeardown
    }

    let forceExitTimeout: NodeJS.Timeout | undefined = undefined

    queue.processTeardown = Promise.race([
      new Promise<number | void>(async (resolve, reject) => {
        const finalExitCode = await queue.flushSteps(code)

        queue.debug('flushSteps complete')
        queue.debug('clearing forceExitTimeout')
        clearTimeout(forceExitTimeout)

        queue.debug('exiting with code: %s', finalExitCode)
        process.exit(finalExitCode)
      }),
      new Promise<void>((resolve, reject) => {
        forceExitTimeout = setTimeout(() => {
          console.error(`Failed to gracefully exit after ${TEARDOWN_TIMEOUT}ms. Exiting with code 1. This timeout can be configured with CYPRESS_INTERNAL_TEARDOWN_TIMEOUT.`)
          queue.forceExit()
        }, TEARDOWN_TIMEOUT)
      }),
    ])

    return queue.processTeardown
  }
}
