import _ from 'lodash'
import { action, computed, observable } from 'mobx'

import Err from '../errors/err-model'
import Instrument, { InstrumentProps } from '../instruments/instrument-model'
import { TimeoutID } from '../lib/types'

const LONG_RUNNING_THRESHOLD = 1000

interface RenderProps {
  message?: string
  indicator?: string
  interceptions?: Array<{
    command: 'intercept' | 'route'
    alias?: string
    type: 'function' | 'stub' | 'spy'
  }>
  status?: string
  wentToOrigin?: boolean
}

export interface CommandProps extends InstrumentProps {
  err?: Err
  event?: boolean
  number?: number
  numElements: number
  renderProps?: RenderProps
  timeout?: number
  visible?: boolean
  wallClockStartedAt?: string
  hookId: string
  isStudio?: boolean
  showError?: boolean
  group?: number
  hasSnapshot?: boolean
  hasConsoleProps?: boolean

}

export default class Command extends Instrument {
  @observable.struct renderProps: RenderProps = {}
  @observable err = new Err({})
  @observable event?: boolean = false
  @observable isLongRunning = false
  @observable number?: number
  @observable numElements: number
  @observable timeout?: number
  @observable visible?: boolean = true
  @observable wallClockStartedAt?: string
  @observable children: Array<Command> = []
  @observable isChild = false
  @observable hookId: string
  @observable isStudio: boolean
  @observable showError?: boolean = false
  @observable group?: number
  @observable hasSnapshot?: boolean
  @observable hasConsoleProps?: boolean
  @observable _isOpen: boolean|null = null

  private _prevState: string | null | undefined = null
  private _pendingTimeout?: TimeoutID = undefined

  @computed get displayMessage () {
    return this.renderProps.message || this.message
  }

  @computed get numChildren () {
    // and one to include self so it's the total number of same events
    return this.children.length + 1
  }

  @computed get isOpen () {
    if (!this.hasChildren) return null

    return this._isOpen || (this._isOpen === null
      && (
        (this.group && this.type === 'system' && this.hasChildren) ||
        _.some(this.children, (v) => v.hasChildren) ||
        _.last(this.children)?.isOpen ||
        (_.some(this.children, (v) => v.isLongRunning) && _.last(this.children)?.state === 'pending') ||
        _.some(this.children, (v) => v.state === 'failed')
      )
    )
  }

  @action toggleOpen () {
    this._isOpen = !this.isOpen
  }

  @computed get hasChildren () {
    return this.numChildren > 1
  }

  constructor (props: CommandProps) {
    super(props)

    this.err.update(props.err)
    this.event = props.event
    this.number = props.number
    this.numElements = props.numElements
    this.renderProps = props.renderProps || {}
    this.timeout = props.timeout
    this.visible = props.visible
    this.wallClockStartedAt = props.wallClockStartedAt
    this.hookId = props.hookId
    this.isStudio = !!props.isStudio
    this.showError = props.showError
    this.group = props.group
    this.hasSnapshot = props.hasSnapshot
    this.hasConsoleProps = props.hasConsoleProps

    this._checkLongRunning()
  }

  update (props: CommandProps) {
    super.update(props)

    this.err.update(props.err)
    this.event = props.event
    this.numElements = props.numElements
    this.renderProps = props.renderProps || {}
    this.visible = props.visible
    this.timeout = props.timeout
    this.hasSnapshot = props.hasSnapshot
    this.hasConsoleProps = props.hasConsoleProps
    this.showError = props.showError

    this._checkLongRunning()
  }

  isMatchingEvent (command: Command) {
    if (command.name === 'page load') return false

    if (command.type === 'system') return false

    return command.event && this.matches(command)
  }

  @action
  setGroup (id) {
    this.group = id
  }

  addChild (command: Command) {
    command.isChild = true
    command.setGroup(this.id)
    this.children.push(command)
  }

  matches (command: Command) {
    return (
      command.type === this.type &&
      command.name === this.name &&
      command.displayMessage === this.displayMessage
    )
  }

  // the following several methods track if the command's state has been
  // active for more than the LONG_RUNNING_THRESHOLD and set the
  // isLongRunning flag to true, which propagates up to the test to
  // auto-expand it
  _checkLongRunning () {
    if (this._becamePending()) {
      this._startTimingPending()
    }

    if (this._becameNonPending()) {
      clearTimeout(this._pendingTimeout as TimeoutID)
    }

    this._prevState = this.state
  }

  _startTimingPending () {
    this._pendingTimeout = setTimeout(action('became:long:running', () => {
      if (this._isPending()) {
        this.isLongRunning = true
      }
    }), LONG_RUNNING_THRESHOLD)
  }

  _becamePending () {
    return !this._wasPending() && this._isPending()
  }

  _becameNonPending () {
    return this._wasPending() && !this._isPending()
  }

  _wasPending () {
    return this._prevState === 'pending'
  }

  _isPending () {
    return this.state === 'pending'
  }
}
