export * from './stats-store'
export * from './reporter-store'
export * from './runnables-store'
import _ from 'lodash'
import { defineStore } from 'pinia'
import { reactive } from 'vue'

import type { Runnable, RootRunnable, Suite, Test, TestOrSuite, Hook } from '../runnables/types'

export const useStore = defineStore({
  id: 'main',
  state() {
    return {
      bus: null,
      runnables: null,
      runnablesById: {},
      originalValues: {}
    }
  },
  actions: {
    init(bus, state = {}) {
      this.originalValues = state

      this.bus = bus
      this.bus.on('runnables:ready', (rootRunnable) => {
        this.setRunnablesFromRoot(rootRunnable)
      })

      this.bus.on('test:set:state', (props, cb) => {
        this.tests[props.id] = props
      })

      this.bus.on('test:before:run', (props) => {
        this.tests[props.id].state = 'running'
      })
      this.bus.on('test:after:run', (props) => {
        const test = this.runnablesById[props.id]

        if (props.state === 'failed') {
          this.runnablesById[test.parentId].state = 'failed'
        }

        test.state = props.state
      })
    },
    setRunnablesFromRoot(rootRunnable) {
      const runnablesById = {}
      this.runnables = createRunnableChildren(rootRunnable, 0, runnablesById)
      this.runnablesById = runnablesById
    },
  },
  getters: {
    runnables: state => {
      
      return _.each(state.runnablesById, () => {
        return {

        }
      })
    },
    spec: state => state.originalValues.spec || {},
    ready: state => state.runnables !== null,
    specName: state => state.spec.name,
    tests: state => _.filter(state.runnablesById, r => r.type === 'test'),
    suites: state => _.filter(state.runnablesById, r => r.type === 'suite'),
  }
})


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
      parentId: props.id
    }
  }

  props.suites = props.suites.map(addParentRunnables)
  props.tests = props.tests.map(addParentRunnables)

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
    return createTest(props as Test)
  }
}

function createTest(props): Test {
  const test = props
  test.state = 'pending'
  test.hooks = [
    ...props.hooks,
    {
      hookId: props.id.toString(),
      hookName: 'test body',
      invocationDetails: props.invocationDetails,

    }
  ]

  return test
}

function createSuite(props: Suite, level, runnablesById): Suite {
  return {
    ...props,
    children: createRunnableChildren(props, ++level, runnablesById),
  }
}