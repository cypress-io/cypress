import _ from 'lodash'
import { action, computed, observable } from 'mobx'

import AttemptModel from '../attempts/attempt-model'
import Err from '../errors/err-model'
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
  currentRetry: number
  retries?: number
}

export interface UpdatableTestProps {
  id: TestProps['id']
  state?: TestProps['state']
  err?: TestProps['err']
  hookName?: string
  isOpen?: TestProps['isOpen']
  currentRetry: TestProps['currentRetry']
  retries: TestProps['retries']
}

export default class Test extends Runnable {
  @observable agents: Array<Agent> = []
  @observable commands: Array<Command> = []
  @observable hooks: Array<Hook> = []
  @observable routes: Array<Route> = []
  // @observable _state?: TestState | null = null
  type = 'test'

  callbackAfterUpdate: (() => void) | null = null

  @observable attempts: AttemptModel[] = []
  @observable _isOpen: Boolean | null = null
  @observable _isFinished = false

  constructor (props: TestProps, level: number, private store: RunnablesStore) {
    super(props, level)

    _.each(props.prevAttempts, (attempt) => this._addAttempt(attempt))

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
    return this.lastAttempt ? this.lastAttempt.state : 'active'
  }

  @computed get err () {
    return this.lastAttempt ? this.lastAttempt.err : new Err({})
  }

  @computed get lastAttempt () {
    return _.last(this.attempts) as AttemptModel
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

  @computed get currentRetry () {
    return this.attempts.length - 1
  }

  isLastAttempt (attemptModel: AttemptModel) {
    return this.lastAttempt === attemptModel
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
    let attempt = this.getAttemptByIndex(props.currentRetry)

    if (!attempt) {
      attempt = this._addAttempt(props)
    }

    attempt.start()
  }

  @action toggleOpen = () => {
    this._isOpen = !this.isOpen
  }

  @action update (props: UpdatableTestProps, cb?: UpdateTestCallback) {
    this._withAttempt(props.currentRetry, (attempt) => {
      attempt.update(props)
    })

    if (props.isOpen != null && (this.isOpen !== props.isOpen)) {
      this.setIsOpen(props.isOpen)

      return
    }

    cb()

    return
  }

  // this is called to sync up the command log UI for the sake of
  // screenshots, so we only ever need to open the last attempt
  setIsOpen (isOpen: boolean, cb: Function) {
    if (this.isOpen === isOpen) {
      return this.lastAttempt.setIsOpen(isOpen, cb)
    }

    this.lastAttempt.setIsOpen(isOpen, cb)
    this._isOpen = isOpen
  }

  @action finish (props: UpdatableTestProps) {
    this._isFinished = !(props.retries && props.currentRetry) || props.currentRetry >= props.retries

    this._withAttempt(props.currentRetry, (attempt: AttemptModel) => {
      attempt.finish(props)
    })
  }

  getAttemptByIndex (attemptIndex: number) {
    return this.attempts[attemptIndex]
  }

  commandMatchingErr () {
    return this.lastAttempt.commandMatchingErr()
  }

  _addAttempt = (props) => {
    const attempt = new AttemptModel(props, this)

    this.attempts.push(attempt)

    return attempt
  }

  _withAttempt (attemptIndex: number, cb: (attempt: AttemptModel) => void) {
    const attempt = this.getAttemptByIndex(attemptIndex)

    if (attempt) cb(attempt)
  }
}
