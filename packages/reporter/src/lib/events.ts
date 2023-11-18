import { EventEmitter } from 'events'
import { action } from 'mobx'
import appState, { AppState } from './app-state'
import runnablesStore, { RunnablesStore, LogProps, RootRunnable } from '../runnables/runnables-store'
import statsStore, { StatsStore } from '../header/stats-store'
import scroller, { Scroller } from './scroller'
import { UpdatableTestProps, UpdateTestCallback, TestProps } from '../test/test-model'
import Err from '../errors/err-model'

import type { ReporterStartInfo, ReporterRunState } from '@packages/types'

const localBus = new EventEmitter()

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
      }
    }))

    runner.on('reporter:start', action('start', (startInfo: ReporterStartInfo) => {
      appState.temporarilySetAutoScrolling(startInfo.autoScrollingEnabled)
      runnablesStore.setInitialScrollTop(startInfo.scrollTop)
      appState.setStudioActive(startInfo.studioActive)
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
      })
    })

    localBus.on('external:open', (url) => {
      runner.emit('external:open', url)
    })

    localBus.on('open:file', (fileDetails) => {
      runner.emit('open:file', fileDetails)
    })

    localBus.on('open:file:unified', (fileDetails) => {
      runner.emit('open:file:unified', fileDetails)
    })

    localBus.on('studio:init:test', (testId) => {
      runner.emit('studio:init:test', testId)
    })

    localBus.on('studio:init:suite', (suiteId) => {
      runner.emit('studio:init:suite', suiteId)
    })

    localBus.on('studio:remove:command', (commandId) => {
      runner.emit('studio:remove:command', commandId)
    })

    localBus.on('studio:cancel', () => {
      runner.emit('studio:cancel')
    })

    localBus.on('studio:save', () => {
      runner.emit('studio:save')
    })

    localBus.on('studio:copy:to:clipboard', (cb) => {
      runner.emit('studio:copy:to:clipboard', cb)
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
