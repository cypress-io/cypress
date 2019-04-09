import _ from 'lodash'
import { action, computed, observable } from 'mobx'

import Agent from '../agents/agent-model'
import Command from '../commands/command-model'
import Err from '../lib/err-model'
import Hook from '../hooks/hook-model'
import Route from '../routes/route-model'

export default class Attempt {
  @observable agents = []
  @observable attempts = []
  @observable commands = []
  @observable err = new Err({})
  @observable hooks = []
  @observable isActive = null
  @observable isOpen = false
  @observable routes = []
  @observable _state = null

  _logs = {}

  constructor (props) {
    this.testId = props.id
    this.id = props._currentRetry
    this._state = props.state
    this.err.update(props.err)

    _.each(props.agents, this.addLog)
    _.each(props.commands, this.addLog)
    _.each(props.routes, this.addLog)
  }

  @computed get hasCommands () {
    return !!this.commands.length
  }

  @computed get isLongRunning () {
    return this.isActive && this._hasLongRunningCommand
  }

  @computed get _hasLongRunningCommand () {
    return _.some(this.commands, (command) => {
      return command.isLongRunning
    })
  }

  @computed get state () {
    return this._state || (this.isActive ? 'active' : 'processing')
  }

  addLog = (props) => {
    switch (props.instrument) {
      case 'command': {
        this._addCommand(props)
        break
      }
      case 'agent': {
        this._addAgent(props)
        break
      }
      case 'route': {
        this._addRoute(props)
        break
      }
      default: {
        throw new Error(`Attempted to add log for unknown instrument: ${props.instrument}`)
      }
    }
  }

  updateLog (props) {
    const log = this._logs[props.id]

    if (log) {
      log.update(props)
    }
  }

  commandMatchingErr () {
    return _(this.hooks)
    .map((hook) => {
      return hook.commandMatchingErr(this.err)
    })
    .compact()
    .last()
  }

  @action start () {
    this.isActive = true
  }

  @action update ({ state, err, hookName }) {
    this._state = state
    this.err.update(err)

    if (hookName) {
      const hook = _.find(this.hooks, { name: hookName })

      if (hook) {
        hook.failed = true
      }
    }
  }

  @action setIsOpen (isOpen, cb) {
    // if isOpen is not changing at all, callback immediately
    // because there won't be a re-render to trigger it
    if (this.isOpen === isOpen) {
      cb()

      return
    }

    // changing isOpen will trigger a re-render and the callback will
    // be called by attempts.jsx Attempt#componentDidUpdate
    this._callbackAfterUpdate = cb
    this.isOpen = isOpen
  }

  callbackAfterUpdate () {
    if (this._callbackAfterUpdate) {
      this._callbackAfterUpdate()
      this._callbackAfterUpdate = null
    }
  }

  @action finish (props) {
    this.update(props)
    this.isActive = false
  }

  _addAgent (props) {
    const agent = new Agent(props)

    this._logs[props.id] = agent
    this.agents.push(agent)
  }

  _addRoute (props) {
    const route = new Route(props)

    this._logs[props.id] = route
    this.routes.push(route)
  }

  _addCommand (props) {
    const command = new Command(props)
    const hook = this._findOrCreateHook(props.hookName)

    this._logs[props.id] = command
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
}
