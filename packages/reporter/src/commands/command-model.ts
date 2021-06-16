import { action, computed, observable, makeObservable } from 'mobx'

import Err from '../errors/err-model'
import Instrument, { InstrumentProps } from '../instruments/instrument-model'
import { TimeoutID } from '../lib/types'

const LONG_RUNNING_THRESHOLD = 1000

interface RenderProps {
  message?: string
  indicator?: string
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
}

export default class Command extends Instrument {
  renderProps: RenderProps = {};
  err = new Err({});
  event?: boolean = false;
  isLongRunning = false;
  number?: number;
  numElements: number;
  timeout?: number;
  visible?: boolean = true;
  wallClockStartedAt?: string;
  duplicates: Array<Command> = [];
  isDuplicate = false;
  hookId: string;
  isStudio: boolean;

  private _prevState: string | null | undefined = null
  private _pendingTimeout?: TimeoutID = undefined

  get displayMessage () {
    return this.renderProps.message || this.message
  }

  get numDuplicates () {
    // and one to include self so it's the total number of same events
    return this.duplicates.length + 1
  }

  get hasDuplicates () {
    return this.numDuplicates > 1
  }

  constructor (props: CommandProps) {
    super(props)

    makeObservable(this, {
      renderProps: observable.struct,
      err: observable,
      event: observable,
      isLongRunning: observable,
      number: observable,
      numElements: observable,
      timeout: observable,
      visible: observable,
      wallClockStartedAt: observable,
      duplicates: observable,
      isDuplicate: observable,
      hookId: observable,
      isStudio: observable,
      displayMessage: computed,
      numDuplicates: computed,
      hasDuplicates: computed,
    })

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
