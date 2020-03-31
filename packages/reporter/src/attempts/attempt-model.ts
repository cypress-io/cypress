import _ from 'lodash'
import { action, computed, observable } from 'mobx'

import AgentModel, { AgentProps } from '../agents/agent-model'
import CommandModel, { CommandProps } from '../commands/command-model'
import ErrorModel from '../errors/err-model'
import RouteModel, { RouteProps } from '../routes/route-model'
import TestModel, { UpdatableTestProps, TestProps, TestState } from '../test/test-model'
import HookModel from '../hooks/hook-model'
import { LogProps } from '../runnables/runnables-store'
import Log from '../instruments/instrument-model'

export default class AttemptModel {
  @observable agents: AgentModel[] = []
  @observable commands: CommandModel[] = []
  @observable err = new ErrorModel({})
  @observable hooks: HookModel[] = []
  @observable isActive: boolean|null = null
  @observable routes: RouteModel[] = []
  @observable _isOpen: boolean|null = null
  @observable _state: TestState|null = null

  testId: string
  @observable id: number
  test: TestModel

  _logs: {[key: string]: Log} = {}

  constructor (props: TestProps, test: TestModel) {
    this.testId = props.id
    this.id = props.currentRetry
    this.test = test
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

  @computed get isLast () {
    return this === this.test.lastAttempt
  }

  @computed get isOpen () {
    if (this._isOpen === null) {
      return this.isLongRunning || this.isLast
    }

    return this._isOpen
  }

  addLog = (props: LogProps) => {
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

  updateLog (props: LogProps) {
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

  @action update (props: UpdatableTestProps) {
    if (props.state) {
      this._state = props.state
    }

    this.err.update(props.err)

    if (props.hookName) {
      const hook = _.find(this.hooks, { name: props.hookName })

      if (hook) {
        hook
      }
    }

    if (props.isOpen != null) {
      this._isOpen = props.isOpen
    }
  }

  @action toggleOpen = () => {
    this._isOpen = !this.isOpen
  }

  // @action setIsOpen (isOpen, cb) {
  //   // if isOpen is not changing at all, callback immediately
  //   // because there won't be a re-render to trigger it

  //   if (!this.test.isOpen && !isOpen) {
  //     cb()

  //     return
  //   }

  //   if (this.test.isOpen && this.isOpen && isOpen) {
  //     cb()

  //     return
  //   }

  //   // changing isOpen will trigger a re-render and the callback will
  //   // be called by attempts.jsx Attempt#componentDidUpdate
  //   this._callbackAfterUpdate = cb
  //   this._isOpen = isOpen
  // }

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

  _addAgent (props: AgentProps) {
    const agent = new AgentModel(props)

    this._logs[props.id] = agent
    this.agents.push(agent)
  }

  _addRoute (props: RouteProps) {
    const route = new RouteModel(props)

    this._logs[props.id] = route
    this.routes.push(route)
  }

  _addCommand (props: CommandProps) {
    const command = new CommandModel(props)
    const hook = this._findOrCreateHook(props.hookName)

    this._logs[props.id] = command
    this.commands.push(command)
    hook.addCommand(command)
  }

  _findOrCreateHook (name: string) {
    const hook = _.find(this.hooks, { name })

    if (hook) return hook

    const newHook = new HookModel({ name })

    this.hooks.push(newHook)

    return newHook
  }
}
