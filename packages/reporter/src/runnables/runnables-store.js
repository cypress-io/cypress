import _ from 'lodash'
import { action, observable } from 'mobx'

import appState from '../lib/app-state'
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

  setIsOpen ({ id, isOpen }, cb) {
    this._withTest(id, (test) => {
      test.setIsOpen(isOpen, cb)
    })
  }

  runnableStarted (props) {
    this._withTest(props.id, (test) => {
      test.start(props)
    })
  }

  runnableFinished (props) {
    this._withTest(props.id, (test) => {
      test.finish(props)
    })
  }

  testById (id) {
    return this._tests[id]
  }

  addLog (log) {
    this._withTest(log.testId, (test) => {
      test.addLog(log)
    })
  }

  _withTest (id, cb) {
    // we get events for suites and tests, but only tests change during a run,
    // so if the id isn't found in this._tests, we ignore it b/c it's a suite
    const test = this._tests[id]

    if (test) cb(test)
  }

  updateLog (props) {
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
