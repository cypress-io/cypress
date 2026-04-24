import Debug from 'debug'

import type { DataContext } from '..'
import type { ActiveRunShape, TestResultShape } from '../data/coreDataShape'

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
 * Discriminated-union envelope for all inspect events forwarded from the
 * browser over the single `inspect:event` socket channel. New data kinds
 * (commands, network, console, etc.) add to `InspectEventKind` and get a
 * `case` in `RunStateActions.dispatchInspectEvent`; nothing else changes.
 *
 * Cross-cutting metadata (specPath, timestamp) lives on the envelope so each
 * payload type only has to describe what's unique to its kind.
 */
export type InspectEventKind = 'run:start' | 'run:end' | 'test:result'

export interface InspectEventEnvelope<K extends InspectEventKind = InspectEventKind> {
  kind: K
  specPath?: string
  timestamp?: string
  payload?: Record<string, any>
}

/**
 * Tracks the lifecycle of an in-progress spec run inside `cypress open`.
 *
 * The signal originates in the driver (`packages/driver/src/cypress.ts`,
 * `runner:start` / `runner:end`) and is forwarded over the runner socket by
 * `packages/app/src/runner/event-manager.ts` as a single `inspect:event`
 * envelope, which `packages/server/lib/socket-base.ts` routes into
 * `dispatchInspectEvent` below. The state surfaces through
 * `inspectSnapshot.activeRun` / `appRoute`.
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
      tests: {},
    }

    debug('recordLaunching %o', next)

    this.ctx.update((d) => {
      d.activeRun = next
    })

    this.ctx.emitter.runStateChange()
  }

  recordStart (payload: RecordStartPayload) {
    const current = this.ctx.coreData.activeRun
    const specPath = payload.specPath ?? ''
    const startedAt = payload.startedAt ?? new Date().toISOString()

    // Preserve tests only if the driver is reporting start for the same spec
    // we were already tracking (e.g. after `recordLaunching` seeded us). A
    // fresh spec starts with an empty result map.
    const sameSpec = current?.specPath === specPath
    const tests = sameSpec ? current!.tests : {}

    const next: ActiveRunShape = {
      specPath,
      startedAt,
      endedAt: null,
      status: 'running',
      tests,
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

    const sameSpec = current?.specPath === specPath
    const tests = sameSpec ? current!.tests : {}

    const next: ActiveRunShape = {
      specPath,
      startedAt,
      endedAt,
      status: 'finished',
      tests,
    }

    debug('recordEnd %o', next)

    this.ctx.update((d) => {
      d.activeRun = next
    })

    this.ctx.emitter.runStateChange()
  }

  /**
   * Records the outcome of a single test. Keyed by `testId` so retries
   * naturally overwrite the prior attempt — the final attempt's state wins,
   * which is what stats consumers want.
   *
   * If no `activeRun` exists yet (e.g. the driver raced ahead of
   * `recordLaunching`), we drop the result rather than synthesize a run;
   * this keeps the spec-level lifecycle as the authoritative seeder.
   */
  recordTestResult (result: TestResultShape) {
    const current = this.ctx.coreData.activeRun

    if (!current) {
      debug('recordTestResult dropped — no activeRun: %o', result)

      return
    }

    debug('recordTestResult %o', result)

    this.ctx.update((d) => {
      if (!d.activeRun) return

      d.activeRun.tests[result.testId] = result
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

  /**
   * Route a browser-originated inspect envelope into the correct record*
   * method by `kind`. This is the single server-side entry point for every
   * open-mode inspect event — adding a new data kind means adding a `case`
   * here (and typically a new bucket on `ActiveRunShape`).
   *
   * Unknown kinds are ignored, not thrown — an older server talking to a
   * newer browser should gracefully drop events it doesn't understand.
   */
  dispatchInspectEvent (envelope: InspectEventEnvelope) {
    if (!envelope?.kind) {
      return
    }

    const payload = envelope.payload ?? {}

    switch (envelope.kind) {
      case 'run:start':
        this.recordStart({
          specPath: envelope.specPath,
          startedAt: envelope.timestamp ?? (payload.startedAt as string | undefined),
        })

        return
      case 'run:end':
        this.recordEnd({
          specPath: envelope.specPath,
          endedAt: envelope.timestamp ?? (payload.endedAt as string | undefined),
        })

        return
      case 'test:result': {
        const state = payload.state

        if (state !== 'passed' && state !== 'failed' && state !== 'pending' && state !== 'skipped') {
          return
        }

        if (typeof payload.testId !== 'string' || !payload.testId) {
          return
        }

        this.recordTestResult({
          testId: payload.testId,
          title: typeof payload.title === 'string' ? payload.title : '',
          titlePath: Array.isArray(payload.titlePath) ? payload.titlePath.map(String) : [],
          state,
          duration: typeof payload.duration === 'number' ? payload.duration : null,
          currentRetry: typeof payload.currentRetry === 'number' ? payload.currentRetry : 0,
          error: typeof payload.error === 'string' ? payload.error : null,
        })

        return
      }
      default: {
        const _exhaustive: never = envelope.kind

        debug('dispatchInspectEvent: ignoring unknown kind %o', _exhaustive)
      }
    }
  }
}
