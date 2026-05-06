/* eslint-disable no-console */
import Debug from 'debug'
import { randomUUID } from 'crypto'
import os from 'os'

/** Window after teardown starts in which extra signals are treated as duplicate delivery, not a second user interrupt. */
const SIGNAL_DEDUP_MS = 200

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
  private teardownStartedAt: number | null = null
  private steps: Map<string, ExitStep> = new Map()
  private debug: Debug.Debugger

  /**
   * Handles SIGINT/SIGTERM for this registration (see constructor loop).
   *
   * **Why debounce:** The same OS interrupt can surface multiple times on `process` in quick succession —
   * e.g. `signal-exit` (used by subprocess tooling) may call `process.kill(process.pid, sig)` after its
   * own handler runs; multiple copies of `signal-exit` or other global handlers stack; or the CLI and
   * Electron child share process-group semantics. Without a short dedup window, that second delivery
   * arrived while `processTeardown` was already set and was misread as “user pressed interrupt again to
   * force quit”, skipping in-flight teardown or exiting with code 1. We treat signals within
   * `SIGNAL_DEDUP_MS` of teardown start as the same burst and only join the in-flight teardown promise;
   * a later interrupt still forces exit so a hung teardown can be escaped by the user.
   */
  private readonly handleProcessSignal = async (
    registeredSignal: NodeJS.Signals,
    received?: NodeJS.Signals,
  ): Promise<void> => {
    const resolvedSig = received ?? registeredSignal

    if (this.processTeardown) {
      const elapsedMs = this.teardownStartedAt == null
        ? Infinity
        : Date.now() - this.teardownStartedAt

      if (elapsedMs < SIGNAL_DEDUP_MS) {
        await this.processTeardown

        return
      }

      console.log(`\n\n${resolvedSig} received during graceful exit. Forcing exit.`)
      process.exit(1)
    } else {
      await GracefulExit.exitGracefully(128 + os.constants.signals[resolvedSig])
    }
  }

  constructor () {
    this.debug = Debug(`cypress:server:graceful-exit:${process.pid}`)
    this.debug('initializing graceful exit in process %s', process.pid)

    for (const sig of this.handledSignals) {
      const listener = async (received?: NodeJS.Signals): Promise<void> => {
        await this.handleProcessSignal(sig, received)
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
    inst.teardownStartedAt = null
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

  static get isShuttingDown (): boolean {
    return GracefulExit.singleton.processTeardown != null
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
      this.teardownStartedAt = null
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

    exit.teardownStartedAt = Date.now()
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
