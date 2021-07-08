// @ts-nocheck
/**
 * Reporter store structure
 1. Command Log
 2. Stats + Timing
 */

import { defineStore } from 'pinia'
import _, { Dictionary } from 'lodash'
import map from "lodash/fp/map";
import sortBy from "lodash/fp/sortBy";
import flow from "lodash/fp/flow";
import filter from "lodash/fp/filter";
import { EventEmitter } from 'events'
import { useRafFn, Fn, Pausable } from '../composables/core/index'
import { RunnableState } from '../types'
import { computed, ref, Ref, ComputedRef, watch, toRefs, reactive } from 'vue'

type RunnableType = 'suite' | 'test'
type RawSuite = any
type RawTest = any
export type TestsByState = ComputedRef<Dictionary<(TestModel | SuiteModel)[]>>

interface Runnables {
  nested: (TestModel | SuiteModel)[],
  flat: Record<string, TestModel | SuiteModel>
  tests: TestModel[]
  suites: SuiteModel[]
  hooks: HookModel[]
  testsByState: TestsByState,
  stats: ComputedRef<Dictionary<RunnableState>[]>
  getTest: (id: string) => TestModel | SuiteModel
  getHook: (id: string) => any
  addLog: (props: any) => any
}

export function Runnables(rootRunnable: RawSuite): Runnables {
  // Key value
  const flat: Record<string, TestModel | SuiteModel> = {}
  
  // Hierarchical representation
  const nested = createRunnableChildren(rootRunnable, 0, flat)

  // By type
  const { test, suite } = _.groupBy(flat, 'type')
  const tests = test

  const testsByState = computed(() => _.groupBy(tests, 'state'))
  const getHook = (hook) => {
    return _.find(flat[hook.testId].hooks, h => h.hookId === hook.hookId)
  }
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
        this.runnables.getTest(props.id).state = 'processing'
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

interface RunnableModel {
  readonly id: string,
  state: ComputedRef<RunnableState>
  level: number
}

function createHooks(hooks, test) {
  const ordered = ['before all', 'before each', 'test body', 'after each', 'after all']

  return flow(
    sortBy('hookId'),
    sortBy(h => ordered.indexOf(h.hookName)),
    map(h => new HookModel(h, test)),
    filter(h => h.commands.length > 0)
  )(hooks)
}
export interface TestModel {}
export class TestModel implements RunnableModel {
  readonly type: RunnableType = 'test'
  readonly id: string
  state: ComputedRef<RunnableState>
  commands: CommandModel[] = []
  hooks: HookModel[] = []
  constructor(test: RawTest) {
    this.id = test.id
    this.state = computed(() => test.state || 'not-started')
    this.level = test.level
    this.title = test.title
    // A test has many commands
    // These commands are executed within the test body hook
    // Or other hooks like before/after
    // Whenever a new command is added to the test, the related hook must update

    this.hooks = createHooks(test.hooks, test)
    this.hooksByKind = _.groupBy(this.hooks, 'hookName')
  }
}


interface HookModel {}
class HookModel {
  public hookId: string
  public hookName: HookName
  public commands: CommandModel[] = []

  constructor({ hookId, hookName }, test) {
    this.hookId = hookId
    this.hookName = hookName
    this.commands = _.filter(test.commands, c => c.hookId === hookId)
  }
}

interface CommandModel {}
class CommandModel {
  public hookId: string
  public testId: string
  public id: string
  public instrument: string
  public message: string
  public name: string
  public state: RunnableState
  public timeout: number
  public type: string = 'parent'
}

export interface SuiteModel {}
export class SuiteModel implements RunnableModel {
  readonly type: RunnableType = 'suite'
  readonly id: string
  public children: Ref<(TestModel | SuiteModel)[]> = ref([])
  public state: ComputedRef<RunnableState>
  private tests: Test[] = []
  private suites: Suite[] = []
  hooks: HookModel[] = []
  
  constructor(suite: RawSuite) {
    this.id = suite.id
    this.tests = suite.tests || []// nested
    this.suites = suite.suites || [] // nested
    this.children = ref(suite.children || [])

    this.state = computed(() => {
      const countByStatus = _.groupBy(this.children.value, 'state')
      if (countByStatus.failed) return 'failed'
      if (countByStatus.processing) return 'processing'
      if (countByStatus['not-started']) return 'not-started'
      if (countByStatus.pending && !countByStatus.passed) return 'pending'
      return 'passed'
    })

    this.title = suite.title
    this.tests = ref(suite.tests || [])
    this.suites = ref(suite.suites || [])
    this.level = suite.level
    this.hooks = suite.hooks
  }  
}

function createRunnables<T>(type: 'suite' | 'test', runnables: TestOrSuite<T>[], hooks: HookModel[], level: number, runnablesById): (SuiteModel | TestModel)[] {
  // @ts-ignore

  _.each(runnables, (runnableProps: TestModel | SuiteModel, idx) => {
    runnables[idx] = createRunnable(type, runnableProps, hooks, level, runnablesById)
  })
  return runnables
}

function createRunnableChildren(props: RootRunnable, level: number, runnablesById: Record<string, TestModel | SuiteModel>) {
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

function createRunnable(type, props, hooks: HookModel[], level: number, runnablesById) {
  runnablesById[props.id] = props

  props.hooks = _.unionBy(hooks, props.hooks, 'hookId')
  
  if (type === 'suite') {
    return createSuite(props as SuiteModel, level, runnablesById)
  } else {
    return createTest(props as TestModel, level)
  }
}

function createTest(props, level): TestModel {
  const test = props
  test.level = level
  test.hooks = [
    ...props.hooks.map(h => new HookModel(h, test)),
    new HookModel({
      hookId: props.id.toString(),
      hookName: 'test body',
      invocationDetails: props.invocationDetails,
      logs: []
    }, test)
  ]

  const testModel = new TestModel(test)
  return testModel
}

function createSuite(props: SuiteModel, level, runnablesById): SuiteModel {
  return new SuiteModel({
    ...props,
    level,
    state: null,
    children: createRunnableChildren(props, ++level, runnablesById),
  })
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
