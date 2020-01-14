import { action, computed, observable } from 'mobx'

import Err from '../errors/err-model'
import Instrument, { InstrumentProps } from '../instruments/instrument-model'
import { TimeoutID } from '../lib/types'

const LONG_RUNNING_THRESHOLD = 1000

interface RenderProps {
  message?: string
  indicator?: string
}

export type TestedValueObject = {
  summary: string
  value: string | object | any[]
}

export type TestedValue = TestedValueObject | null

export interface CommandProps extends InstrumentProps {
  err?: Err
  event?: boolean
  number?: number
  numElements: number
  renderProps?: RenderProps
  visible?: boolean
  options?: Record<string, any>
  hookName: string
  subject: TestedValue
  expected: TestedValue
  actual: TestedValue
}

export default class Command extends Instrument {
  @observable.struct renderProps: RenderProps = {}
  @observable err = new Err({})
  @observable event?: boolean = false
  @observable isLongRunning = false
  @observable number?: number
  @observable numElements: number
  @observable visible?: boolean = true
  @observable duplicates: Array<Command> = []
  @observable isDuplicate = false
  @observable options?: Record<string, any> = {}
  @observable subject: TestedValue
  @observable expected: TestedValue
  @observable actual: TestedValue

  private _prevState: string | null | undefined = null
  private _pendingTimeout?: TimeoutID = undefined

  @computed get displayMessage () {
    return this.renderProps.message || this.message
  }

  @computed get numDuplicates () {
    // and one to include self so it's the total number of same events
    return this.duplicates.length + 1
  }

  @computed get hasDuplicates () {
    return this.numDuplicates > 1
  }

  constructor (props: CommandProps) {
    super(props)

    this.err.update(props.err)
    this.event = props.event
    this.number = props.number
    this.numElements = props.numElements
    this.renderProps = props.renderProps || {}
    this.visible = props.visible
    this.options = props.options
    this.subject = props.subject
    this.expected = props.expected
    this.actual = props.actual

    this._checkLongRunning()
  }

  update (props: CommandProps) {
    super.update(props)

    this.err.update(props.err)
    this.event = props.event
    this.numElements = props.numElements
    this.renderProps = props.renderProps || {}
    this.visible = props.visible

    this._checkLongRunning()
  }

  isMatchingEvent (command: Command) {
    return command.event && this.matches(command)
  }

  addDuplicate (command: Command) {
    command.isDuplicate = true
    this.duplicates.push(command)
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
      action('became:inactive', () => {
        return this.isLongRunning = false
      })()
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
