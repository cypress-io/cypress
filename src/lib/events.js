import { action } from 'mobx'
import testsStore from '../runnables/runnables-store'
import statsStore from '../header/stats-store'

export default {
  listen (runner) {
    runner.on('reporter:log:add', action('log:add', (log) => {
      testsStore.addLog(log)
    }))

    runner.on('reporter:log:state:changed', action('log:update', (log) => {
      testsStore.updateLog(log)
    }))

    runner.on('reporter:reset:current:runnable:logs', action('reset:logs', () => {
      testsStore.reset()
    }))

    // 'reporter:restarted', cb
    // 'reporter:restart:test:run'

    runner.on('run:start', action('run:start', () => {
      statsStore.startRunning()
    }))

    runner.on('runnables:ready', action('runnables:ready', (rootRunnable) => {
      testsStore.setRunnables(rootRunnable)
    }))

    runner.on('test:before:hooks', action('test:before:hooks', () => {
      statsStore.startCounting()
    }))

    runner.on('run:end', action('run:end', () => {
      statsStore.stop()
    }))

    runner.on('test:after:hooks', action('test:after:hooks', ({ state }) => {
      statsStore.updateCount(state)
      statsStore.updateTime()
    }))

    runner.on('reporter:restart:test:run', action('restart:test:run', () => {
      statsStore.reset()
    }))
  },
}
