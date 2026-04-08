/* eslint-disable no-console */
import Debug from 'debug'
import { randomUUID } from 'crypto'
import os from 'os'

function getTeardownTimeoutMs (): number {
  const n = Number(process.env.CYPRESS_INTERNAL_TEARDOWN_TIMEOUT)

  return Number.isFinite(n) && n > 0 ? n : 5000
}

export interface ExitStep {
  name: string
  fn: (code: number) => Promise<number | void> | void
}

export type ExitStepKey = string

export class GracefulExit {
  private static instance: GracefulExit | null = null
  private static get singleton () {
    return this.instance ?? (this.instance = new GracefulExit())
  }

  private readonly handledSignals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']
  private readonly signalHandlers: Array<{ signal: NodeJS.Signals, listener: (sig: NodeJS.Signals) => void }> = []
  private processTeardown: Promise<number | void> | null = null
  private steps: Map<string, ExitStep> = new Map()
  private debug: Debug.Debugger

  constructor () {
    this.debug = Debug(`cypress:server:graceful-exit:${process.pid}`)
    this.debug('initializing graceful exit in process %s', process.pid)

    for (const sig of this.handledSignals) {
      const listener = async (received: NodeJS.Signals) => {
        if (this.processTeardown) {
          console.log(`\n\n${received} received during graceful exit. Forcing exit.`)
          process.exit(1)
        } else {
          await GracefulExit.exitGracefully(128 + os.constants.signals[received])
        }
      }

      process.on(sig, listener)
      this.signalHandlers.push({ signal: sig, listener })
    }
  }

  /**
   * Clears singleton state and signal listeners. Only for use from server unit tests
   * (when `global.IS_TEST` is set by spec_helper).
   */
  static resetForTesting (): void {
    if (!(globalThis as { IS_TEST?: boolean }).IS_TEST) {
      console.warn('GracefulExit.resetForTesting is a static harness only for unit tests')

      return
    }

    const inst = GracefulExit.instance

    if (!inst) {
      return
    }

    for (const { signal, listener } of inst.signalHandlers) {
      process.removeListener(signal, listener)
    }

    inst.steps.clear()
    inst.processTeardown = null
    GracefulExit.instance = null
  }

  static addStep (teardownFn: ExitStep['fn'], stepName?: string): ExitStepKey {
    GracefulExit.singleton.debug('adding step to graceful exit: %s', stepName)

    const key = randomUUID()
    const name = stepName ?? teardownFn.name ?? key

    GracefulExit.singleton.steps.set(key, { name, fn: teardownFn })

    return key
  }

  static removeStep (key: ExitStepKey): void {
    GracefulExit.singleton.steps.delete(key)
  }

  private async flushSteps (code: number): Promise<number> {
    let hadErrors = false

    await Promise.all(Array.from(this.steps.entries()).map(async ([key, { name, fn }]) => {
      try {
        this.debug(`<${key}> executing teardown step: %s`, name)

        await fn(code)

        this.debug(`<${key}> teardown step completed: %s`, name)
      } catch (error) {
        console.error(error)
        this.debug(`<${key}> Error executing teardown step: ${name}`, error)
        hadErrors = true
      }
    }))

    if (hadErrors) {
      console.error('Additional errors occurred during teardown. Exiting with code 1.')

      return 1
    }

    return code
  }

  private async flushAndExit (code: number): Promise<number | void> {
    let finalExitCode = code ?? 0

    try {
      finalExitCode = await this.flushSteps(code)
      this.debug('steps flushed successfully', code, finalExitCode)
    } catch (error) {
     this.debug('Error flushing steps: ', error)
      finalExitCode = 1
    } finally {
      this.processTeardown = null
      this.steps.clear()
      process.exit(finalExitCode)
    }
  }

  static async exitGracefully (code: number): Promise<number | void> {
    const exit = GracefulExit.singleton

    if (exit.processTeardown) {
      return exit.processTeardown
    }

    let forceExitTimeout: NodeJS.Timeout | undefined = undefined

    exit.processTeardown = Promise.race([
      GracefulExit.singleton.flushAndExit(code).then(() => {
        clearTimeout(forceExitTimeout)
      }),
      new Promise<void>((resolve) => {
        forceExitTimeout = setTimeout(() => {
          try {
            const ms = getTeardownTimeoutMs()

            console.error(`Failed to gracefully exit after ${ms}ms. Exiting with code 1. Configure with CYPRESS_INTERNAL_TEARDOWN_TIMEOUT (milliseconds).`)
          } catch (e) {
            console.error('Error forcing exit: ', e)
          } finally {
            clearTimeout(forceExitTimeout)
            resolve()
            process.exit(1)
          }
        }, getTeardownTimeoutMs())
      }),
    ])

    return exit.processTeardown
  }
}
