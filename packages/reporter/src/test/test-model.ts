import _ from 'lodash'
import { action, computed, observable } from 'mobx'

import AttemptModel from '../attempts/attempt-model'
import Err from '../lib/err-model'
import Runnable, { RunnableProps } from '../runnables/runnable-model'
import Hook from '../hooks/hook-model'
import Command, { CommandProps } from '../commands/command-model'
import Agent, { AgentProps } from '../agents/agent-model'
import Route, { RouteProps } from '../routes/route-model'
import { RunnablesStore } from '../runnables/runnables-store'

export type TestState = 'active' | 'failed' | 'pending' | 'passed' | 'processing'

export type UpdateTestCallback = () => void

export interface TestProps extends RunnableProps {
  state: TestState
  err?: Err
  isOpen?: boolean
  agents?: Array<AgentProps>
  commands?: Array<CommandProps>
  routes?: Array<RouteProps>
  prevAttempts: Array<AttemptModel>
}

export interface UpdatableTestProps {
  state?: TestProps['state']
  err?: TestProps['err']
  hookName?: string
  isOpen?: TestProps['isOpen']
}

export default class Test extends Runnable {
  @observable agents: Array<Agent> = []
  @observable commands: Array<Command> = []
  @observable hooks: Array<Hook> = []
  @observable routes: Array<Route> = []
  @observable _state?: TestState | null = null
  type = 'test'

  callbackAfterUpdate: (() => void) | null = null

  @observable attempts: AttemptModel[] = []
  @observable _isOpen: Boolean | null = null
  @observable _isFinished = false

  _attempts = {}

  constructor (props: TestProps, level: number, private store: RunnablesStore) {
    super(props, level)

    _.defaults(props, {
      _currentRetry: 0,
    })

    _.each(props.prevAttempts, this._addAttempt)

    this._addAttempt(props)
  }

  @computed get isLongRunning () {
    return _.some(this.attempts, (attempt: AttemptModel) => {
      return attempt.isLongRunning
    })
  }

  @computed get isOpen () {
    if (this._isOpen === null) {
      return this.state === 'failed'
      || this.isLongRunning
      || this.store && this.store.hasSingleTest
    }

    return this._isOpen
  }

  @computed get state () {
    return this._lastAttempt ? this._lastAttempt.state : 'active'
  }

  @computed get err () {
    return this._lastAttempt ? this._lastAttempt.err : new Err({})
  }

  @computed get _lastAttempt () {
    return _.last(this.attempts)
  }

  @computed get hasMultipleAttempts () {
    return this.attempts.length > 1
  }

  @computed get hasRetried () {
    return this.state === 'passed' && this.hasMultipleAttempts
  }

  // TODO: make this an enum with states: 'QUEUED, ACTIVE, INACTIVE'
  @computed get isActive () {
    return _.some(this.attempts, { isActive: true })
  }

  isLastAttempt (attemptModel: AttemptModel) {
    return this._lastAttempt === attemptModel
  }

  addLog = (props) => {
    this._withAttempt(props.testCurrentRetry, (attempt: AttemptModel) => {
      attempt.addLog(props)
    })
  }

  updateLog (props) {
    this._withAttempt(props.testCurrentRetry, (attempt: AttemptModel) => {
      attempt.updateLog(props)
    })
  }

  @action start (props) {
    let attempt = this.getAttemptByIndex(props._currentRetry)

    if (!attempt) {
      attempt = this._addAttempt(props)
    }

    attempt.start()
  }

  @action toggleOpen = () => {
    this._isOpen = !this.isOpen
  }

  // this is called to sync up the command log UI for the sake of
  // screenshots, so we only ever need to open the last attempt
  setIsOpen (isOpen: boolean, cb: Function) {
    if (this.isOpen === isOpen) {
      return this._lastAttempt?.setIsOpen(isOpen, cb)
    }

    this._lastAttempt?.setIsOpen(isOpen, cb)
    this._isOpen = isOpen
  }

  @action finish (props: UpdatableTestProps) {
    this._isFinished = props._currentRetry >= props._retries

    this._withAttempt(props._currentRetry, (attempt: AttemptModel) => {
      attempt.finish(props)
    })
  }

  // @action _setLongRunning (isLongRunning) {
  //   if (this._lastAttempt) {
  //     this._lastAttempt.isLongRunning = isLongRunning
  //   }
  //   // this.isLongRunning = isLongRunning
  // }

  getAttemptByIndex (attemptIndex) {
    return this._attempts[attemptIndex]
  }

  commandMatchingErr () {
    return this._lastAttempt.commandMatchingErr()
  }

  _addAttempt = (props) => {
    const attempt = new AttemptModel(props, this)

    this._attempts[attempt.id] = attempt
    this.attempts.push(attempt)

    return attempt
  }

  _withAttempt (attemptIndex, cb) {
    const attempt = this.getAttemptByIndex(attemptIndex)

    if (attempt) cb(attempt)
  }
}
