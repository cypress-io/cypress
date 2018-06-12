import { action, computed, observable } from 'mobx'

import Err from '../lib/err-model'
import Instrument from '../instruments/instrument-model'

const LONG_RUNNING_THRESHOLD = 1000

export default class Command extends Instrument {
  @observable.struct renderProps = {}
  @observable err = new Err({})
  @observable event = false
  @observable isLongRunning = false
  @observable number
  @observable numElements
  @observable visible = true
  @observable duplicates = []
  @observable isDuplicate = false

  _prevState = null

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

  constructor (props) {
    super(props)

    this.err.update(props.err)
    this.event = props.event
    this.number = props.number
    this.numElements = props.numElements
    this.renderProps = props.renderProps || {}
    this.visible = props.visible

    this._checkLongRunning()
  }

  update (props) {
    super.update(props)

    this.err.update(props.err)
    this.event = props.event
    this.numElements = props.numElements
    this.renderProps = props.renderProps || {}
    this.visible = props.visible

    this._checkLongRunning()
  }

  isMatchingEvent (command) {
    return command.event && this.matches(command)
  }

  addDuplicate (command) {
    command.isDuplicate = true
    this.duplicates.push(command)
  }

  matches (command) {
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
      clearTimeout(this._pendingTimeout)
      action('became:inactive', () => this.isLongRunning = false)()
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
