import _ from 'lodash'
import { observable } from 'mobx'

import Agent from '../test/agent-model'
import Command from '../test/command-model'
import Route from '../test/route-model'
import Runnable from './runnable-model'

const defaults = {
  runnables: [],
  _runnables: {},
  _logs: {},
}

class RunnablesStore {
  @observable runnables = defaults.runnables
  @observable _runnables = defaults._runnables
  @observable _logs = defaults._logs

  setRunnables (rootRunnable) {
    this.runnables = this._createRunnableChildren(rootRunnable)
  }

  _createRunnableChildren (runnable) {
    return this._createRunnables(runnable.tests, 'test').concat(
      this._createRunnables(runnable.suites, 'suite')
    )
  }

  _createRunnables (runnables, type) {
    return _.map(runnables, (runnable) => this._createRunnable(runnable, type))
  }

  _createRunnable (props, type) {
    const runnable = new Runnable(props, type)
    this._runnables[runnable.id] = runnable
    runnable.children = this._createRunnableChildren(props)
    return runnable
  }

  addLog (log) {
    switch (log.instrument) {
      case 'command': {
        const command = new Command(log)
        this._logs[log.id] = command
        this._runnables[log.testId].addCommand(command)
        break
      }
      case 'agent': {
        const agent = new Agent(log)
        this._logs[log.id] = agent
        this._runnables[log.testId].addAgent(agent)
        break
      }
      case 'route': {
        const route = new Route(log)
        this._logs[log.id] = route
        this._runnables[log.testId].addRoute(route)
        break
      }
      default:
        throw new Error(`Attempted to add log for unknown instrument: ${log.instrument}`)
    }
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
