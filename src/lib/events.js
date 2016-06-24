import { action } from 'mobx'
import testsStore from '../runnables/tests-store'
import statsStore from '../header/stats-store'

export default {
  listen (runner) {
    runner.on('reporter:log:add', action('log:add', (log) => {
      testsStore.add(log)
    }))

    runner.on('reporter:log:state:changed', action('log:update', (log) => {
      testsStore.update(log)
    }))

    runner.on('reporter:reset:current:runnable:logs', action('reset:logs', () => {
      testsStore.reset()
    }))

    // 'reporter:restarted', cb
    // 'reporter:restart:test:run'

    runner.on('run:start', action('run:start', () => {
      statsStore.startRunning()
    }))

    runner.on('test:before:hooks', action('test:before:hooks', () => {
      statsStore.startCounting()
    }))

    runner.on('run:end', action('run:end', () => {
      statsStore.stop()
    }))

    runner.on('test:after:hooks', action('test:after:hooks', () => {
      statsStore.updateTime()
    }))

    runner.on('test:results:ready', action('test:results:ready', ({ state }) => {
      statsStore.updateCount(state)
    }))

    runner.on('reporter:restart:test:run', action('restart:test:run', () => {
      statsStore.reset()
    }))
  },
}
