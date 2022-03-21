import _ from 'lodash'
import { action, observable } from 'mobx'
import AgentModel, { AgentProps } from '../agents/agent-model'
import CommandModel, { CommandProps } from '../commands/command-model'
import { HookProps } from '../hooks/hook-model'
import appState, { AppState } from '../lib/app-state'
import scroller, { Scroller } from '../lib/scroller'
import RouteModel, { RouteProps } from '../routes/route-model'
import TestModel, { TestProps, UpdatableTestProps, UpdateTestCallback } from '../test/test-model'
import RunnableModel from './runnable-model'
import SuiteModel, { SuiteProps } from './suite-model'
import { SessionProps } from '../sessions/sessions-model'
import { info } from 'console'

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

export type LogProps = AgentProps | CommandProps | RouteProps | SessionProps

export type RunnableArray = Array<TestModel | SuiteModel>

export type TestsArray = Array<TestModel>

export type SuitesArray = Array<SuiteModel>

export type Log = AgentModel | CommandModel | RouteModel

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

  runningSpec: string | null = null

  hasTests: boolean = false
  hasSingleTest: boolean = false

  private appState: AppState
  private scroller: Scroller
  [key: string]: any

  tests: Array<TestModel> = []
  suites: Array<SuiteModel> = []
  _tests: Record<string, TestModel> = {}
  _logs: Record<string, Log> = {}
  _runnablesQueue: Array<RunnableModel> = []

  attemptingShowSnapshot = defaults.attemptingShowSnapshot
  showingSnapshot = defaults.showingSnapshot

  constructor ({ appState, scroller }: Props) {
    this.appState = appState
    this.scroller = scroller
  }

  setRunnables (rootRunnable: SuiteProps) {
    const children = this._createRunnableChildren(rootRunnable, 0)

    console.log(children)
    this.tests = children.tests
    this.suites = children.suites

    // console.log('runnables', this.runnables)

    this.isReady = true

    const numTests = _.keys(this._tests).length

    this.hasTests = numTests > 0
    this.hasSingleTest = numTests === 1

    this._finishedInitialRendering()
  }

  _createRunnableChildren (runnableProps: SuiteProps, level: number): { tests: Array<TestModel>, suites: Array<SuiteModel>} {
  // _createRunnableChildren (runnableProps: RootRunnable | SuiteProps, level: number) {
    console.log('_createRunnableChildren')

    // return this._createTestRunnables(runnableProps, level)
    // .concat(this._createSuiteRunnables(runnableProps, level))
    // const EMILY = this._createRunnablesE('test', runnableProps, level).concat(this._createRunnablesE('suite', runnableProps, level))

    // console.log('EMILY', EMILY)

    // return EMILY

    // const ORIGINAL =
    // .concat

    // console.log('ORIGINAL', ORIGINAL)

    return {
      suites: this._createRunnables<SuiteProps, SuiteModel>('suite', runnableProps.suites || [], runnableProps.hooks || [], runnableProps, level),
      tests: this._createRunnables<TestProps, TestModel>('test', runnableProps.tests || [], runnableProps.hooks || [], runnableProps, level),
    }
    // return ORIGINAL
  }

  _createRunnables<T, R> (type: RunnableType, runnables: Array<TestOrSuite<T>>, hooks: Array<HookProps>, suiteProps: SuiteProps, level: number): Array<TestModel | SuiteModel> {
    return runnables.map((runnableProps) => {
      const parents = suiteProps.parents || []

      runnableProps.parents = parents.concat([suiteProps.title || ''])

      return this._createRunnable(type, runnableProps, hooks, level)
    })
  }

  // _createRunnables<T> (type: RunnableType, runnables: Array<TestOrSuite<T>>, hooks: Array<HookProps>, parent: string, level: number) {
  //   return runnables.map((runnableProps) => {
  //     console.log('parent', parent)
  //     console.log('runnableProps.title', runnableProps.title)
  //     console.log('runnableProps.parent', runnableProps.parents)
  //     console.log((runnableProps.parents !== undefined && runnableProps.parents.length > 0))
  //     const parents = (runnableProps.parents === undefined) ? [parent] : runnableProps.parents.concat([parent])

  //     runnableProps.parents = parents

  //     return this._createRunnable(type, runnableProps, hooks, level)
  //   })
  // }

  _createRunnablesE (type: RunnableType, suiteProps: SuiteProps, level: number) {
    console.log('_createRunnablesE', suiteProps)
    const runnables = suiteProps[`${type}s`] || []
    const hooks = suiteProps.hooks || []

    console.log('runnables', type, runnables)

    return runnables.map((runnableProps) => {
      if (type === 'suite' && suiteProps.title !== '') {
        runnableProps.title = `${suiteProps.title} > ${runnableProps.title}`
      }

      return this._createRunnable(type, runnableProps, hooks, level)
    })
  }

  // _createTestRunnables (runnableProps: RootRunnable, level: number) {
  //   const tests: Array<TestProps> = runnableProps.tests || []
  //   const hooks = runnableProps.hooks || []

  //   return tests.map((testProps) => {
  //     testProps.hooks = _.unionBy(testProps.hooks, hooks, 'hookId')

  //     return this._createTest(testProps, level)
  //   })
  // }

  // _createSuiteRunnables (runnableProps: RootRunnable, level: number) {
  //   const suites: Array<SuiteProps> = runnableProps.suites || []
  //   const parent = runnableProps.title || ''
  //   const hooks = runnableProps.hooks || []

  //   return suites.map((suiteProps) => {
  //     suiteProps.hooks = _.unionBy(suiteProps.hooks, hooks, 'hookId')
  //     suiteProps.parent = parent

  //     return this._createSuite(suiteProps, level)
  //   })
  // }

  // _createRunnables<T> (type: RunnableType, runnableProps: RootRunnable, level: number) {
  //   // runnables: Array<TestOrSuite<T>>, hooks: Array<HookProps>, level: number) {

  //   return _.map(runnables, (runnableProps) => {
  //     return this._createRunnable<TestProps>(type, runnableProps, hooks, level)
  //   })
  // }

  _createRunnable<T> (type: RunnableType, props: TestOrSuite<T>, hooks: Array<HookProps>, level: number): TestModel | SuiteModel {
    props.hooks = _.unionBy(props.hooks, hooks, 'hookId')

    return type === 'suite' ? this._createSuite(props as SuiteProps, level) : this._createTest(props as TestProps, level)
  }

  _createSuite (props: SuiteProps, level: number): SuiteModel {
    const suite = new SuiteModel(props, level)

    this._runnablesQueue.push(suite)
    const children = this._createRunnableChildren(props, ++level)

    suite.tests = children.tests
    suite.suites = children.suites

    return suite
  }

  _createTest (props: TestProps, level: number): TestModel {
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
