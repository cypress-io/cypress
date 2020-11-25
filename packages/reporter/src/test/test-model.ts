import _ from 'lodash'
import { action, computed, observable } from 'mobx'
import { FileDetails } from '@packages/ui-components'

import Attempt from '../attempts/attempt-model'
import Err from '../errors/err-model'
import { HookProps } from '../hooks/hook-model'
import Runnable, { RunnableProps } from '../runnables/runnable-model'
import { CommandProps } from '../commands/command-model'
import { AgentProps } from '../agents/agent-model'
import { RouteProps } from '../routes/route-model'
import { RunnablesStore, LogProps } from '../runnables/runnables-store'

export type TestState = 'active' | 'failed' | 'pending' | 'passed' | 'processing'

export type UpdateTestCallback = () => void

export interface TestProps extends RunnableProps {
  state: TestState | null
  err?: Err
  isOpen?: boolean
  agents?: Array<AgentProps>
  commands?: Array<CommandProps>
  routes?: Array<RouteProps>
  hooks: Array<HookProps>
  prevAttempts?: Array<TestProps>
  currentRetry: number
  retries?: number
  final?: boolean
  invocationDetails?: FileDetails
}

export interface UpdatableTestProps {
  id: TestProps['id']
  state?: TestProps['state']
  err?: TestProps['err']
  hookId?: string
  failedFromHookId?: string
  isOpen?: TestProps['isOpen']
  currentRetry?: TestProps['currentRetry']
  retries?: TestProps['retries']
}

export default class Test extends Runnable {
  type = 'test'

  _callbackAfterUpdate: UpdateTestCallback | null = null
  hooks: HookProps[]
  invocationDetails?: FileDetails

  @observable attempts: Attempt[] = []
  @observable _isOpen: boolean | null = null
  @observable isOpenWhenActive: Boolean | null = null
  @observable _isFinished = false

  constructor (props: TestProps, level: number, private store: RunnablesStore) {
    super(props, level)

    this.invocationDetails = props.invocationDetails

    this.hooks = [...props.hooks, {
      hookId: props.id.toString(),
      hookName: 'test body',
      invocationDetails: props.invocationDetails,
    }]

    _.each(props.prevAttempts || [], (attempt) => this._addAttempt(attempt))

    this._addAttempt(props)
  }

  @computed get isLongRunning () {
    return _.some(this.attempts, (attempt: Attempt) => {
      return attempt.isLongRunning
    })
  }

  @computed get isOpen () {
    if (this._isOpen === null) {
      return Boolean(this.state === 'failed'
      || this.isLongRunning
      || this.isActive && (this.hasMultipleAttempts || this.isOpenWhenActive)
      || this.store.hasSingleTest)
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
    return _.last(this.attempts) as Attempt
  }

  @computed get hasMultipleAttempts () {
    return this.attempts.length > 1
  }

  @computed get hasRetried () {
    return this.state === 'passed' && this.hasMultipleAttempts
  }

  // TODO: make this an enum with states: 'QUEUED, ACTIVE, INACTIVE'
  @computed get isActive (): boolean {
    return _.some(this.attempts, { isActive: true })
  }

  @computed get currentRetry () {
    return this.attempts.length - 1
  }

  isLastAttempt (attemptModel: Attempt) {
    return this.lastAttempt === attemptModel
  }

  addLog = (props: LogProps) => {
    return this._withAttempt(props.testCurrentRetry, (attempt: Attempt) => {
      return attempt.addLog(props)
    })
  }

  updateLog (props: LogProps) {
    this._withAttempt(props.testCurrentRetry, (attempt: Attempt) => {
      attempt.updateLog(props)
    })
  }

  @action start (props: TestProps) {
    let attempt = this.getAttemptByIndex(props.currentRetry)

    if (!attempt) {
      attempt = this._addAttempt(props)
    }

    attempt.start()
  }

  @action update (props: UpdatableTestProps, cb: UpdateTestCallback) {
    if (props.isOpen != null) {
      this.setIsOpenWhenActive(props.isOpen)

      if (this.isOpen !== props.isOpen) {
        this._callbackAfterUpdate = cb

        return
      }
    }

    cb()
  }

  // this is called to sync up the command log UI for the sake of
  // screenshots, so we only ever need to open the last attempt
  setIsOpenWhenActive (isOpen: boolean) {
    this.isOpenWhenActive = isOpen
  }

  callbackAfterUpdate () {
    if (this._callbackAfterUpdate) {
      this._callbackAfterUpdate()
      this._callbackAfterUpdate = null
    }
  }

  @action finish (props: UpdatableTestProps) {
    this._isFinished = !(props.retries && props.currentRetry) || props.currentRetry >= props.retries

    this._withAttempt(props.currentRetry || 0, (attempt: Attempt) => {
      attempt.finish(props)
    })
  }

  getAttemptByIndex (attemptIndex: number) {
    if (attemptIndex >= this.attempts.length) return

    return this.attempts[attemptIndex || 0]
  }

  commandMatchingErr () {
    return this.lastAttempt.commandMatchingErr()
  }

  _addAttempt = (props: TestProps) => {
    props.invocationDetails = this.invocationDetails
    props.hooks = this.hooks
    const attempt = new Attempt(props, this)

    this.attempts.push(attempt)

    return attempt
  }

  _withAttempt<T> (attemptIndex: number, cb: (attempt: Attempt) => T) {
    const attempt = this.getAttemptByIndex(attemptIndex)

    if (attempt) return cb(attempt)

    return null
  }
}
