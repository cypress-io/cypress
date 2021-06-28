// @ts-nocheck
/**
 * Reporter store structure
 1. Command Log
 2. Stats + Timing
 */

import { defineStore } from 'pinia'
import _, { Dictionary } from 'lodash'
import { EventEmitter } from 'events'
import { useRafFn, Fn, Pausable } from '../composables/core/index'
import { RunnableState } from '../types'
import { computed, ref, Ref, ComputedRef, watch, toRefs, reactive } from 'vue'

type RunnableType = 'suite' | 'test'
type RawSuite = any
type RawTest = any
export type TestsByState = ComputedRef<Dictionary<(Test | Suite)[]>>

interface Runnables {
  nested: (Test | Suite)[],
  flat: Record<string, Test | Suite>,
  tests: Test[]
  suites: Suite[]
  testsByState: TestsByState,
  stats: ComputedRef<Dictionary<RunnableState>[]>
  getTest: (id: string) => Test | Suite
  getHook: (id: string) => any
  addLog: (props: any) => any
}

export function Runnables(rootRunnable: RawSuite): Runnables {
  // Key value
  const flat: Record<string, Test | Suite> = {}
  
  // Hierarchical representation
  const nested = createRunnableChildren(rootRunnable, 0, flat)

  // By type
  const { test, suite } = _.groupBy(flat, 'type')
  const tests = test

  const testsByState = computed(() => _.groupBy(tests, 'state'))
  const getHook = (hook) => _.find(flat[hook.testId].hooks, h => h.hookId === hook.id)
  const getTest = id => flat[id]
  return {
    nested,
    flat,
    tests: computed(() => test),
    suites: suite, // TS error, why?
    testsByState,
    getTest,
    getHook,
    addLog: log => {
      if (log.testId) {
        if (log.hookId) {
          getHook(log.hookId).logs.push(log)
        } else {
          getTest(log.testId).logs.push(log)
        }
      }
    },
  }
}

// @ts-ignore
export const useStatsStore = defineStore({
  id: 'stats',
  state() {
    return {
      startTime: 0,
      currentTime: 0,
      pauseable: {
        pause() {},
        resume(){},
      }
    }
  },
  actions: {
    start() {
      this.startTime = Date.now()
      this.currentTime = Date.now()

      this.pauseable = useRafFn(() => {
          this.currentTime = Date.now()
      })
    }
  },
  getters: {
    pause: state => state.pauseable.pause,
    resume: state => state.pauseable.resume,
    stop: (state) => () => {
      state.pauseable.pause()
    },
    duration: state => state.currentTime - state.startTime
  }
})

// @ts-ignore
export const useReporterStore = defineStore({
  id: 'reporter',
  state() {
    return {
      bus: new EventEmitter(),
      runState: '',
      runnables: null,
      autoScrolling: null,
      statsStore: useStatsStore()
    }
  },
  actions: {
    init(bus = new EventEmitter(), appState?: any) {
      const statsStore = useStatsStore()
      this.bus = bus

      this.bus.on('reporter:start', () => {
        this.runState ='running'
        statsStore.start()
      })

      this.bus.on('runnables:ready', (rootRunnable) => {
        this.runnables = Runnables(rootRunnable)
      })

      this.bus.on('test:after:run', (props: Test) => {
        this.runnables.getTest(props.id).state = props.state
      })

      this.bus.on('test:before:run:async', (props) => {
        this.runnables.getTest(props.id).state = 'running'
      })

      this.bus.on('run:end', () => {
        this.runState = 'finished'
        statsStore.stop()
      })

      this.bus.on('paused', () => {
        this.pause()
      })

      this.bus.on('resume', () => {
        this.runState = 'running'
        statsStore.resume()
      })

      this.bus.on('reporter:restart:test:run', () => {
        this.runnables = null
        this.runState = null
        this.statsStore.pause()
        this.bus.emit('reporter:restarted')
      })

      this.bus.on('reporter:log:add', (props) => {
        this.runnables.addLog(props)
      })
    },
    setRunnablesFromRoot(rootRunnable) {
      this.runnables = Runnables(rootRunnable)
    },
    restart() {
      this.statsStore.stop()
      this.bus.emit('runner:restart')
    },
    pause() {
      this.runState = 'paused'
      this.statsStore.pause()
      this.bus.emit('runner:stop')
    },
    resume() {
      this.runState = 'running'
      this.statsStore.resume()
      this.bus.emit('runner:resume')
    }
  }
})


interface Runnable {
  readonly id: string,
  state: ComputedRef<RunnableState>
}

class Test implements Runnable {
  readonly type: RunnableType = 'test'
  readonly id: string
  state: ComputedRef<RunnableState>
  constructor(test: RawTest) {
    this.id = test.id
    this.state = computed(() => test.status)
  }
}

export interface Suite  {}
export class Suite implements Runnable {
  readonly type: RunnableType = 'suite'
  readonly id: string
  public children: Ref<(Test | Suite)[]> = ref([])
  public state: ComputedRef<RunnableState>
  private tests: Test[] = []
  private suites: Suite[] = []
  
  constructor(suite: RawSuite) {
    this.id = suite.id
    this.tests = suite.tests // nested
    this.suites = suite.suites // nested
    this.children = ref([])
    this.state = computed(() => {
      return 'failed'
    })
  }  
}

function createRunnables<T>(type: 'suite' | 'test', runnables: TestOrSuite<T>[], hooks: Hook[], level: number, runnablesById): (Suite | Test)[] {
  // @ts-ignore

  _.each(runnables, (runnableProps: Test | Suite, idx) => {
    runnables[idx] = createRunnable(type, runnableProps, hooks, level, runnablesById)
  })
  return runnables
}

function createRunnableChildren(props: RootRunnable, level: number, runnablesById: Record<string, Test | Suite>) {
  const addParentRunnables = (runnable) => {
    const parentRunnables = runnable.parentRunnables || []

    parentRunnables.unshift(props.id)
    
    return {
      ...runnable,
      parentRunnables,
      parentId: props.root ? null : props.id
    }
  }

  props.suites = (props.suites || []).map(addParentRunnables)
  props.tests = (props.tests || []).map(addParentRunnables)

  return createRunnables('test', props.tests, props.hooks, level, runnablesById).concat(
    createRunnables('suite', props.suites, props.hooks, level, runnablesById),
  )
}

function createRunnable(type, props, hooks: Hook[], level: number, runnablesById) {
  runnablesById[props.id] = props
  props.hooks = _.unionBy(props.hooks, hooks, 'hookId')
  if (type === 'suite') {
    return createSuite(props as Suite, level, runnablesById)
  } else {
    return createTest(props as Test, level)
  }
}

function createTest(props, level): Test {
  const test = props
  test.level = level
  test.hooks = [
    ...props.hooks.map(h => {
      h.logs = []
      return h
    }),
    {
      hookId: props.id.toString(),
      hookName: 'test body',
      invocationDetails: props.invocationDetails,
      logs: []
    }
  ]

  return test
}

function createSuite(props: Suite, level, runnablesById): Suite {
  return {
    ...props,
    level,
    state: null,
    children: createRunnableChildren(props, ++level, runnablesById),
  }
}


function findNodeById(curr, id) {
  if (curr.id == id) {
    return curr
  }

  let children = _.isArrayLike(curr) ? curr : curr.children
  if (children && children.length > 0) {
    for (let i = 0; i < children.length; i++) {
      const node = findNodeById(children[i], id)
      if (node) return node
    }
  }
  return null
}

function updateNodeAtId(payload, id, _tree) {
  const node = findNodeById(_tree, id)
  if (!node) return
  _.each(payload, (v, k) => {
    node[k] = v
  })
  return node
}

function syncNodeWithTree(node, _tree) {
  return updateNodeAtId(node, node.id, _tree)
}
