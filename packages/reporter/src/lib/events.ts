import { EventEmitter } from 'events'
import { action } from 'mobx'
import appState, { AppState } from './app-state'
import runnablesStore, { RunnablesStore, LogProps, RootRunnable } from '../runnables/runnables-store'
import statsStore, { StatsStore } from '../header/stats-store'
import scroller, { Scroller } from './scroller'
import type { UpdatableTestProps, UpdateTestCallback, TestProps } from '../test/test-model'
import type Err from '../errors/err-model'

import type { ReporterStartInfo, ReporterRunState } from '@packages/types'

const localBus = new EventEmitter()

/**
 * Reduce the driver's rich `alias` type (string | array | AliasObject) down
 * to a single display string for the CLI wire shape. Returns null for
 * unaliased commands.
 */
function normalizeAlias (alias: unknown): string | null {
  if (alias == null) return null

  if (typeof alias === 'string') return alias

  if (Array.isArray(alias)) {
    return alias.map((a) => (typeof a === 'string' ? a : (a && typeof a === 'object' && 'name' in a ? String((a as { name: unknown }).name) : ''))).filter(Boolean).join(', ') || null
  }

  if (typeof alias === 'object' && 'name' in (alias as object)) {
    return String((alias as { name: unknown }).name)
  }

  return null
}

/**
 * Normalize `referencesAlias` into a flat `string[]` for stable CLI output.
 */
function normalizeReferencesAlias (refs: unknown): string[] | null {
  if (refs == null) return null

  const list = Array.isArray(refs) ? refs : [refs]
  const out = list.map((r) => (typeof r === 'string' ? r : (r && typeof r === 'object' && 'name' in r ? String((r as { name: unknown }).name) : null))).filter((s): s is string => typeof s === 'string' && !!s)

  return out.length ? out : null
}

type StudioEntrySource = 'welcome' | 'new-test-root' | 'new-test-suite' | 'edit'

interface InitEvent {
  appState: AppState
  runnablesStore: RunnablesStore
  statsStore: StatsStore
  scroller: Scroller
}

export interface Runner {
  emit(event: string | symbol, ...args: any[]): boolean
  on: ((event: string, action: ((...args: any) => void)) => void)
}

export interface Events {
  appState: AppState
  runnablesStore: RunnablesStore
  statsStore: StatsStore
  scroller: Scroller

  init: ((args: InitEvent) => void)
  listen: ((runner: Runner) => void)
  emit: ((event: string | symbol, ...args: any) => void)
  __off: (() => void)
}

type CollectRunStateCallback = (arg: ReporterRunState) => void

/**
 * Stable wire shape for a single command log entry — matches the CLI's
 * `inspect test` / `inspect command` output. Keep in sync with
 * `CommandSnapshotShape` in `@packages/data-context`. `snapshotCount` is
 * populated downstream by the event-manager from the driver log attrs (the
 * reporter only tracks `hasSnapshot` as a boolean), so it's optional on the
 * reporter-side wire shape.
 *
 * `attemptIndex` / `attemptState` are the zero-based retry index and
 * terminal state of the owning attempt — Studio surfaces all attempts of
 * a failed-and-retried test, so commands from earlier attempts can co-exist
 * with commands from the latest attempt in the same snapshot.
 */
interface CommandSnapshot {
  id: string
  name: string
  message: string
  state: string
  type: string
  testId: string | null
  displayName: string | null
  number: number | null
  snapshotCount?: number
  hasSnapshot: boolean
  hasConsoleProps: boolean
  timeout: number | null
  numElements: number | null
  visible: boolean | null
  groupLevel: number | null
  group: number | null
  alias: string | null
  aliasType: string | null
  referencesAlias: string[] | null
  hookId: string | null
  error: string | null
  wallClockStartedAt: string | null
  attemptIndex: number
  attemptState: string
}

const events: Events = {
  appState,
  runnablesStore,
  statsStore,
  scroller,

  init ({ appState, runnablesStore, statsStore, scroller }: InitEvent) {
    this.appState = appState
    this.runnablesStore = runnablesStore
    this.statsStore = statsStore
    this.scroller = scroller
  },

  listen (runner: Runner) {
    const { appState, runnablesStore, scroller, statsStore } = this

    runner.on('runnables:ready', action('runnables:ready', (rootRunnable: RootRunnable = {}) => {
      runnablesStore.setRunnables(rootRunnable)
    }))

    runner.on('reporter:log:add', action('log:add', (log: LogProps) => {
      runnablesStore.addLog(log)
    }))

    runner.on('reporter:log:state:changed', action('log:update', (log: LogProps) => {
      runnablesStore.updateLog(log)
    }))

    runner.on('reporter:log:remove', action('log:remove', (log: LogProps) => {
      runnablesStore.removeLog(log)
    }))

    runner.on('reporter:restart:test:run', action('restart:test:run', () => {
      appState.reset()
      runnablesStore.reset()
      statsStore.reset()
      runner.emit('reporter:restarted')
    }))

    runner.on('run:start', action('run:start', () => {
      if (runnablesStore.hasTests) {
        appState.startRunning()
        appState.hasBeenPaused = false
      }
    }))

    runner.on('reporter:start', action('start', (startInfo: ReporterStartInfo) => {
      appState.temporarilySetAutoScrolling(startInfo.autoScrollingEnabled)
      runnablesStore.setInitialScrollTop(startInfo.scrollTop)
      appState.setStudioActive(startInfo.studioActive)
      appState.setStudioSingleTestActive(startInfo.studioSingleTestActive)

      if (runnablesStore.hasTests) {
        statsStore.start(startInfo)
      }
    }))

    runner.on('test:before:run:async', action('test:before:run:async', (runnable: TestProps) => {
      runnablesStore.runnableStarted(runnable)
    }))

    runner.on('test:after:run', action('test:after:run', (runnable: TestProps, isInteractive: boolean) => {
      runnablesStore.runnableFinished(runnable, isInteractive)
      if (runnable.final && !appState.studioActive) {
        // When displaying the overall test status, we want to reference the test outerStatus
        // as the last runnable (test attempt) may have passed, but the outerStatus might mark the test run as a failure.
        statsStore.incrementCount(runnable?._cypressTestStatusInfo?.outerStatus || runnable.state!)
      }
    }))

    runner.on('test:set:state', action('test:set:state', (props: UpdatableTestProps, cb: UpdateTestCallback) => {
      runnablesStore.updateTest(props, cb)
    }))

    runner.on('paused', action('paused', (nextCommandName: string) => {
      appState.pause(nextCommandName)
      statsStore.pause()
    }))

    runner.on('run:end', action('run:end', () => {
      appState.end()
      statsStore.end()
    }))

    runner.on('reporter:collect:run:state', (cb: CollectRunStateCallback) => {
      cb({
        autoScrollingEnabled: appState.autoScrollingEnabled,
        scrollTop: scroller.getScrollTop(),
      })
    })

    runner.on('reporter:snapshot:unpinned', action('snapshot:unpinned', () => {
      appState.pinnedSnapshotId = null
    }))

    // On-demand snapshot of the current command log for a given test. Used by
    // the `cypress inspect test` CLI bridge — no per-command streaming, the
    // server asks for a snapshot at query time. Returns `null` when the test
    // isn't present in the store so the caller can distinguish "empty log"
    // from "unknown test".
    runner.on('request:commands:snapshot', (testId: string, cb: (snapshot: CommandSnapshot[] | null) => void) => {
      const test = runnablesStore.testById(testId)
      const attempts = test?.attempts ?? []
      const knownIds = Object.keys(runnablesStore._tests)

      // eslint-disable-next-line no-console
      console.log('[inspect] request:commands:snapshot', {
        testId,
        testFound: !!test,
        attemptCount: attempts.length,
        commandCounts: attempts.map((a) => a.commands.length),
        knownTestIds: knownIds,
      })

      if (!test) {
        cb(null)

        return
      }

      // Flatten commands from every attempt, tagging each with the owning
      // attempt's index + state. Studio shows all attempts on a retried test,
      // so the CLI needs the full set to surface "failed attempt N had these
      // commands" alongside the latest attempt.
      const snapshot: CommandSnapshot[] = []

      for (const attempt of attempts) {
        const attemptIndex = attempt.id
        const attemptState = attempt.state

        for (const c of attempt.commands) {
          snapshot.push({
            id: String(c.id ?? ''),
            name: c.name ?? '',
            message: c.displayMessage ?? '',
            state: c.state ?? '',
            type: c.type ?? '',
            testId: c.testId ?? null,
            displayName: c.displayName ?? null,
            number: typeof c.number === 'number' ? c.number : null,
            // Default to 0 so the GraphQL non-null contract always holds — the
            // event-manager overrides this with the real count from
            // `Cypress.runner.getSnapshotPropsForLog` when the driver is
            // available. If the driver isn't loaded (no spec launched yet),
            // leaving this as 0 is accurate: no commands = no snapshots.
            snapshotCount: 0,
            hasSnapshot: !!c.hasSnapshot,
            hasConsoleProps: !!c.hasConsoleProps,
            timeout: typeof c.timeout === 'number' ? c.timeout : null,
            numElements: typeof c.numElements === 'number' ? c.numElements : null,
            visible: typeof c.visible === 'boolean' ? c.visible : null,
            groupLevel: typeof c.groupLevel === 'number' ? c.groupLevel : null,
            group: typeof c.group === 'number' ? c.group : null,
            alias: normalizeAlias(c.alias),
            aliasType: c.aliasType ?? null,
            referencesAlias: normalizeReferencesAlias(c.referencesAlias),
            hookId: c.hookId ?? null,
            error: c.err?.message ?? null,
            wallClockStartedAt: c.wallClockStartedAt ?? null,
            attemptIndex,
            attemptState,
          })
        }
      }

      cb(snapshot)
    })

    // Companion to `inspect:request-pinned-command` — reports the currently
    // pinned command's log id. The event-manager combines this with the
    // driver's `consoleProps` to produce the full CLI payload. Returns `null`
    // when nothing is pinned.
    runner.on('request:pinned-command-state', (cb: (logId: string | null) => void) => {
      const pinnedId = appState.pinnedSnapshotId

      cb(pinnedId != null ? String(pinnedId) : null)
    })

    // Server → reporter: pin a specific command (same behavior as clicking
    // the column pin icon). Guards on `isRunning` — pinning while the spec
    // is still running is a no-op, matching `command.tsx#_toggleColumnPin`.
    // `testId` and `logId` come from the server's `emitPinCommand`, which
    // only fires when Studio is active on a specific test.
    runner.on('inspect:remote-pin-command', action('inspect:remote-pin-command', (testId: string, logId: string) => {
      // eslint-disable-next-line no-console
      console.log('[inspect] inspect:remote-pin-command received', { testId, logId, isRunning: appState.isRunning })

      if (appState.isRunning) return

      // Driver log ids are strings (`log-{origin}-{counter}` — see
      // `packages/driver/src/cypress/log.ts`). Preserve them as-is so the
      // `appState.pinnedSnapshotId === model.id` comparison in the command
      // model holds.
      appState.pinnedSnapshotId = logId
      runner.emit('runner:pin:snapshot', testId, logId)
      runner.emit('runner:console:log', testId, logId)
    }))

    runner.on('inspect:remote-unpin-command', action('inspect:remote-unpin-command', () => {
      // eslint-disable-next-line no-console
      console.log('[inspect] inspect:remote-unpin-command received', { current: appState.pinnedSnapshotId })

      if (appState.pinnedSnapshotId == null) return

      const testIdGuess = (() => {
        for (const t of Object.values(runnablesStore._tests)) {
          for (const attempt of t.attempts ?? []) {
            for (const cmd of attempt.commands ?? []) {
              if (cmd.id === appState.pinnedSnapshotId) return cmd.testId
            }
          }
        }

        return null
      })()

      const logId = appState.pinnedSnapshotId

      appState.pinnedSnapshotId = null
      // `runner:unpin:snapshot` triggers `_unpinSnapshot` in event-manager
      // (signature-agnostic); include testId/logId for symmetry with the UI
      // path in `command.tsx#_toggleColumnPin`.
      runner.emit('runner:unpin:snapshot', testIdGuess, logId)
    }))

    localBus.on('resume', action('resume', () => {
      appState.resume()
      statsStore.resume()
      runner.emit('runner:resume')
    }))

    localBus.on('next', action('next', () => {
      appState.resume()
      statsStore.resume()
      runner.emit('runner:next')
    }))

    localBus.on('stop', action('stop', () => {
      appState.stop()
      runner.emit('runner:stop')
    }))

    localBus.on('testFilter:cloudDebug:dismiss', () => {
      runner.emit('testFilter:cloudDebug:dismiss')
    })

    localBus.on('restart', action('restart', () => {
      runner.emit('runner:restart')
    }))

    localBus.on('show:command', (testId, logId) => {
      runner.emit('runner:console:log', testId, logId)
    })

    localBus.on('show:error', ({ err, testId, commandId }: { err: Err, testId?: string, commandId?: number }) => {
      runner.emit('runner:console:error', {
        err,
        testId,
        logId: commandId,
      })
    })

    localBus.on('show:snapshot', (testId, logId) => {
      runner.emit('runner:show:snapshot', testId, logId)
    })

    localBus.on('hide:snapshot', (testId, logId) => {
      runner.emit('runner:hide:snapshot', testId, logId)
    })

    localBus.on('pin:snapshot', (testId, logId) => {
      runner.emit('runner:pin:snapshot', testId, logId)
    })

    localBus.on('unpin:snapshot', (testId, logId) => {
      runner.emit('runner:unpin:snapshot', testId, logId)
    })

    localBus.on('get:user:editor', (cb) => {
      runner.emit('get:user:editor', cb)
    })

    localBus.on('clear:all:sessions', (cb) => {
      runner.emit('clear:all:sessions', cb)
    })

    localBus.on('set:user:editor', (editor) => {
      runner.emit('set:user:editor', editor)
    })

    localBus.on('save:state', () => {
      runner.emit('save:state', {
        // the "autoScrollingEnabled" key in `savedState` stores to the preference value itself, it is not the same as the "autoScrollingEnabled" variable stored in application state, which can be temporarily deactivated
        autoScrollingEnabled: appState.autoScrollingUserPref,
        isSpecsListOpen: appState.isSpecsListOpen,
        showFetchRequests: appState.showFetchRequests,
        codeEditorLineWrap: appState.codeEditorLineWrap,
      })
    })

    localBus.on('external:open', (url) => {
      runner.emit('external:open', url)
    })

    localBus.on('open:login:connect:modal', (args) => {
      runner.emit('open:login:connect:modal', args)
    })

    localBus.on('open:file', (fileDetails) => {
      runner.emit('open:file', fileDetails)
    })

    localBus.on('open:file:unified', (fileDetails) => {
      runner.emit('open:file:unified', fileDetails)
    })

    localBus.on('studio:init:test', ({ testId }: { testId: string }) => {
      runner.emit('studio:init:test', { testId })
    })

    localBus.on('studio:init:suite', ({ suiteId, entrySource }: { suiteId: string, entrySource?: StudioEntrySource }) => {
      runner.emit('studio:init:suite', { suiteId, entrySource })
    })

    localBus.on('studio:cancel', () => {
      runner.emit('studio:cancel')
    })

    localBus.on('prompt:get-code', (args: { testId: string, logId: string }) => {
      runner.emit('prompt:get-code', args)
    })
  },

  emit (event, ...args) {
    localBus.emit(event, ...args)
  },

  // for testing purposes
  __off () {
    localBus.removeAllListeners()
  },
}

export default events
