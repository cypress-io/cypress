import { EventEmitter } from 'events'
import { action } from 'mobx'

const localBus = new EventEmitter()

export default {
  init ({ appState, runnablesStore, statsStore, scroller }) {
    this.appState = appState
    this.runnablesStore = runnablesStore
    this.statsStore = statsStore
    this.scroller = scroller
  },

  listen (runner) {
    const { appState, runnablesStore, scroller, statsStore } = this

    runner.on('runnables:ready', action('runnables:ready', (rootRunnable = {}) => {
      runnablesStore.setRunnables(rootRunnable)
    }))

    runner.on('reporter:internal:log', action('log:add', (log) => {
      runnablesStore.addLog(log)
    }))

    runner.on('reporter:internal:logChange', action('log:change', (log) => {
      runnablesStore.updateLog(log)
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

    runner.on('reporter:start', action('start', (startInfo) => {
      appState.temporarilySetAutoScrolling(startInfo.autoScrollingEnabled)
      runnablesStore.setInitialScrollTop(startInfo.scrollTop)
      if (runnablesStore.hasTests) {
        statsStore.start(startInfo)
      }
    }))

    runner.on('test:start:async', action('test:start:async', (runnable) => {
      runnablesStore.runnableStarted(runnable)
    }))

    runner.on('test:end', action('test:end', (runnable) => {
      runnablesStore.runnableFinished(runnable)
      statsStore.incrementCount(runnable.state)
    }))

    runner.on('test:set:state', action('test:set:state', (runnable, cb) => {
      runnablesStore.updateTest(runnable, cb)
    }))

    runner.on('paused', action('paused', (nextCommandName) => {
      appState.pause(nextCommandName)
      statsStore.pause()
    }))

    runner.on('run:end', action('run:end', () => {
      appState.end()
      statsStore.end()
    }))

    runner.on('reporter:collect:run:state', (cb) => {
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
      runner.emit('runner:next')
    }))

    localBus.on('stop', action('stop', () => {
      appState.stop()
      runner.emit('runner:stop')
    }))

    localBus.on('restart', action('restart', () => {
      runner.emit('runner:restart')
    }))

    localBus.on('show:command', (commandId) => {
      runner.emit('runner:console:log', commandId)
    })

    localBus.on('show:error', (testId) => {
      const test = runnablesStore.testById(testId)

      if (test.err.isCommandErr) {
        const command = test.commandMatchingErr()

        if (!command) return

        runner.emit('runner:console:log', command.id)
      } else {
        runner.emit('runner:console:error', testId)
      }
    })

    localBus.on('show:snapshot', (commandId) => {
      runner.emit('runner:show:snapshot', commandId)
    })

    localBus.on('hide:snapshot', (commandId) => {
      runner.emit('runner:hide:snapshot', commandId)
    })

    localBus.on('pin:snapshot', (commandId) => {
      runner.emit('runner:pin:snapshot', commandId)
    })

    localBus.on('unpin:snapshot', (commandId) => {
      runner.emit('runner:unpin:snapshot', commandId)
    })

    localBus.on('focus:tests', () => {
      runner.emit('focus:tests')
    })

    localBus.on('save:state', () => {
      runner.emit('save:state', {
        autoScrollingEnabled: appState.autoScrollingEnabled,
      })
    })

    localBus.on('external:open', (url) => {
      runner.emit('external:open', url)
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
