import _ from 'lodash'
import { action, observable } from 'mobx'

import appState from '../lib/app-state'
import Agent from '../agents/agent-model'
import Command from '../commands/command-model'
import Route from '../routes/route-model'
import scroller from '../lib/scroller'
import Suite from './suite-model'
import Test from '../test/test-model'

const defaults = {
  hasSingleTest: false,
  hasTests: false,
  isReady: false,

  attemptingShowSnapshot: false,
  showingSnapshot: false,
}

class RunnablesStore {
  @observable isReady = defaults.isReady
  @observable runnables = []

  _tests = {}
  _logs = {}
  _runnablesQueue = []

  attemptingShowSnapshot = defaults.attemptingShowSnapshot
  showingSnapshot = defaults.showingSnapshot

  constructor ({ appState, scroller }) {
    this.appState = appState
    this.scroller = scroller
  }

  setRunnables (rootRunnable) {
    this.runnables = this._createRunnableChildren(rootRunnable, 0)
    this.isReady = true

    const numTests = _.keys(this._tests).length

    this.hasTests = numTests > 0
    this.hasSingleTest = numTests === 1

    this._startRendering()
  }

  _createRunnableChildren (runnableProps, level) {
    return this._createRunnables('test', runnableProps.tests, level).concat(
      this._createRunnables('suite', runnableProps.suites, level)
    )
  }

  _createRunnables (type, runnables, level) {
    return _.map(runnables, (runnableProps) => {
      return this._createRunnable(type, runnableProps, level)
    })
  }

  _createRunnable (type, props, level) {
    return type === 'suite' ? this._createSuite(props, level) : this._createTest(props, level)
  }

  _createSuite (props, level) {
    const suite = new Suite(props, level)

    this._runnablesQueue.push(suite)
    suite.children = this._createRunnableChildren(props, ++level)

    return suite
  }

  _createTest (props, level) {
    const test = new Test(props, level)

    this._runnablesQueue.push(test)
    this._tests[test.id] = test

    _.each(props.agents, this.addLog.bind(this))
    _.each(props.commands, this.addLog.bind(this))
    _.each(props.routes, this.addLog.bind(this))

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

  setInitialScrollTop (initialScrollTop) {
    this._initialScrollTop = initialScrollTop
  }

  updateTest (props, cb) {
    this._withTest(props.id, (test) => {
      return test.update(props, cb)
    })
  }

  runnableStarted ({ id }) {
    this._withTest(id, (test) => {
      return test.start()
    })
  }

  runnableFinished (props) {
    this._withTest(props.id, (test) => {
      return test.finish(props)
    })
  }

  testById (id) {
    return this._tests[id]
  }

  addLog (log) {
    switch (log.instrument) {
      case 'command': {
        const command = new Command(log)

        this._logs[log.id] = command
        this._withTest(log.testId, (test) => {
          return test.addCommand(command, log.hookName)
        })
        break
      }
      case 'agent': {
        const agent = new Agent(log)

        this._logs[log.id] = agent
        this._withTest(log.testId, (test) => {
          return test.addAgent(agent)
        })
        break
      }
      case 'route': {
        const route = new Route(log)

        this._logs[log.id] = route
        this._withTest(log.testId, (test) => {
          return test.addRoute(route)
        })
        break
      }
      default:
        throw new Error(`Attempted to add log for unknown instrument: ${log.instrument}`)
    }
  }

  _withTest (id, cb) {
    // we get events for suites and tests, but only tests change during a run,
    // so if the id isn't found in this._tests, we ignore it b/c it's a suite
    const test = this._tests[id]

    if (test) cb(test)
  }

  updateLog (log) {
    const found = this._logs[log.id]

    if (found) {
      found.update(log)
    }
  }

  reset () {
    _.each(defaults, (value, key) => {
      this[key] = value
    })
    this.runnables = []
    this._tests = {}
    this._logs = {}
    this._runnablesQueue = []
  }
}

export { RunnablesStore }

export default new RunnablesStore({ appState, scroller })
