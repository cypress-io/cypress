import _ from 'lodash'
import { action, computed, observable } from 'mobx'

import Agent, { AgentProps } from '../agents/agent-model'
import Command, { CommandProps } from '../commands/command-model'
import Err from '../errors/err-model'
import Route, { RouteProps } from '../routes/route-model'
import Test, { UpdatableTestProps, TestProps } from '../test/test-model'
import type { TestState } from '@packages/types'
import Hook, { HookName } from '../hooks/hook-model'
import { FileDetails } from '@packages/types'
import { LogProps } from '../runnables/runnables-store'
import Log from '../instruments/instrument-model'
import Session, { SessionProps } from '../sessions/sessions-model'

export default class Attempt {
  @observable agents: Agent[] = []
  @observable sessions: Record<string, Session> = {}
  @observable commands: Command[] = []
  @observable err?: Err = undefined
  @observable hooks: Hook[] = []
  // TODO: make this an enum with states: 'QUEUED, ACTIVE, INACTIVE'
  @observable isActive: boolean | null = null
  @observable routes: Route[] = []
  @observable _state?: TestState | null = null
  @observable _testOuterStatus?: TestState = undefined
  @observable _invocationCount: number = 0
  @observable invocationDetails?: FileDetails
  @observable hookCount: { [name in HookName]: number } = {
    'before all': 0,
    'before each': 0,
    'after all': 0,
    'after each': 0,
    'test body': 0,
    'studio commands': 0,
  }
  @observable _isOpen: boolean|null = null

  @observable isOpenWhenLast: boolean | null = null
  _callbackAfterUpdate: Function | null = null
  testId: string

  @observable id: number
  test: Test

  _logs: {[key: string]: Log} = {}

  constructor (props: TestProps, test: Test) {
    this.testId = props.id
    this.id = props.currentRetry || 0
    this.test = test
    this._state = props.state

    if (props.err) {
      this.err = new Err(props.err)
    }

    this.invocationDetails = props.invocationDetails

    this.hooks = _.map(props.hooks, (hook) => new Hook(hook))

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

  @computed get error () {
    const command = this.err?.isCommandErr ? this.commandMatchingErr() : undefined

    return {
      err: this.err,
      testId: command?.testId,
      commandId: command?.id,
    }
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
        if ((props as CommandProps).sessionInfo) {
          this._addSession(props as unknown as SessionProps) // add sessionInstrumentPanel details
        }

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
      // @ts-ignore satisfied by CommandProps
      if (props.sessionInfo) {
        this._updateOrAddSession(props as unknown as SessionProps) // update sessionInstrumentPanel details
      }

      log.update(props)
    }
  }

  removeLog = (props: LogProps) => {
    switch (props.instrument) {
      case 'command': {
        return this._removeCommand(props as CommandProps)
      }
      default: {
        throw new Error(`Attempted to remove log for instrument other than command`)
      }
    }
  }

  commandMatchingErr (): Command | undefined {
    if (!this.err) {
      return undefined
    }

    return _(this.hooks)
    .map((hook) => {
      // @ts-ignore
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

    if (props._cypressTestStatusInfo?.outerStatus) {
      this._testOuterStatus = props._cypressTestStatusInfo.outerStatus
    }

    if (props.err) {
      if (this.err) {
        this.err.update(props.err)
      } else {
        this.err = new Err(props.err)
      }
    }

    if (props.failedFromHookId) {
      const hook = _.find(this.hooks, { hookId: props.failedFromHookId })

      if (hook && props.err) {
        hook.failed = true
      }
    }

    if (props.isOpen != null) {
      this.isOpenWhenLast = props.isOpen
    }
  }

  @action finish (props: UpdatableTestProps, isInteractive: boolean) {
    this.update(props)
    this.isActive = false

    // if the test is not open and we aren't in interactive mode, clear out the attempt details
    if (!this.test.isOpen && !isInteractive) {
      this._clear()
    }
  }

  _clear () {
    this.commands = []
    this.routes = []
    this.agents = []
    this.hooks = []
    this._logs = {}
    this.sessions = {}
  }

  _addAgent (props: AgentProps) {
    const agent = new Agent(props)

    this._logs[props.id] = agent
    this.agents.push(agent)

    return agent
  }

  _addSession (props: SessionProps) {
    const session = new Session(props)

    this.sessions[props.id] = session
  }

  _updateOrAddSession (props: SessionProps) {
    const session = this.sessions[props.id]

    if (session) {
      session.update(props)

      return
    }

    this._addSession(props)
  }

  _addRoute (props: RouteProps) {
    const route = new Route(props)

    this._logs[props.id] = route
    this.routes.push(route)

    return route
  }

  _addCommand (props: CommandProps) {
    const command = new Command(props)

    this._logs[props.id] = command

    this.commands.push(command)

    const hookIndex = _.findIndex(this.hooks, { hookId: command.hookId })

    const hook = this.hooks[hookIndex]

    if (!hook) return

    hook.addCommand(command)

    // make sure that hooks are in order of invocation
    if (hook.invocationOrder === undefined) {
      hook.invocationOrder = this._invocationCount++

      if (hook.invocationOrder !== hookIndex) {
        this.hooks[hookIndex] = this.hooks[hook.invocationOrder]
        this.hooks[hook.invocationOrder] = hook
      }
    }

    // assign number if non existent
    if (hook.hookNumber === undefined) {
      hook.hookNumber = ++this.hookCount[hook.hookName]
    }

    return command
  }

  _removeCommand (props: CommandProps) {
    delete this._logs[props.id]

    const commandIndex = _.findIndex(this.commands, { id: props.id })

    this.commands.splice(commandIndex, 1)

    const hookIndex = _.findIndex(this.hooks, { hookId: props.hookId })

    const hook = this.hooks[hookIndex]

    hook.removeCommand(props.id)
  }
}
