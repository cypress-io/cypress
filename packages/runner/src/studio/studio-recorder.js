import { action, computed, observable } from 'mobx'
import { $ } from '@packages/driver'

import eventManager from '../lib/event-manager'

const eventTypes = [
  'click',
  'dblclick',
  'change',
  'keyup',
  // 'submit',
]

const eventsWithValue = [
  'change',
  'keyup',
  'select',
]

class StudioRecorder {
  @observable testId = null
  @observable isLoading = false
  @observable isActive = false
  @observable _hasStarted = false

  @action setTestId = (testId) => {
    this.testId = testId
  }

  @action startLoading = () => {
    this.isLoading = true
  }

  @computed get isFinished () {
    return this._hasStarted && !this.isActive
  }

  @computed get isOpen () {
    return this.isActive || this.isLoading || this.isFinished
  }

  @action start = (body) => {
    this.isActive = true
    this.isLoading = false
    this._log = []
    this._currentId = 1
    this._hasStarted = true

    this.attachListeners(body)
  }

  @action stop = () => {
    eventTypes.forEach((event) => {
      this._body.removeEventListener(event, this._recordEvent, {
        capture: true,
      })
    })

    this.isActive = false
  }

  @action cancel = () => {
    this.stop()

    this.testId = null
    this._hasStarted = false
  }

  @action reset = () => {
    this.stop()

    this._log = []
    this._hasStarted = false
  }

  attachListeners = (body) => {
    this._body = body

    eventTypes.forEach((event) => {
      this._body.addEventListener(event, this._recordEvent, {
        capture: true,
        passive: true,
      })
    })
  }

  removeCommand = (index) => {
    this._log.splice(index, 1)
    this._emitUpdatedLog()
  }

  _getId = () => {
    return `s${this._currentId++}`
  }

  _getCommand = (event, $el) => {
    const tagName = $el.prop('tagName')
    const { type } = event

    if (tagName === 'SELECT' && event.type === 'change') {
      return 'select'
    }

    if (event.type === 'keyup') {
      return 'type'
    }

    return type
  }

  _getValue = (event, $el) => {
    if (!eventsWithValue.includes(event.type)) {
      return null
    }

    return $el.val()
  }

  _shouldRecordEvent = (event, $el) => {
    const tagName = $el.prop('tagName')

    return !(tagName !== 'INPUT' && event.type === 'keyup')
  }

  _recordEvent = (event) => {
    // only capture events sent by the actual user
    if (!event.isTrusted) {
      return
    }

    const $el = $(event.target)

    if (!this._shouldRecordEvent(event, $el)) {
      return
    }

    const Cypress = eventManager.getCypress()

    const selector = Cypress.SelectorPlayground.getSelector($el)

    const action = ({
      id: this._getId(),
      selector,
      command: this._getCommand(event, $el),
      value: this._getValue(event, $el),
    })

    this._log.push(action)

    this._filterLog()

    this._emitUpdatedLog()
  }

  _filterLog = () => {
    const { length } = this._log

    const lastAction = this._log[length - 1]

    if (lastAction.command === 'change') {
      this._log.splice(length - 1)

      return
    }

    if (length > 1) {
      const secondLast = this._log[length - 2]

      if (lastAction.selector === secondLast.selector) {
        if (lastAction.command === 'type' && secondLast.command === 'type') {
          this._log.splice(length - 2, 1)

          return
        }

        if (lastAction.command === 'dblclick' && secondLast.command === 'click' && length > 2) {
          const thirdLast = this._log[length - 3]

          if (lastAction.selector === thirdLast.selector && thirdLast.command === 'click') {
            this._log.splice(length - 3, 2)
          }
        }
      }
    }
  }

  _emitUpdatedLog = () => {
    eventManager.emit('update:studio:log', this._log)
  }
}

export default new StudioRecorder()
