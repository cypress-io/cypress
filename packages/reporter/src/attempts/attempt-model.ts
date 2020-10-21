import _ from 'lodash'
import { action, computed, observable } from 'mobx'

import { AgentModel, AgentProps } from '../agents/agent-model'
import { CommandModel, CommandProps } from '../commands/command-model'
import { Collection } from '../tree/virtual-collection'
import { ErrModel } from '../errors/err-model'
import { RouteModel, RouteProps } from '../routes/route-model'
import { TestModel, TestProps, TestState, UpdatableTestProps } from '../test/test-model'
import { HookModel, HookName, HookProps } from '../hooks/hook-model'
import { FileDetails } from '@packages/ui-components'
import { LogProps } from '../runnables/runnables-store'
import { InstrumentModel } from '../instruments/instrument-model'
import { Virtualizable, VirtualizableType } from '../tree/virtualizable'
import { VirtualNodeModel } from './../tree/virtual-node-model'

export class AttemptContent {
  virtualType = VirtualizableType.AttemptContent
  id: string
  attempt: AttemptModel

  constructor (id: string, attempt: AttemptModel) {
    this.id = id
    this.attempt = attempt
  }

  @computed get virtualNode () {
    const attempt = this.attempt

    return {
      id: this.id,
      name: this.id,
      state: {
        expanded: attempt.test.hasMultipleAttempts || !attempt.hasCommands,
      },
      children: [],
    }
  }
}

export class AttemptModel {
  virtualType = VirtualizableType.Attempt

  @observable id: string
  @observable index: number
  @observable virtualNode: VirtualNodeModel
  onCreateModel: Function
  test: TestModel

  @observable content: Virtualizable
  @observable agents: Collection<AgentModel>
  @observable commands: CommandModel[] = []
  @observable err: ErrModel
  @observable hooks: Collection<HookModel>
  // TODO: make this an enum with states: 'QUEUED, ACTIVE, INACTIVE'
  @observable isActive: boolean | null = null
  @observable routes: Collection<RouteModel>
  @observable _state?: TestState | null = null
  @observable _invocationCount: number = 0
  @observable invocationDetails?: FileDetails
  @observable hookCount: { [name in HookName]: number } = {
    'before all': 0,
    'before each': 0,
    'after all': 0,
    'after each': 0,
    'test body': 0,
  }
  @observable _isOpen: boolean|null = null

  @observable isOpenWhenLast: boolean | null = null
  _callbackAfterUpdate: Function | null = null
  testId: string

  _logs: {[key: string]: InstrumentModel} = {}

  constructor (props: TestProps, test: TestModel, onCreateModel: Function) {
    this.testId = props.id
    this.index = props.currentRetry || 0
    this.id = `attempt-${this.testId}-${this.index}`
    this.test = test
    this._state = props.state
    this.invocationDetails = props.invocationDetails

    this.virtualNode = new VirtualNodeModel(this.id, this.virtualType)
    this.onCreateModel = onCreateModel

    this.content = new AttemptContent(`${this.id}-content`, this)

    onCreateModel(this.content)

    this.agents = new Collection(`${this.id}-agents`, test.level, VirtualizableType.AgentCollection)
    onCreateModel(this.agents)
    _.each(props.agents, this._addAgent)

    this.routes = new Collection(`${this.id}-routes`, test.level, VirtualizableType.RouteCollection)
    onCreateModel(this.routes)
    _.each(props.routes, this._addRoute)

    this.hooks = new Collection(`${this.id}-hooks`, test.level, VirtualizableType.HookCollection)
    onCreateModel(this.hooks)
    _.each(props.hooks, this._addHook)

    _.each(props.commands, this._addCommand)

    this.err = new ErrModel(props.err, `${this.id}-error`, test.level)
    onCreateModel(this.err)

    this.virtualNode.children = [
      this.content.virtualNode,
      this.agents.virtualNode,
      this.routes.virtualNode,
      this.hooks.virtualNode,
      this.err.virtualNode,
    ]
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

  @computed get level () {
    return this.test.level
  }

  @computed get state () {
    return this._state || (this.isActive ? 'active' : 'processing')
  }

  @computed get isLast () {
    return this.id === this.test.lastAttempt.id
  }

  @computed get isOpen () {
    if (this._isOpen !== null) {
      return this._isOpen
    }

    // prev attempts open by default while test is running, otherwise only the last is open
    return this.test.isActive || this.isLast
  }

  addLog = (props: LogProps) => {
    switch (props.instrument) {
      case 'command': {
        return this._addCommand(props as CommandProps)
      }
      case 'agent': {
        return this._addAgent(props as AgentProps)
      }
      case 'route': {
        return this._addRoute(props as RouteProps)
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
    return _(this.hooks.items)
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

    if (props.hookId) {
      const hook = _.find(this.hooks.items, { hookId: props.hookId })

      if (hook && props.err) {
        hook.failed = true
      }
    }

    if (props.isOpen != null) {
      this.isOpenWhenLast = props.isOpen
    }
  }

  @action finish (props: UpdatableTestProps) {
    this.update(props)
    this.isActive = false
  }

  _addAgent = (props: AgentProps) => {
    const agent = new AgentModel(props)

    this._logs[props.id] = agent
    this.agents.items.push(agent)

    return agent
  }

  _addRoute = (props: RouteProps) => {
    const route = new RouteModel(props)

    this._logs[props.id] = route
    this.routes.items.push(route)

    return route
  }

  _addHook = (props: HookProps) => {
    const hook = new HookModel(props, this.onCreateModel)

    this.hooks.items.push(hook)
    this.hooks.virtualNode.children.push(hook.virtualNode)
    this.onCreateModel(hook)
  }

  _addCommand = (props: CommandProps) => {
    const command = new CommandModel(props)

    this._logs[props.id] = command

    this.commands.push(command)

    const hookIndex = _.findIndex(this.hooks.items, { hookId: command.hookId })

    const hook = this.hooks.items[hookIndex]

    hook.addCommand(command)

    // make sure that hooks are in order of invocation
    if (hook.invocationOrder === undefined) {
      hook.invocationOrder = this._invocationCount++

      if (hook.invocationOrder !== hookIndex) {
        this.hooks.items[hookIndex] = this.hooks.items[hook.invocationOrder]
        this.hooks.items[hook.invocationOrder] = hook
      }
    }

    // assign number if non existent
    if (hook.hookNumber === undefined) {
      hook.hookNumber = ++this.hookCount[hook.hookName]
    }

    return command
  }
}
