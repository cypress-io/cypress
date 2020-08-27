import _ from 'lodash'
import { action, observable } from 'mobx'

import appState, { AppState } from '../lib/app-state'
import AgentModel, { AgentProps } from '../agents/agent-model'
import CommandModel, { CommandProps } from '../commands/command-model'
import RouteModel, { RouteProps } from '../routes/route-model'
import scroller, { Scroller } from '../lib/scroller'
import { HookProps } from '../hooks/hook-model'
import SuiteModel, { SuiteProps } from './suite-model'
import TestModel, { TestProps, UpdateTestCallback, UpdatableTestProps } from '../test/test-model'
import RunnableModel from './runnable-model'

const defaults = {
  hasSingleTest: false,
  hasTests: false,
  isReady: false,

  attemptingShowSnapshot: false,
  showingSnapshot: false,
}

interface Props {
  appState: AppState
  scroller: Scroller
}

export type LogProps = AgentProps | CommandProps | RouteProps

export type RunnableArray = Array<TestModel | SuiteModel>

export type Log = AgentModel | CommandModel | RouteModel

export interface RootRunnable {
  hooks?: Array<HookProps>
  tests?: Array<TestProps>
  suites?: Array<SuiteProps>
}

type RunnableType = 'test' | 'suite'
type TestOrSuite<T> = T extends TestProps ? TestProps : SuiteProps

class RunnablesStore {
  @observable isReady = defaults.isReady
  @observable runnables: RunnableArray = []
  hasTests: boolean = false
  hasSingleTest: boolean = false

  private appState: AppState
  private scroller: Scroller
  [key: string]: any

  _tests: Record<string, TestModel> = {}
  _logs: Record<string, Log> = {}
  _runnablesQueue: Array<RunnableModel> = []

  attemptingShowSnapshot = defaults.attemptingShowSnapshot
  showingSnapshot = defaults.showingSnapshot

  constructor ({ appState, scroller }: Props) {
    this.appState = appState
    this.scroller = scroller
  }

  setRunnables (rootRunnable: RootRunnable) {
    this.runnables = this._createRunnableChildren(rootRunnable, 0)
    this.isReady = true

    const numTests = _.keys(this._tests).length

    this.hasTests = numTests > 0
    this.hasSingleTest = numTests === 1

    this._startRendering()
  }

  _createRunnableChildren (runnableProps: RootRunnable, level: number) {
    return this._createRunnables<TestProps>('test', runnableProps.tests || [], runnableProps.hooks || [], level).concat(
      this._createRunnables<SuiteProps>('suite', runnableProps.suites || [], runnableProps.hooks || [], level),
    )
  }

  _createRunnables<T> (type: RunnableType, runnables: Array<TestOrSuite<T>>, hooks: Array<HookProps>, level: number) {
    return _.map(runnables, (runnableProps) => {
      return this._createRunnable(type, runnableProps, hooks, level)
    })
  }

  _createRunnable<T> (type: RunnableType, props: TestOrSuite<T>, hooks: Array<HookProps>, level: number) {
    props.hooks = _.unionBy(props.hooks, hooks, 'hookId')

    return type === 'suite' ? this._createSuite(props as SuiteProps, level) : this._createTest(props as TestProps, level)
  }

  _createSuite (props: SuiteProps, level: number) {
    const suite = new SuiteModel(props, level)

    this._runnablesQueue.push(suite)
    suite.children = this._createRunnableChildren(props, ++level)

    return suite
  }

  _createTest (props: TestProps, level: number) {
    const test = new TestModel(props, level, this)

    this._runnablesQueue.push(test)
    this._tests[test.id] = test

    return test
  }

  // progressively renders the runnables instead of all of them being rendered
  // at once. this prevents a noticeable lag in initial rendering when there
  // is a large number of tests
  _startRendering (index = 0) {
    requestAnimationFrame(action('start:rendering', () => {
      const runnable = this._runnablesQueue[index]

      if (!runnable) {
        this._finishedInitialRendering()

        return
      }

      runnable.shouldRender = true
      this._startRendering(index + 1)
    }))
  }

  _finishedInitialRendering () {
    if (this.appState.isRunning) {
      // have an initial scrollTop set, meaning we reloaded from a domain change
      // so reset to the saved scrollTop
      if (this._initialScrollTop) this.scroller.setScrollTop(this._initialScrollTop)
    } else {
      // finished running before initial rendering complete (but wasn't manually
      // stopped), meaning some tests didn't get a chance to get scrolled to
      // scroll to the end since that's the right place to be
      if (this.appState.autoScrollingEnabled && !this.appState.isStopped) {
        this.scroller.scrollToEnd()
      }
    }
  }

  setInitialScrollTop (initialScrollTop: number) {
    this._initialScrollTop = initialScrollTop
  }

  updateTest (props: UpdatableTestProps, cb: UpdateTestCallback) {
    this._withTest(props.id, (test) => {
      test.update(props, cb)
    })
  }

  runnableStarted (props: TestProps) {
    this._withTest(props.id, (test) => {
      test.start(props)
    })
  }

  runnableFinished (props: TestProps) {
    this._withTest(props.id, (test) => {
      test.finish(props)
    })
  }

  testById (id: string) {
    return this._tests[id]
  }

  addLog (log: LogProps) {
    this._withTest(log.testId, (test) => {
      test.addLog(log)
    })
  }

  _withTest (id: string, cb: ((test: TestModel) => void)) {
    // we get events for suites and tests, but only tests change during a run,
    // so if the id isn't found in this._tests, we ignore it b/c it's a suite
    const test = this._tests[id]

    if (test) cb(test)
  }

  updateLog (props: LogProps) {
    this._withTest(props.testId, (test) => {
      test.updateLog(props)
    })
  }

  reset () {
    _.each(defaults, (value, key) => {
      this[key] = value
    })

    this.runnables = []
    this._tests = {}
    this._runnablesQueue = []
  }
}

export { RunnablesStore }

export default new RunnablesStore({ appState, scroller })
