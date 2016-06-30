import _ from 'lodash'
import { computed, observable } from 'mobx'

import Hook from './hook-model'

export default class Runnable {
  @observable id
  @observable isActive = false
  @observable isPending
  @observable isRunning = true
  @observable type
  @observable title
  @observable level
  @observable children = []
  @observable agents = []
  @observable routes = []
  @observable hooks = []
  @observable commands = []

  constructor (props, type, level) {
    this.id = props.id
    this.isPending = props.pending
    this.title = props.title
    this.type = type
    this.level = level
  }

  @computed get error () {
    return _(this.commands).map('error').compact().first()
  }

  @computed get state () {
    if (this._isTest && this.isActive) return 'active'
    if (this._isTest && this.isRunning) return 'processing'

    if (this.isPending || this._allChildrenPending) {
      return 'pending'
    } else if (this._anyChildrenFailed) {
      return 'failed'
    } else if (this._anyChildrenProcessing) {
      return 'processing'
    } else if (this._allChildrenPassedOrPending) {
      return 'passed'
    } else {
      return 'processing'
    }
  }

  @computed get _isTest () {
    return this.type === 'test'
  }

  @computed get _isSuite () {
    return this.type === 'suite'
  }

  @computed get _childStates () {
    const children = this._isSuite ? this.children : this.commands
    return _.map(children, 'state')
  }

  @computed get _anyChildrenProcessing () {
    return _.some(this._childStates, (state) => state === 'processing')
  }

  @computed get _anyChildrenFailed () {
    return _.some(this._childStates, (state) => state === 'failed')
  }

  @computed get _allChildrenPassedOrPending () {
    return !this._childStates.length || _.every(this._childStates, (state) => (
      state === 'passed' || state === 'pending'
    ))
  }

  @computed get _allChildrenPending () {
    return !!this._childStates.length && _.every(this._childStates, (state) => (
      state === 'pending'
    ))
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

  _findOrCreateHook (name) {
    const hook = _.find(this.hooks, { name })
    if (hook) return hook

    const newHook = new Hook({ name })
    this.hooks.push(newHook)
    return newHook
  }

  serialize () {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      children: _.map(this.children, (runnable) => runnable.serialize()),
      agents: _.map(this.agents, (agent) => agent.serialize()),
      routes: _.map(this.routes, (route) => route.serialize()),
      hooks: _.map(this.hooks, (hook) => hook.serialize()),
    }
  }
}
