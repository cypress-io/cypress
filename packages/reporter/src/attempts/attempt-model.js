import _ from 'lodash'
import { computed, observable } from 'mobx'

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
  // @observable isActive = null
  // @observable isLongRunning = false
  // @observable isOpen = false
  @observable routes = []
  // @observable _state = null

  _logs = {}

  constructor (props) {
    this._state = props.state
    // this.err.update(props.err)

    _.each(props.agents, this.addLog)
    _.each(props.commands, this.addLog)
    _.each(props.routes, this.addLog)
  }

  @computed get hasCommands () {
    return !!this.commands.length
  }

  @computed get isLongRunning () {
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

  _findOrCreateHook (name) {
    const hook = _.find(this.hooks, { name })

    if (hook) return hook

    const newHook = new Hook({ name })

    this.hooks.push(newHook)

    return newHook
  }
}
