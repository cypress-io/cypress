import { EventEmitter } from 'events'
import { action } from 'mobx'

import runnablesStore from '../runnables/runnables-store'
import statsStore from '../header/stats-store'

const localBus = new EventEmitter()

export default {
  listen (runner) {
    runner.on('runnables:ready', action('runnables:ready', (rootRunnable) => {
      runnablesStore.setRunnables(rootRunnable)
    }))

    runner.on('reporter:log:add', action('log:add', (log) => {
      runnablesStore.addLog(log)
    }))

    runner.on('reporter:log:state:changed', action('log:update', (log) => {
      runnablesStore.updateLog(log)
    }))

    runner.on('reporter:restart:test:run', action('restart:test:run', () => {
      runnablesStore.reset()
      runner.emit('reporter:restarted')
    }))

    runner.on('run:start', action('run:start', () => {
      statsStore.startRunning()
    }))

    runner.on('test:before:run', action('test:before:run', (runnable) => {
      statsStore.startCounting()
      runnablesStore.runnableStarted(runnable)
    }))

    runner.on('test:after:run', action('test:after:run', (runnable) => {
      runnablesStore.runnableFinished(runnable)
      statsStore.updateCount(runnable.state)
    }))

    runner.on('paused', action('paused', (nextCommandName) => {
      statsStore.pause(nextCommandName)
    }))

    runner.on('run:end', action('run:end', () => {
      statsStore.stop()
    }))

    runner.on('reporter:reset:current:runnable:logs', action('reset:logs', () => {
      runnablesStore.reset()
    }))

    runner.on('reporter:restart:test:run', action('restart:test:run', () => {
      statsStore.reset()
    }))

    localBus.on('resume', action('resume', () => {
      statsStore.resume()
      runner.emit('runner:resume')
    }))

    localBus.on('next', action('next', () => {
      runner.emit('runner:next')
    }))

    localBus.on('stop', action('stop', () => {
      runner.emit('runner:abort')
    }))

    localBus.on('restart', action('restart', () => {
      runner.emit('runner:restart')
    }))

    localBus.on('show:command', (commandId) => {
      runner.emit('runner:console:log', commandId)
    })

    localBus.on('show:error', (commandId) => {
      runner.emit('runner:console:error', commandId)
    })

    localBus.on('show:snapshot', (commandId) => {
      runner.emit('runner:show:snapshot', commandId)
    })

    localBus.on('hide:snapshot', (commandId) => {
      runner.emit('runner:hide:snapshot', commandId)
    })
  },

  emit (event, ...args) {
    localBus.emit(event, ...args)
  },
}
