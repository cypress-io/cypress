import type { TestFilter } from '@packages/types'
import _ from 'lodash'
import { action, observable, makeObservable } from 'mobx'
import type AgentModel from '../agents/agent-model'
import type { AgentProps } from '../agents/agent-model'
import type CommandModel from '../commands/command-model'
import type { CommandProps } from '../commands/command-model'
import type { HookProps } from '../hooks/hook-model'
import appState, { AppState } from '../lib/app-state'
import scroller, { Scroller } from '../lib/scroller'
import type RouteModel from '../routes/route-model'
import type { RouteProps } from '../routes/route-model'
import TestModel, { TestProps, UpdatableTestProps, UpdateTestCallback } from '../test/test-model'
import type RunnableModel from './runnable-model'
import SuiteModel, { SuiteProps } from './suite-model'

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
  testFilter?: TestFilter
  totalTests?: number
  totalUnfilteredTests?: number
}

type RunnableType = 'test' | 'suite'
type TestOrSuite<T> = T extends TestProps ? TestProps : SuiteProps

export class RunnablesStore {
  @observable isReady = defaults.isReady
  @observable runnables: RunnableArray = []
  /**
   * Stores a list of all the runnables files where the reporter
   * has passed without any specific order.
   *
   * key: spec FilePath
   * content: RunnableArray
   */
  @observable runnablesHistory: Record<string, RunnableArray> = {}
  @observable totalTests: number = 0
  @observable totalUnfilteredTests: number = 0
  @observable testFilter: TestFilter

  runningSpec: string | null = null

  hasTests: boolean = false
  hasSingleTest: boolean = false

  private appState: AppState
  private scroller: Scroller
  [key: string]: any

  _tests: Record<string, TestModel> = {}
  _runnablesQueue: Array<RunnableModel> = []

  attemptingShowSnapshot = defaults.attemptingShowSnapshot
  showingSnapshot = defaults.showingSnapshot

  constructor ({ appState, scroller }: Props) {
    makeObservable(this)
    this.appState = appState
    this.scroller = scroller
  }

  setRunnables (rootRunnable: RootRunnable) {
    this.runnables = this._createRunnableChildren(rootRunnable, 0)
    this.isReady = true

    const numTests = _.keys(this._tests).length

    this.hasTests = numTests > 0
    this.hasSingleTest = numTests === 1
    this.totalTests = numTests

    this.totalUnfilteredTests = rootRunnable.totalUnfilteredTests || 0
    this.testFilter = rootRunnable.testFilter

    this._finishedInitialRendering()
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

  runnableFinished (props: TestProps, isInteractive: boolean) {
    this._withTest(props.id, (test) => {
      test.finish(props, isInteractive)
    })
  }

  testById (id: string) {
    return this._tests[id]
  }

  addLog (props: LogProps) {
    this._withTest(props.testId, (test) => {
      test.addLog(props)
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

  removeLog (props: LogProps) {
    this._withTest(props.testId, (test) => {
      test.removeLog(props)
    })
  }

  reset () {
    _.each(defaults, (value, key) => {
      this[key] = value
    })

    this.runnables = []
    this.runnablesHistory = {}
    this._tests = {}
    this._runnablesQueue = []
    this.totalTests = 0
  }

  @action
  setRunningSpec (specPath: string) {
    const previousSpec = this.runningSpec

    this.runningSpec = specPath

    if (!previousSpec || previousSpec === specPath) {
      return
    }

    this.runnablesHistory[previousSpec] = this.runnables
  }
}

export default new RunnablesStore({ appState, scroller })
