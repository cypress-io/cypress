import Debug from 'debug'

import type { DataContext } from '..'
import type { ActiveRunShape } from '../data/coreDataShape'

const debug = Debug('cypress:data-context:actions:RunStateActions')

interface RecordStartPayload {
  specPath?: string
  startedAt?: string
}

interface RecordEndPayload {
  specPath?: string
  endedAt?: string
}

/**
 * Tracks the lifecycle of an in-progress spec run inside `cypress open`.
 *
 * The signal originates in the driver (`packages/driver/src/cypress.ts`,
 * `runner:start` / `runner:end`) and is forwarded over the runner socket by
 * `packages/app/src/runner/event-manager.ts` as a `run:lifecycle` event, which
 * `packages/server/lib/socket-base.ts` routes into the methods below. The
 * state surfaces through `inspectSnapshot.activeRun` / `appRoute`.
 *
 * Scope: open mode only. `cypress run` uses the reporter/Mocha path, which
 * already aggregates pass/fail and does not need this bridge.
 */
export class RunStateActions {
  constructor (private ctx: DataContext) {}

  /**
   * Called the moment a `runSpec` mutation is processed, before the browser
   * has had a chance to navigate and fire `run:start`. Seeds `activeRun` so
   * CLI `--wait` callers never observe a stale terminal state from the
   * previous run while the new one is still loading.
   */
  recordLaunching (specPath: string) {
    const next: ActiveRunShape = {
      specPath,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: 'starting',
    }

    debug('recordLaunching %o', next)

    this.ctx.update((d) => {
      d.activeRun = next
    })

    this.ctx.emitter.runStateChange()
  }

  recordStart (payload: RecordStartPayload) {
    const specPath = payload.specPath ?? ''
    const startedAt = payload.startedAt ?? new Date().toISOString()

    const next: ActiveRunShape = {
      specPath,
      startedAt,
      endedAt: null,
      status: 'running',
    }

    debug('recordStart %o', next)

    this.ctx.update((d) => {
      d.activeRun = next
    })

    this.ctx.emitter.runStateChange()
  }

  recordEnd (payload: RecordEndPayload) {
    const current = this.ctx.coreData.activeRun

    // If we never saw a start (edge case: server restarted mid-run, or the
    // driver skipped the `run:start` forward), synthesize a minimal record
    // so CLI consumers still see the terminal state.
    const specPath = payload.specPath ?? current?.specPath ?? ''
    const startedAt = current?.startedAt ?? payload.endedAt ?? new Date().toISOString()
    const endedAt = payload.endedAt ?? new Date().toISOString()

    const next: ActiveRunShape = {
      specPath,
      startedAt,
      endedAt,
      status: 'finished',
    }

    debug('recordEnd %o', next)

    this.ctx.update((d) => {
      d.activeRun = next
    })

    this.ctx.emitter.runStateChange()
  }

  clear () {
    if (!this.ctx.coreData.activeRun) {
      return
    }

    debug('clear')

    this.ctx.update((d) => {
      d.activeRun = null
    })

    this.ctx.emitter.runStateChange()
  }
}
