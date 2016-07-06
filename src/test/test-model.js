import _ from 'lodash'
import { computed, observable } from 'mobx'

import Runnable from '../runnables/runnable-model'
import Hook from '../hooks/hook-model'

export default class Test extends Runnable {
  @observable agents = []
  @observable commands = []
  @observable errorMessage = null
  @observable hooks = []
  @observable isActive = false
  @observable routes = []
  @observable _state = null
  type = 'test'

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

  finish ({ state, err }) {
    this._state = state
    this.errorMessage = err
    this.isActive = false
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
