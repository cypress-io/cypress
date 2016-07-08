import _ from 'lodash'
import { computed, observable } from 'mobx'

import Hook from '../hooks/hook-model'
import Runnable from '../runnables/runnable-model'

export default class Test extends Runnable {
  @observable agents = []
  @observable commands = []
  // @observable error = asReference(null)
  @observable hooks = []
  @observable isActive = false
  @observable routes = []
  @observable _state = null
  type = 'test'

  constructor (props, level) {
    super(props, level)

    this._state = props.state
    // this.error = props.err
  }

  @computed get isLongRunning () {
    return _.some(this.commands, (command) => command.isLongRunning)
  }

  @computed get state () {
    return this._state || (this.isActive ? 'active' : 'processing')
  }

  addAgent (agent) {
    this.agents.push(agent)
  }

  addRoute (route) {
    this.routes.push(route)
  }

  addCommand (command, hookName) {
    const hook = this._findOrCreateHook(hookName)
    this.commands.push(command)
    hook.addCommand(command)
  }

  start () {
    this.isActive = true
  }

  finish ({ state, err, hookName }) {
    this._state = state
    // this.error = err
    this.isActive = false
    if (hookName) {
      _.find(this.hooks, { name: hookName }).failed = true
    }
  }

  commandMatchingError () {
    return _(this.hooks)
      .map((hook) => hook.commandMatchingError(this.errorMessage))
      .compact()
      .last()
  }

  _findOrCreateHook (name) {
    const hook = _.find(this.hooks, { name })
    if (hook) return hook

    const newHook = new Hook({ name })
    this.hooks.push(newHook)
    return newHook
  }
}
