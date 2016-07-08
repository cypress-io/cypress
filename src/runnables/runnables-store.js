import _ from 'lodash'
import { observable } from 'mobx'

import Agent from '../instruments/agent-model'
import Command from '../commands/command-model'
import Route from '../instruments/route-model'
import Suite from './suite-model'
import Test from '../test/test-model'

const defaults = {
  isReady: false,
  runnables: [],
  _tests: {},
  _logs: {},

  attemptingShowSnapshot: false,
  showingSnapshot: false,
}

class RunnablesStore {
  @observable isReady = defaults.isReady
  @observable runnables = defaults.runnables
  @observable _tests = defaults._tests
  @observable _logs = defaults._logs

  attemptingShowSnapshot: defaults.attemptingShowSnapshot
  showingSnapshot: defaults.showingSnapshot

  setRunnables (rootRunnable) {
    this.runnables = this._createRunnableChildren(rootRunnable, 0)
    this.isReady = true
  }

  _createRunnableChildren (runnableProps, level) {
    return this._createRunnables('test', runnableProps.tests, level).concat(
      this._createRunnables('suite', runnableProps.suites, level)
    )
  }

  _createRunnables (type, runnables, level) {
    return _.map(runnables, (runnableProps) => this._createRunnable(type, runnableProps, level))
  }

  _createRunnable (type, props, level) {
    return type === 'suite' ? this._createSuite(props, level) : this._createTest(props, level)
  }

  _createSuite (props, level) {
    const suite = new Suite(props, level)
    suite.children = this._createRunnableChildren(props, ++level)
    return suite
  }

  _createTest (props, level) {
    const test = new Test(props, level)
    this._tests[test.id] = test

    _.each(props.agents, this.addLog.bind(this))
    _.each(props.commands, this.addLog.bind(this))
    _.each(props.routes, this.addLog.bind(this))

    return test
  }

  runnableStarted ({ id }) {
    this._withTest(id, (test) => test.start())
  }

  runnableFinished (props) {
    this._withTest(props.id, (test) => test.finish(props))
  }

  testById (id) {
    return this._tests[id]
  }

  addLog (log) {
    switch (log.instrument) {
      case 'command': {
        const command = new Command(log)
        this._logs[log.id] = command
        this._withTest(log.testId, (test) => test.addCommand(command, log.hookName))
        break
      }
      case 'agent': {
        const agent = new Agent(log)
        this._logs[log.id] = agent
        this._withTest(log.testId, (test) => test.addAgent(agent))
        break
      }
      case 'route': {
        const route = new Route(log)
        this._logs[log.id] = route
        this._withTest(log.testId, (test) => test.addRoute(route))
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
    this._logs[log.id].update(log)
  }

  reset () {
    _.each(defaults, (value, key) => {
      this[key] = value
    })
  }
}

export default new RunnablesStore()
