import _ from 'lodash'
import { action, computed, observable } from 'mobx'
import { FileDetails } from '@packages/ui-components'

import { AttemptModel } from '../attempts/attempt-model'
import { ErrModel } from '../errors/err-model'
import { HookProps } from '../hooks/hook-model'
import { RunnableModel } from '../runnables/runnable-model'
import { CommandProps } from '../commands/command-model'
import { AgentProps } from '../agents/agent-model'
import { RouteProps } from '../routes/route-model'
import { RunnablesStore, LogProps } from '../runnables/runnables-store'
import { VirtualizableType } from '../tree/virtualizable-types'
import { VirtualNodeModel } from '../tree/virtual-node-model'

export type TestState = 'active' | 'failed' | 'pending' | 'passed' | 'processing'

export type UpdateTestCallback = () => void

export interface TestProps extends RunnableModel {
  state: TestState | null
  err?: ErrModel
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

export class TestModel extends RunnableModel {
  type = 'test'
  virtualType = VirtualizableType.Test

  _callbackAfterUpdate: UpdateTestCallback | null = null
  hooks: HookProps[]
  invocationDetails?: FileDetails

  @observable attempts: AttemptModel[] = []
  @observable _isOpen: boolean | null = null
  @observable isOpenWhenActive: Boolean | null = null
  @observable _isFinished = false
  @observable virtualNode: VirtualNodeModel
  onCreateModel: Function

  constructor (props: TestProps, private store: RunnablesStore, level: number, onCreateModel: Function) {
    super(props, level)

    this.virtualNode = new VirtualNodeModel(this.id, this.virtualType)
    this.onCreateModel = onCreateModel

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
    return _.some(this.attempts, (attempt: AttemptModel) => {
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
    if (this.lastAttempt?.state === 'passed' && this.hasMultipleAttempts) return 'retried'

    return this.lastAttempt ? this.lastAttempt.state : 'active'
  }

  @computed get err () {
    return this.lastAttempt?.err
  }

  @computed get lastAttempt () {
    return _.last(this.attempts) as AttemptModel
  }

  @computed get hasMultipleAttempts () {
    return this.attempts.length > 1
  }

  @computed get hasRetried () {
    return this.state === 'retried'
  }

  // TODO: make this an enum with states: 'QUEUED, ACTIVE, INACTIVE'
  @computed get isActive (): boolean {
    return _.some(this.attempts, { isActive: true })
  }

  @computed get currentRetry () {
    return this.attempts.length - 1
  }

  isLastAttempt (attemptModel: AttemptModel) {
    return this.lastAttempt === attemptModel
  }

  addLog = (props: LogProps) => {
    return this._withAttempt(props.testCurrentRetry, (attempt: AttemptModel) => {
      return attempt.addLog(props)
    })
  }

  updateLog (props: LogProps) {
    this._withAttempt(props.testCurrentRetry, (attempt: AttemptModel) => {
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

    this._withAttempt(props.currentRetry || 0, (attempt: AttemptModel) => {
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
    const attempt = new AttemptModel(props, this, this.onCreateModel)

    this.attempts.push(attempt)
    this.virtualNode.children.push(attempt.virtualNode)
    this.onCreateModel(attempt)

    return attempt
  }

  _withAttempt<T> (attemptIndex: number, cb: (attempt: AttemptModel) => T) {
    const attempt = this.getAttemptByIndex(attemptIndex)

    if (attempt) return cb(attempt)

    return null
  }
}
