import _ from 'lodash'
import { action, computed, observable, makeObservable } from 'mobx'

import Err, { ErrProps } from '../errors/err-model'
import Instrument, { InstrumentProps } from '../instruments/instrument-model'
import type { TimeoutID } from '../lib/types'
import type { SessionProps } from '../sessions/sessions-model'

const LONG_RUNNING_THRESHOLD = 1000

type InterceptStatuses = 'req modified' | 'req + res modified' | 'res modified'
type XHRStatuses = '---' | '(canceled)' | '(aborted)' | string // string = any xhr status

export interface RenderProps {
  message?: string
  indicator?: 'successful' | 'pending' | 'aborted' | 'bad'
  interceptions?: Array<{
    command: 'intercept' | 'route'
    alias?: string
    type: 'function' | 'stub' | 'spy'
  }>
  status?: InterceptStatuses | XHRStatuses
  wentToOrigin?: boolean
}

export interface CommandProps extends InstrumentProps {
  err?: ErrProps
  event?: boolean
  number?: number
  numElements: number
  renderProps?: RenderProps
  sessionInfo?: SessionProps['sessionInfo']
  timeout?: number
  visible?: boolean
  wallClockStartedAt?: string
  hookId: string
  isStudio?: boolean
  group?: number
  groupLevel?: number
  hasSnapshot?: boolean
  hasConsoleProps?: boolean
}

export default class Command extends Instrument {
  @observable.struct renderProps: RenderProps = {}
  @observable.struct sessionInfo?: SessionProps['sessionInfo']
  @observable err?: Err
  @observable event?: boolean = false
  @observable isLongRunning = false
  @observable number?: number
  @observable numElements: number
  @observable timeout?: number
  @observable visible?: boolean
  @observable wallClockStartedAt?: string
  @observable children: Array<Command> = []
  @observable hookId: string
  @observable isStudio: boolean
  @observable group?: number
  @observable groupLevel?: number
  @observable hasSnapshot?: boolean
  @observable hasConsoleProps?: boolean
  @observable _isOpen: boolean|null = null

  private _prevState: string | null | undefined = null
  private _pendingTimeout?: TimeoutID = undefined

  @computed get displayMessage () {
    return this.renderProps.message || this.message
  }

  private countNestedCommands (children) {
    if (children.length === 0) {
      return 0
    }

    return children.length + children.reduce((previousValue, child) => previousValue + this.countNestedCommands(child.children), 0)
  }

  @computed get numChildren () {
    if (this.event) {
      // add one to include self so it's the total number of same events
      return this.children.length + 1
    }

    return this.countNestedCommands(this.children)
  }

  @computed get isOpen () {
    if (!this.hasChildren) return null

    return this._isOpen || (this._isOpen === null
      && (
        this.err?.isRecovered ||
        (this.name === 'session' && this.state === 'failed') ||
        // command has nested commands
        (this.name !== 'session' && this.hasChildren && !this.event && this.type !== 'system') ||
        // command has nested commands with children
        (this.name !== 'session' && _.some(this.children, (v) => v.hasChildren)) ||
        // last nested command is open
        (this.name !== 'session' && _.last(this.children)?.isOpen) ||
        // show slow command when test is running
        (_.some(this.children, (v) => v.isLongRunning) && _.last(this.children)?.state === 'pending') ||
        // at last nested command failed
        _.last(this.children)?.state === 'failed'
      )
    )
  }

  @action toggleOpen () {
    this._isOpen = !this.isOpen
  }

  @computed get hasChildren () {
    if (this.event) {
      // if the command is an event log, we add one to the number of children count to include
      // itself in the total number of same events that render when the group is closed
      return this.numChildren > 1
    }

    return this.numChildren > 0
  }

  @computed get showError () {
    if (this.hasChildren) {
      return (this.err?.isRecovered && this.isOpen)
    }

    return this.err?.isRecovered
  }

  constructor (props: CommandProps) {
    super(props)

    makeObservable(this)

    if (props.err) {
      this.err = new Err(props.err)
    }

    this.event = props.event
    this.number = props.number
    this.numElements = props.numElements
    this.renderProps = props.renderProps || {}
    this.sessionInfo = props.sessionInfo
    this.timeout = props.timeout
    // command log that are not associated with elements will not have a visibility
    // attribute set. i.e. cy.visit(), cy.readFile() or cy.log()
    this.visible = props.visible === undefined || props.visible
    this.wallClockStartedAt = props.wallClockStartedAt
    this.hookId = props.hookId
    this.isStudio = !!props.isStudio
    this.group = props.group
    this.hasSnapshot = !!props.hasSnapshot
    this.hasConsoleProps = !!props.hasConsoleProps
    this.groupLevel = props.groupLevel || 0

    this._checkLongRunning()
  }

  update (props: CommandProps) {
    super.update(props)

    if (props.err) {
      if (!this.err) {
        this.err = new Err(props.err)
      } else {
        this.err.update(props.err)
      }
    }

    this.event = props.event
    this.numElements = props.numElements
    this.renderProps = props.renderProps || {}
    this.sessionInfo = props.sessionInfo
    // command log that are not associated with elements will not have a visibility
    // attribute set. i.e. cy.visit(), cy.readFile() or cy.log()
    this.visible = props.visible === undefined || props.visible
    this.timeout = props.timeout
    this.hasSnapshot = props.hasSnapshot
    this.hasConsoleProps = props.hasConsoleProps

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
