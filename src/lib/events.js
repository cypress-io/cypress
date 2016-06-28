import { action } from 'mobx'
import testsStore from '../runnables/runnables-store'
import statsStore from '../header/stats-store'

export default {
  listen (runner) {
    runner.on('runnables:ready', action('runnables:ready', (rootRunnable) => {
      testsStore.setRunnables(rootRunnable)
    }))

    runner.on('reporter:log:add', action('log:add', (log) => {
      testsStore.addLog(log)
    }))

    runner.on('reporter:log:state:changed', action('log:update', (log) => {
      testsStore.updateLog(log)
    }))

    // 'reporter:restarted', cb
    // 'reporter:restart:test:run'

    runner.on('run:start', action('run:start', () => {
      statsStore.startRunning()
    }))

    runner.on('test:before:hooks', action('test:before:hooks', () => {
      statsStore.startCounting()
    }))

    runner.on('test:after:hooks', action('test:after:hooks', (runnable) => {
      testsStore.runnableFinished(runnable)
      statsStore.updateCount(runnable.state)
      statsStore.updateTime()
    }))

    runner.on('run:end', action('run:end', () => {
      statsStore.stop()
    }))

    runner.on('reporter:reset:current:runnable:logs', action('reset:logs', () => {
      testsStore.reset()
    }))

    runner.on('reporter:restart:test:run', action('restart:test:run', () => {
      statsStore.reset()
    }))
  },
}
