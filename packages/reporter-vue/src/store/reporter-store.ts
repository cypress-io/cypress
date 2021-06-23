/**
 * Reporter store structure
 1. Command Log
 2. Stats + Timing
 */

import _, { Dictionary } from 'lodash'
import { EventEmitter } from 'events'
import { useRafFn, Fn, Pausable } from '../composables/core/index'
import { RunnableState } from '../types'
import { computed, ref, Ref, ComputedRef, watch } from 'vue'

const stores: Record<string, any> = { stats: null }

type RunnableType = 'suite' | 'test'
type RawSuite = any
type RawTest = any

interface StatsStore {
  start: () => Pausable,
  pause: Pausable["pause"],
  resume: Pausable["resume"],
  stop: Pausable["pause"]
}

interface Runnables {
  nested: (Test | Suite)[],
  flat: Record<string, Test | Suite>,
  tests: Test[]
  suites: Suite[]
  testsByState: ComputedRef<Dictionary<(Test | Suite)[]>>
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
    tests: test,
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

export function useReporterStore(bus = new EventEmitter(), appState: any): ReporterStore {
  if (stores.reporter) return stores.reporter
  let runnables: Runnables | Record<any, any> = {}
  const runState = ref('')
  const statsStore = useStatsStore()

  function init() {
    runnables = {}
    runState.value = 'ready'
    statsStore.stop()
  }

  bus.on('reporter:start', () => {
    runState.value ='running'
    statsStore.start()
  })

  bus.on('runnables:ready', (rootRunnable) => {
    runnables = Runnables(rootRunnable)
  })

  bus.on('test:after:run', (props: Test) => {
    runnables.getTest(props.id).state = props.state
  })

  bus.on('test:before:run:async', (props) => {
    runnables.getTest(props.id).state = 'running'
  })

  bus.on('run:end', () => {
    runState.value = 'finished'
    statsStore.stop()
  })

  bus.on('paused', () => {
    runState.value = 'paused'
    statsStore.pause()
  })

  bus.on('resume', () => {
    runState.value = 'running'
    statsStore.resume()
  })

  bus.on('reporter:restart:test:run', () => {
    init()
    statsStore.stop()
    bus.emit('reporter:restarted')
  })

  bus.on('reporter:log:add', (props) => {
    runnables.addLog(props)
  })

  return {
    spec: computed(() => appState.spec),
    bus,
    runnables,
    runState
  }
}

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

export function useStatsStore(): StatsStore {
  if (stores.stats) return stores.stats

  const startTime: Ref<number> = ref(0)
  const currentTime: Ref<number> = ref(0)
  let pause = () => { }
  let resume = () => { }

  const start = () => {
    startTime.value = Date.now()
    currentTime.value = Date.now()

    const pausable = useRafFn(() => {
      currentTime.value = Date.now()
    })
    pause = pausable.pause
    resume = pausable.resume
    return pausable
  }

  return stores.stats = {
    start,
    pause,
    resume,
    stop: () => {
      startTime.value = 0
      currentTime.value = 0
    },
  }
}



//       this.bus = bus
//       this.bus.on('runnables:ready', (rootRunnable) => {
//         this.setRunnablesFromRoot(rootRunnable)
//       })
      

//       this.bus.on('reporter:restart:test:run', () => {
//         this.$reset()
//         statsStore.$reset()
//         this.bus.emit('reporter:restarted')
//       })

//       this.bus.on('test:set:state', (props, cb) => {
//         this.runnables[props.id] = props
        
//         syncNodeWithTree(test, this.runnablesTree)
//       })

//       this.bus.on('test:before:run:async', (props) => {
//         const test = this.runnables[props.id]
//         test.state = 'running'
//       })

//       this.bus.on('test:after:run', (props) => {
//         const test = this.runnables[props.id]
//         test.state = props.state
//       })

//       this.bus.on('paused', (nextCommandName: string) => {
//       })

//     },
//     setRunnablesFromRoot(rootRunnable) {
//       const runnablesById = {}
//       runnablesById[rootRunnable.id] = rootRunnable
//       this.runnablesTree = createRunnableChildren(rootRunnable, 0, runnablesById)
//       this.runnables = runnablesById
//     },
//     restart() {
//       this.bus.emit('runner:restart')
//     }
//   },
//   getters: {
//     spec: state => state.originalValues.spec || {},
//     ready: state => state.runnables !== null,
//     specName: state => state.spec.name,
//     tests: state => _.filter(state.runnables, r => r.type === 'test'),
//     suites: state => _.filter(state.runnables, r => r.type === 'suite'),
//   }
// })

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
    
    // if (!props.root) {
    //   parentRunnables.unshift(props.id)
    // }

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
