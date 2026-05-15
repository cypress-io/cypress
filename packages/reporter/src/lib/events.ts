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

type StudioEntrySource = 'welcome' | 'new-test-root' | 'new-test-suite' | 'edit'

interface InitEvent {
  appState: AppState
  runnablesStore: RunnablesStore
  statsStore: StatsStore
  scroller: Scroller
}

export interface Runner {
  emit(event: string | symbol, ...args: any[]): boolean
  on: ((event: string, listener: (...args: any[]) => void) => void)
  off?: ((event: string, listener: (...args: any[]) => void) => void)
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

/** Removes listeners from the prior {@link Events.listen} call so remounts/HMR cannot stack handlers on the shared reporter bus. */
let detachReporterSubscriptions: (() => void) | undefined

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
    detachReporterSubscriptions?.()

    const { appState, runnablesStore, scroller, statsStore } = this

    const detachFns: Array<() => void> = []

    const addRunnerListener = (event: string, listener: (...args: any[]) => void) => {
      runner.on(event, listener)
      detachFns.push(() => {
        runner.off?.(event, listener)
      })
    }

    const addLocalListener = (event: string, listener: (...args: any[]) => void) => {
      localBus.on(event, listener)
      detachFns.push(() => {
        localBus.off(event, listener)
      })
    }

    addRunnerListener('runnables:ready', action('runnables:ready', (rootRunnable: RootRunnable = {}) => {
      runnablesStore.setRunnables(rootRunnable)
    }))

    addRunnerListener('reporter:log:add', action('log:add', (log: LogProps) => {
      runnablesStore.addLog(log)
    }))

    addRunnerListener('reporter:log:state:changed', action('log:update', (log: LogProps) => {
      runnablesStore.updateLog(log)
    }))

    addRunnerListener('reporter:log:remove', action('log:remove', (log: LogProps) => {
      runnablesStore.removeLog(log)
    }))

    addRunnerListener('reporter:restart:test:run', action('restart:test:run', () => {
      appState.reset()
      runnablesStore.reset()
      statsStore.reset()
      runner.emit('reporter:restarted')
    }))

    addRunnerListener('run:start', action('run:start', () => {
      if (runnablesStore.hasTests) {
        appState.startRunning()
        appState.hasBeenPaused = false
      }
    }))

    addRunnerListener('reporter:start', action('start', (startInfo: ReporterStartInfo) => {
      appState.temporarilySetAutoScrolling(startInfo.autoScrollingEnabled)
      runnablesStore.setInitialScrollTop(startInfo.scrollTop)
      appState.setStudioActive(startInfo.studioActive)
      appState.setStudioSingleTestActive(startInfo.studioSingleTestActive)

      if (runnablesStore.hasTests) {
        statsStore.start(startInfo)
      }
    }))

    addRunnerListener('test:before:run:async', action('test:before:run:async', (runnable: TestProps) => {
      runnablesStore.runnableStarted(runnable)
    }))

    addRunnerListener('test:after:run', action('test:after:run', (runnable: TestProps, isInteractive: boolean) => {
      runnablesStore.runnableFinished(runnable, isInteractive)
      if (runnable.final && !appState.studioActive) {
        // When displaying the overall test status, we want to reference the test outerStatus
        // as the last runnable (test attempt) may have passed, but the outerStatus might mark the test run as a failure.
        statsStore.incrementCount(runnable?._cypressTestStatusInfo?.outerStatus || runnable.state!)
      }
    }))

    addRunnerListener('test:set:state', action('test:set:state', (props: UpdatableTestProps, cb: UpdateTestCallback) => {
      runnablesStore.updateTest(props, cb)
    }))

    addRunnerListener('paused', action('paused', (nextCommandName: string) => {
      appState.pause(nextCommandName)
      statsStore.pause()
    }))

    addRunnerListener('run:end', action('run:end', () => {
      appState.end()
      statsStore.end()
    }))

    addRunnerListener('reporter:collect:run:state', (cb: CollectRunStateCallback) => {
      cb({
        autoScrollingEnabled: appState.autoScrollingEnabled,
        scrollTop: scroller.getScrollTop(),
      })
    })

    addRunnerListener('reporter:snapshot:unpinned', action('snapshot:unpinned', () => {
      appState.pinnedSnapshotId = null
    }))

    addLocalListener('resume', action('resume', () => {
      appState.resume()
      statsStore.resume()
      runner.emit('runner:resume')
    }))

    addLocalListener('next', action('next', () => {
      appState.resume()
      statsStore.resume()
      runner.emit('runner:next')
    }))

    addLocalListener('stop', action('stop', () => {
      appState.stop()
      runner.emit('runner:stop')
    }))

    addLocalListener('testFilter:cloudDebug:dismiss', () => {
      runner.emit('testFilter:cloudDebug:dismiss')
    })

    addLocalListener('restart', action('restart', () => {
      runner.emit('runner:restart')
    }))

    addLocalListener('show:command', (testId, logId) => {
      runner.emit('runner:console:log', testId, logId)
    })

    addLocalListener('show:error', ({ err, testId, commandId }: { err: Err, testId?: string, commandId?: number }) => {
      runner.emit('runner:console:error', {
        err,
        testId,
        logId: commandId,
      })
    })

    addLocalListener('show:snapshot', (testId, logId) => {
      runner.emit('runner:show:snapshot', testId, logId)
    })

    addLocalListener('hide:snapshot', (testId, logId) => {
      runner.emit('runner:hide:snapshot', testId, logId)
    })

    addLocalListener('pin:snapshot', (testId, logId) => {
      runner.emit('runner:pin:snapshot', testId, logId)
    })

    addLocalListener('unpin:snapshot', (testId, logId) => {
      runner.emit('runner:unpin:snapshot', testId, logId)
    })

    addLocalListener('get:user:editor', (cb) => {
      runner.emit('get:user:editor', cb)
    })

    addLocalListener('clear:all:sessions', (cb) => {
      runner.emit('clear:all:sessions', cb)
    })

    addLocalListener('set:user:editor', (editor) => {
      runner.emit('set:user:editor', editor)
    })

    addLocalListener('save:state', () => {
      runner.emit('save:state', {
        // the "autoScrollingEnabled" key in `savedState` stores to the preference value itself, it is not the same as the "autoScrollingEnabled" variable stored in application state, which can be temporarily deactivated
        autoScrollingEnabled: appState.autoScrollingUserPref,
        isSpecsListOpen: appState.isSpecsListOpen,
        showFetchRequests: appState.showFetchRequests,
        codeEditorLineWrap: appState.codeEditorLineWrap,
      })
    })

    addLocalListener('external:open', (url) => {
      runner.emit('external:open', url)
    })

    addLocalListener('open:login:connect:modal', (args) => {
      runner.emit('open:login:connect:modal', args)
    })

    addLocalListener('open:file', (fileDetails) => {
      runner.emit('open:file', fileDetails)
    })

    addLocalListener('open:file:unified', (fileDetails) => {
      runner.emit('open:file:unified', fileDetails)
    })

    addLocalListener('studio:init:test', ({ testId }: { testId: string }) => {
      runner.emit('studio:init:test', { testId })
    })

    addLocalListener('studio:init:suite', ({ suiteId, entrySource }: { suiteId: string, entrySource?: StudioEntrySource }) => {
      runner.emit('studio:init:suite', { suiteId, entrySource })
    })

    addLocalListener('studio:cancel', () => {
      runner.emit('studio:cancel')
    })

    addLocalListener('prompt:get-code', (args: { testId: string, logId: string }) => {
      runner.emit('prompt:get-code', args)
    })

    detachReporterSubscriptions = () => {
      for (const detach of detachFns) {
        detach()
      }
    }
  },

  emit (event, ...args) {
    localBus.emit(event, ...args)
  },

  // for testing purposes
  __off () {
    detachReporterSubscriptions?.()
    detachReporterSubscriptions = undefined
    localBus.removeAllListeners()
  },
}

export default events
