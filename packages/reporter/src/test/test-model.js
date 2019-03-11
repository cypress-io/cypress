import _ from 'lodash'
import { action, autorun, computed, observable, observe } from 'mobx'

import Attempt from '../attempts/attempt-model'
import Err from '../lib/err-model'
import Runnable from '../runnables/runnable-model'

export default class Test extends Runnable {
  // @observable agents = [] // x
  @observable attempts = []
  // @observable commands = [] // x
  // @observable err = new Err({}) // x
  // @observable hooks = [] // x
  @observable isActive = null
  @observable isLongRunning = false
  @observable isOpen = false
  // @observable routes = [] // x
  @observable _state = null

  _attempts = []
  type = 'test'

  constructor (props, level) {
    super(props, level)

    // this._state = props.state
    // this.err.update(props.err)

    _.each(props.attempts, this._addAttempt)

    autorun(() => {
      // if at any point, a command goes long running, set isLongRunning
      // to true until the test becomes inactive
      if (!this.isActive) {
        action('became:inactive', () => {
          return this.isLongRunning = false
        })()
      } else if (this._hasLongRunningCommand) {
        action('became:long:running', () => {
          return this.isLongRunning = true
        })()
      }
    })
  }

  @computed get _hasLongRunningCommand () {
    return _.some(this.attempts, (attempt) => {
      return attempt.isLongRunning
    })
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

  isLastAttempt (attemptModel) {
    return this._lastAttempt === attemptModel
  }

  addLog = (props) => {
    this._withAttempt(props.testId, props.testAttempt, (attempt) => {
      attempt.addLog(props)
    })
  }

  updateLog (props) {
    this._withAttempt(props.testId, props.testAttempt, (attempt) => {
      attempt.updateLog(props)
    })
  }

  start () {
    this.isActive = true
  }

  update ({ state, err, hookName, isOpen }, cb) {
    let hadChanges = false

    const disposer = observe(this, (change) => {
      hadChanges = true

      disposer()

      // apply change as-is
      return change
    })

    if (cb) {
      this.callbackAfterUpdate = () => {
        this.callbackAfterUpdate = null
        cb()
      }
    }

    this._state = state
    this.err.update(err)
    if (isOpen != null) {
      this.isOpen = isOpen
    }

    if (hookName) {
      const hook = _.find(this.hooks, { name: hookName })

      if (hook) {
        hook.failed = true
      }
    }

    // if we had no changes then react will
    // never fire componentDidUpdate and
    // so we need to manually call our callback
    // https://github.com/cypress-io/cypress/issues/674#issuecomment-366495057
    if (!hadChanges) {
      // unbind the listener if no changes
      disposer()

      // if we had a callback, invoke it
      if (this.callbackAfterUpdate) {
        this.callbackAfterUpdate()
      }
    }
  }

  finish (props) {
    this.update(props)
    this.isActive = false
  }

  // TODO: update to find in attempt
  commandMatchingErr () {
    return _(this.hooks)
    .map((hook) => {
      return hook.commandMatchingErr(this.err)
    })
    .compact()
    .last()
  }

  _addAttempt = (props) => {
    const attempt = new Attempt(props)

    this._attempts[attempt.id] = attempt
    this.attempts.push(attempt)
  }

  _withAttempt (attemptId, cb) {
    const attempt = this._attempts[attemptId]

    if (attempt) cb(attempt)
  }
}
