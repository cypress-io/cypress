import _ from 'lodash'
import { action, autorun, computed, observable } from 'mobx'

import Err from '../lib/err-model'
import Hook from '../hooks/hook-model'
import Runnable from '../runnables/runnable-model'

export default class Test extends Runnable {
  @observable agents = []
  @observable commands = []
  @observable err = new Err({})
  @observable hooks = []
  // TODO: make this an enum with states: 'QUEUED, ACTIVE, INACTIVE'
  @observable isActive = null
  @observable isLongRunning = false
  @observable isOpen = false
  @observable routes = []
  @observable _state = null
  type = 'test'

  constructor (props, level) {
    super(props, level)

    this._state = props.state
    this.err.update(props.err)

    autorun(() => {
      // if at any point, a command goes long running, set isLongRunning
      // to true until the test becomes inactive
      if (!this.isActive) {
        action('became:inactive', () => this.isLongRunning = false)()
      } else if (this._hasLongRunningCommand) {
        action('became:long:running', () => this.isLongRunning = true)()
      }
    })
  }

  @computed get _hasLongRunningCommand () {
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

  update ({ state, err, hookName, isOpen }, cb) {
    if (cb) {
      this.callbackAfterUpdate = () => {
        this.callbackAfterUpdate = null
        cb()
      }
    }

    this._state = state
    this.err.update(err)
    if (isOpen != null) {
      this.isOpen = isOpen
    }

    if (hookName) {
      const hook = _.find(this.hooks, { name: hookName })
      if (hook) {
        hook.failed = true
      }
    }
  }

  finish (props) {
    this.update(props)
    this.isActive = false
  }

  commandMatchingErr () {
    return _(this.hooks)
      .map((hook) => hook.commandMatchingErr(this.err))
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
