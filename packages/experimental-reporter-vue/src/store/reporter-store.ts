import { defineStore } from 'pinia'
import { useRunnablesStore } from './runnables-store'
import { RootRunnable, Test } from '../runnables/types'

export type ReporterState = 'idle' | 'running' | 'stopped' | 'paused'

export interface ReporterStore {
  state?: ReporterState
  autoScrolling?: boolean
  [key: string]: any;
}

let initialized = false
let bus
export const useReporterStore = defineStore({
  id: 'reporter',
  state(): ReporterStore {
    const runnablesStore = useRunnablesStore()
    return {
      runnablesStore,
      ready: false
    }
  },
  actions: {

    restart() {
      // debugger;
      bus.emit('runner:restart')
      bus.emit('reporter:restarted')
    },
    init(_bus) {
      bus = _bus
    // if (initialized) return
      // initialized = true
      bus.on('runnables:ready',
        (rootRunnable: RootRunnable) => {
          debugger;
          this.runnablesStore.rootRunnable = rootRunnable
          debugger;
          // this.runnablesStore.init(rootRunnable)
          
        })

      bus.on('test:set:state', (props, cb) => {
        this.runnablesStore.updateTest(props, cb)
      })

      bus.on('run:start', (props) => {
        // debugger;
        // this.ready = true
      })

        bus.on('reporter:log:state:changed', (log) => {
          // debugger;
    })


      

      bus.on('reporter:restart:test:run', () => {
        bus.emit('reporter:restarted')
        this.$reset()
      // appState.reset()
      // runnablesStore.reset()
      // statsStore.reset()
      // runner.emit('reporter:restarted')
    })


      bus.on('reporter:start', () => {
      // debugger;
      // appState.temporarilySetAutoScrolling(startInfo.autoScrollingEnabled)
      // appState.setFirefoxGcInterval(startInfo.firefoxGcInterval)
      // runnablesStore.setInitialScrollTop(startInfo.scrollTop)
      // appState.setStudioActive(startInfo.studioActive)
      // if (runnablesStore.hasTests) {
      //   statsStore.start(startInfo)
      // }
    })

      bus.on('test:before:run:async', (runnable: Test) => {
        this.runnablesStore.runnableStarted(runnable)
        // debugger;
      // runnablesStore.runnableStarted(runnable)
    })

      bus.on('test:after:run', (runnable: Test) => {
        this.runnablesStore.runnableFinished(runnable)
      // debugger;
      // runnablesStore.runnableFinished(runnable)
      // if (runnable.final && !appState.studioActive) {
        // statsStore.incrementCount(runnable.state!)
      // }
    })

      bus.on('test:set:state', (props, cb) => {
        this.runnableStore.tests[props.testId] = props
        cb()
      // runnablesStore.updateTest(props, cb)
    })

      bus.on('paused', (nextCommandName: string) => {
      // debugger;
      // appState.pause(nextCommandName)
      // statsStore.pause()
    })

      bus.on('run:end', () => {
      // debugger;
      // appState.end()
      // statsStore.end()
    })

    bus.on('reporter:log:remove', (log) => {
      // runnablesStore.removeLog(log)
    })


bus.on('reporter:log:add', (log) => {
  // debugger;
      // runnablesStore.addLog(log)
})
      debugger;
    },
    // rerun() {
      // this.state = 'idle'
    // },
    stopRunning() {
      // this.state = 'stopped'
    },
    toggleAutoScrolling() {
      // this.autoScrolling = !this.autoScrolling
    }
  },
})



  