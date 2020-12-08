import _ from 'lodash'
import { action, computed, observable } from 'mobx'

import { AgentModel, AgentProps } from '../agents/agent-model'
import { CommandModel, CommandProps } from '../commands/command-model'
import { Collection } from '../virtual-tree/virtual-collection'
import { ErrModel } from '../errors/err-model'
import { RouteModel, RouteProps } from '../routes/route-model'
import { TestModel, TestProps, TestState, UpdatableTestProps } from '../test/test-model'
import { HookModel, HookName, HookProps } from '../hooks/hook-model'
import { FileDetails } from '@packages/ui-components'
import { LogProps } from '../runnables/runnables-store'
import { InstrumentModel } from '../instruments/instrument-model'
import { VirtualizableType } from '../virtual-tree/virtualizable-types'
import { VirtualNodeModel } from './../virtual-tree/virtual-node-model'

export class AttemptModel {
  virtualType = VirtualizableType.Attempt

  @observable id: string
  @observable index: number
  @observable virtualNode: VirtualNodeModel
  onCreateModel: Function
  test: TestModel

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

    this.agents = new Collection({
      id: `${this.id}-agents`,
      level: test.level,
      parent: this.test,
      type: VirtualizableType.AgentCollection,
    })

    onCreateModel(this.agents)
    _.each(props.agents, this._addAgent)

    this.routes = new Collection({
      id: `${this.id}-routes`,
      level: test.level,
      parent: this.test,
      type: VirtualizableType.RouteCollection,
    })

    onCreateModel(this.routes)
    _.each(props.routes, this._addRoute)

    // TODO: get rid of this and flatten out hooks
    // having it causes a rendering artifact when opening collapsed attempts
    this.hooks = new Collection({
      id: `${this.id}-hooks`,
      level: test.level,
      parent: this.test,
      type: VirtualizableType.HookCollection,
    })

    onCreateModel(this.hooks)
    _.each(props.hooks, this._addHook)

    _.each(props.commands, this._addCommand)

    this.err = new ErrModel({
      err: props.err,
      id: `${this.id}-error`,
      level: test.level,
      attempt: this,
    })

    onCreateModel(this.err)

    this.virtualNode.children = [
      this.agents.virtualNode,
      this.routes.virtualNode,
      this.hooks.virtualNode,
      this.err.virtualNode!,
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

    if (props.failedFromHookId) {
      const hook = _.find(this.hooks.items, { hookId: props.failedFromHookId })

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
    const hook = new HookModel(props, {
      attempt: this,
      onCreateModel: this.onCreateModel,
    })

    this.hooks.items.push(hook)
    this.hooks.virtualNode.children.push(hook.virtualNode)
    this.onCreateModel(hook)
  }

  _addCommand = (props: CommandProps) => {
    const command = new CommandModel(props, this.test, this.id)

    this._logs[props.id] = command

    this.commands.push(command)

    const hookIndex = _.findIndex(this.hooks.items, { hookId: command.hookId })
    const hook = this.hooks.items[hookIndex]
    const virtualNode = this.hooks.virtualNode.children[hookIndex]

    hook.addCommand(command)

    // make sure that hooks are in order of invocation
    if (hook.invocationOrder === undefined) {
      hook.invocationOrder = this._invocationCount++

      if (hook.invocationOrder !== hookIndex) {
        this.hooks.items[hookIndex] = this.hooks.items[hook.invocationOrder]
        this.hooks.items[hook.invocationOrder] = hook

        this.hooks.virtualNode.children[hookIndex] = this.hooks.virtualNode.children[hook.invocationOrder]
        this.hooks.virtualNode.children[hook.invocationOrder] = virtualNode
      }
    }

    // assign number if non existent
    if (hook.hookNumber === undefined) {
      hook.hookNumber = ++this.hookCount[hook.hookName]
    }

    return command
  }
}
