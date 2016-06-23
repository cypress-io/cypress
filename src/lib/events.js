import { action } from 'mobx'
import adapter from './adapter'
import testsStore from '../runnables/tests-store'
import statsStore from '../header/stats-store'

export default {
  listen () {
    adapter.on('reporter:log:add', action('log:add', (log) => {
      testsStore.add(log)
    }))

    adapter.on('reporter:log:state:changed', action('log:update', (log) => {
      testsStore.update(log)
    }))

    adapter.on('reporter:reset:current:runnable:logs', action('reset:logs', () => {
      testsStore.reset()
    }))

    // 'reporter:restarted', cb
    // 'reporter:restart:test:run'

    adapter.on('before:run', action('before:run', () => {
      statsStore.startRunning()
    }))

    adapter.on('suite:start', action('suite:start', () => {
      statsStore.startCounting()
    }))

    adapter.on('after:run', action('after:run', () => {
      statsStore.stop()
    }))

    adapter.on('test:end', action('test:end', () => {
      statsStore.updateTime()
    }))

    adapter.on('test:results:ready', action('test:results:ready', ({ state }) => {
      statsStore.updateCount(state)
    }))

    adapter.on('restart:test:run', action('restart:test:run', () => {
      statsStore.reset()
    }))
  },
}
