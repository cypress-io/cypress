/* eslint-disable no-console */
import Debug from 'debug'
import { randomUUID } from 'crypto'
import os from 'os'

/** Window after teardown starts in which extra signals are treated as duplicate delivery, not a second user interrupt. */
const SIGNAL_DEDUP_MS = 200

/**
 * Share of the teardown budget one step may spend. Steps wait on peers we are about to outlive anyway
 * (the config child over IPC, the browser over CDP and signals), so without a per-step bound the first
 * to stall spends the whole budget and the force-exit cuts off every other step — including the lockfile
 * unlock, whose side effect outlives us. Below 1 so a stalled step yields in time for the rest to finish.
 */
const STEP_BUDGET_FRACTION = 0.8

function getTeardownTimeoutMs (): number {
  const n = Number(process.env.CYPRESS_INTERNAL_TEARDOWN_TIMEOUT)

  // the disconnect ack in @packages/data-context ProjectConfigManager derives from this default
  return Number.isFinite(n) && n > 0 ? n : 5000
}

function getDefaultStepTimeoutMs (): number {
  return Math.max(1, Math.floor(getTeardownTimeoutMs() * STEP_BUDGET_FRACTION))
}

/**
 * Bound for teardown work that waits on a process we do not control, so it settles well inside the
 * step that shares its budget with the others rather than consuming that step whole.
 */
export function getPeerWaitTimeoutMs (): number {
  return Math.max(1, Math.floor(getDefaultStepTimeoutMs() / 2))
}

export interface ExitStep {
  name: string
  fn: (code: number) => Promise<number | void> | void
  timeoutMs?: number
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
  private forceExitTimeout: NodeJS.Timeout | undefined
  private steps: Map<string, ExitStep> = new Map()
  /** Names of steps that have started but not settled, so a blown budget can say what it was waiting on. */
  private pendingSteps: Map<string, string> = new Map()
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

    inst.clearForceExitTimeout()

    inst.steps.clear()
    inst.pendingSteps.clear()
    inst.processTeardown = null
    inst.teardownStartedAt = null
    GracefulExit.instance = null
  }

  /**
   * @param timeoutMs bound for this step alone, for work whose result is worth less than a prompt exit;
   * defaults to `STEP_BUDGET_FRACTION` of the teardown budget.
   */
  static addStep (teardownFn: ExitStep['fn'], stepName?: string, timeoutMs?: number): ExitStepKey {
    GracefulExit.singleton.debug('adding step to graceful exit: %s', stepName)

    const key = randomUUID()
    const name = stepName ?? teardownFn.name ?? key

    GracefulExit.singleton.steps.set(key, { name, fn: teardownFn, timeoutMs })

    return key
  }

  static removeStep (key: ExitStepKey): void {
    GracefulExit.singleton.steps.delete(key)
  }

  static get isShuttingDown (): boolean {
    // read from teardownStartedAt, not processTeardown: the first steps run before exitGracefully has
    // finished assigning that promise, and a step that skips work on the way out has to see this
    return GracefulExit.singleton.teardownStartedAt != null
  }

  private async flushSteps (code: number): Promise<void> {
    await Promise.all(Array.from(this.steps.entries()).map(async ([key, { name, fn, timeoutMs }]) => {
      const startedAt = Date.now()
      const budget = timeoutMs ?? getDefaultStepTimeoutMs()
      let timer: NodeJS.Timeout | undefined

      this.pendingSteps.set(key, name)

      try {
        this.debug(`<${key}> executing teardown step: %s`, name)

        const outcome = await Promise.race([
          Promise.resolve(fn(code)).then(() => 'settled' as const),
          new Promise<'timedOut'>((resolve) => {
            timer = setTimeout(() => resolve('timedOut'), budget)
          }),
        ])

        if (outcome === 'timedOut') {
          this.debug(`<${key}> teardown step abandoned after %dms: %s`, budget, name)
          console.log(`The "${name}" teardown step did not finish within ${budget}ms. This does not affect the exit code (${code}).`)
        } else {
          this.debug(`<${key}> teardown step completed in %dms: %s`, Date.now() - startedAt, name)
        }
      } catch (error) {
        this.debug(`<${key}> Error executing teardown step after ${Date.now() - startedAt}ms: ${name}`, error)
        console.log(`An error occurred during the "${name}" teardown step. This does not affect the exit code (${code}).`)
        console.log(error)
      } finally {
        clearTimeout(timer)
        this.pendingSteps.delete(key)
      }
    }))
  }

  private clearForceExitTimeout (): void {
    if (this.forceExitTimeout) {
      clearTimeout(this.forceExitTimeout)
      this.forceExitTimeout = undefined
    }
  }

  private async flushAndExit (code: number): Promise<number | void> {
    try {
      await this.flushSteps(code)
      this.debug('steps flushed successfully', code)
    } catch (error) {
      this.debug('Error flushing steps: ', error)
    } finally {
      this.clearForceExitTimeout()
      this.processTeardown = null
      this.teardownStartedAt = null
      this.steps.clear()
      this.pendingSteps.clear()
      process.exit(code)
    }
  }

  static async exitGracefully (code: number): Promise<number | void> {
    const exit = GracefulExit.singleton

    if (exit.processTeardown) {
      return exit.processTeardown
    }

    exit.teardownStartedAt = Date.now()
    exit.processTeardown = Promise.race([
      GracefulExit.singleton.flushAndExit(code),
      new Promise<void>((resolve) => {
        exit.forceExitTimeout = setTimeout(() => {
          try {
            const ms = getTeardownTimeoutMs()
            const pending = Array.from(new Set(exit.pendingSteps.values()))
            const waitingOn = pending.length ? ` Still waiting on: ${pending.join(', ')}.` : ''

            console.log(`Failed to gracefully exit after ${ms}ms.${waitingOn} This does not affect the exit code (${code}).`)
          } catch (e) {
            console.log('Error forcing exit: ', e)
          } finally {
            exit.clearForceExitTimeout()
            resolve()
            process.exit(code)
          }
        }, getTeardownTimeoutMs())
      }),
    ])

    return exit.processTeardown
  }
}
