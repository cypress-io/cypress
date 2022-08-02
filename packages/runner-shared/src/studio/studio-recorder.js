import { action, computed, observable } from 'mobx'
import $ from 'jquery'
import $driverUtils from '@packages/driver/src/cypress/utils'
import { dom } from '../dom'

const saveErrorMessage = (message) => {
  return `\
${message}\n\n\
Cypress was unable to save these commands to your spec file. \
You can use the copy button below to copy the commands to your clipboard. \
\n
Cypress Studio is still in beta and the team is working hard to \
resolve issues like this. To help us fix this issue more quickly, \
you can provide us with more information by clicking 'Learn more' below.`
}

const eventTypes = [
  'click',
  // 'dblclick',
  'change',
  'keydown',
  'keyup',
]

const eventsWithValue = [
  'change',
  'keydown',
  'keyup',
]

const internalMouseEvents = [
  'mousedown',
  'mouseover',
  'mouseout',
]

const tagNamesWithoutText = [
  'SELECT',
  'INPUT',
  'TEXTAREA',
]

const tagNamesWithValue = [
  'BUTTON',
  'INPUT',
  'METER',
  'LI',
  'OPTION',
  'PROGESS',
  'PARAM',
  'TEXTAREA',
]

export class StudioRecorder {
  @observable testId = null
  @observable suiteId = null
  @observable initModalIsOpen = false
  @observable saveModalIsOpen = false
  @observable logs = []
  @observable isLoading = false
  @observable isActive = false
  @observable url = null
  @observable isFailed = false
  @observable _hasStarted = false

  fileDetails = null
  absoluteFile = null
  runnableTitle = null
  _currentId = 1
  _previousMouseEvent = null

  constructor (eventManager) {
    this.eventManager = eventManager
  }

  @computed get hasRunnableId () {
    return !!this.testId || !!this.suiteId
  }

  @computed get isOpen () {
    return this.isActive || this.isLoading || this._hasStarted
  }

  @computed get isEmpty () {
    return this.logs.length === 0
  }

  @computed get isReady () {
    return this.isOpen && this.isEmpty && !this.isLoading && !this.isFailed
  }

  @computed get hookId () {
    return `${this.testId}-studio`
  }

  @computed get needsUrl () {
    return this.isActive && !this.url && !this.isFailed
  }

  @computed get testError () {
    return {
      id: this.testId,
      state: 'failed',
    }
  }

  @computed get state () {
    return {
      testId: this.testId,
      suiteId: this.suiteId,
      url: this.url,
    }
  }

  get Cypress () {
    return this.eventManager.getCypress()
  }

  saveError (err) {
    return {
      id: this.testId,
      err: {
        ...err,
        message: saveErrorMessage(err.message),
        docsUrl: 'https://on.cypress.io/studio-beta',
      },
    }
  }

  @action setTestId = (testId) => {
    this.testId = testId
  }

  @action setSuiteId = (suiteId) => {
    this.suiteId = suiteId
    this.testId = null
  }

  @action clearRunnableIds = () => {
    this.testId = null
    this.suiteId = null
  }

  @action showInitModal = () => {
    this.initModalIsOpen = true
  }

  @action closeInitModal = () => {
    this.initModalIsOpen = false
  }

  @action showSaveModal = () => {
    this.saveModalIsOpen = true
  }

  @action closeSaveModal = () => {
    this.saveModalIsOpen = false
  }

  @action startLoading = () => {
    this.isLoading = true
  }

  @action setInactive = () => {
    this.isActive = false
  }

  @action setUrl = (url) => {
    this.url = url
  }

  @action testFailed = () => {
    this.isFailed = true
  }

  setFileDetails = (fileDetails) => {
    this.fileDetails = fileDetails
  }

  setAbsoluteFile = (absoluteFile) => {
    this.absoluteFile = absoluteFile
  }

  setRunnableTitle = (runnableTitle) => {
    this.runnableTitle = runnableTitle
  }

  _clearPreviousMouseEvent = () => {
    this._previousMouseEvent = null
  }

  _matchPreviousMouseEvent = (el) => {
    return this._previousMouseEvent && $(el).is(this._previousMouseEvent.element)
  }

  @action initialize = (config, state) => {
    const { studio } = state

    if (studio) {
      if (studio.testId) {
        this.setTestId(studio.testId)
      }

      if (studio.suiteId) {
        this.setSuiteId(studio.suiteId)
      }

      if (studio.url) {
        this.setUrl(studio.url)
      }
    }

    if (this.hasRunnableId) {
      this.setAbsoluteFile(config.spec.absolute)
      this.startLoading()

      if (this.suiteId) {
        this.Cypress.runner.setOnlySuiteId(this.suiteId)
      } else if (this.testId) {
        this.Cypress.runner.setOnlyTestId(this.testId)
      }
    }
  }

  @action interceptTest = (test) => {
    if (this.suiteId) {
      this.setTestId(test.id)
    }

    if (this.hasRunnableId) {
      if (test.invocationDetails) {
        this.setFileDetails(test.invocationDetails)
      }

      if (this.suiteId) {
        if (test.parent && test.parent.id !== 'r1') {
          this.setRunnableTitle(test.parent.title)
        }
      } else {
        this.setRunnableTitle(test.title)
      }
    }
  }

  @action start = (body) => {
    this.isActive = true
    this.isLoading = false
    this.logs = []
    this._currentId = 1
    this._hasStarted = true

    if (this.url) {
      this.visitUrl()
    }

    this.attachListeners(body)
  }

  @action stop = () => {
    this.removeListeners()

    this.isActive = false
    this.isLoading = false
  }

  @action reset = () => {
    this.stop()

    this.logs = []
    this.url = null
    this._hasStarted = false
    this._currentId = 1
    this.isFailed = false
  }

  @action cancel = () => {
    this.reset()
    this.clearRunnableIds()
  }

  @action startSave = () => {
    if (this.suiteId) {
      this.showSaveModal()
    } else {
      this.save()
    }
  }

  @action save = (testName = null) => {
    this.closeSaveModal()
    this.stop()

    this.eventManager.emit('studio:save', {
      fileDetails: this.fileDetails,
      absoluteFile: this.absoluteFile,
      runnableTitle: this.runnableTitle,
      commands: this.logs,
      isSuite: !!this.suiteId,
      isRoot: this.suiteId === 'r1',
      testName,
    })
  }

  @action visitUrl = (url = this.url) => {
    this.setUrl(url)

    this.Cypress.cy.visit(this.url)

    this.logs.push({
      id: this._getId(),
      selector: null,
      name: 'visit',
      message: this.url,
    })
  }

  attachListeners = (body) => {
    if (this.isFailed) return

    this._body = body

    eventTypes.forEach((event) => {
      this._body.addEventListener(event, this._recordEvent, {
        capture: true,
        passive: true,
      })
    })

    internalMouseEvents.forEach((event) => {
      this._body.addEventListener(event, this._recordMouseEvent, {
        capture: true,
        passive: true,
      })
    })

    this._body.addEventListener('contextmenu', this._openAssertionsMenu, {
      capture: true,
    })

    this._clearPreviousMouseEvent()
  }

  removeListeners = () => {
    if (!this._body) return

    eventTypes.forEach((event) => {
      this._body.removeEventListener(event, this._recordEvent, {
        capture: true,
      })
    })

    internalMouseEvents.forEach((event) => {
      this._body.removeEventListener(event, this._recordMouseEvent, {
        capture: true,
      })
    })

    this._body.removeEventListener('contextmenu', this._openAssertionsMenu, {
      capture: true,
    })

    this._clearPreviousMouseEvent()
  }

  copyToClipboard = (commandsText) => {
    // clipboard API is not supported without secure context
    if (window.isSecureContext && navigator.clipboard) {
      return navigator.clipboard.writeText(commandsText)
    }

    // fallback to creating invisible textarea
    // create the textarea in our document rather than this._body
    // as to not interfere with the app in the aut
    const textArea = document.createElement('textarea')

    textArea.value = commandsText
    textArea.style.position = 'fixed'
    textArea.style.opacity = 0

    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    textArea.remove()

    return Promise.resolve()
  }

  _trustEvent = (event) => {
    // only capture events sent by the actual user
    // but disable the check if we're in a test
    return event.isTrusted || this.Cypress.env('INTERNAL_E2E_TESTS') === 1
  }

  _recordMouseEvent = (event) => {
    if (!this._trustEvent(event)) return

    const { type, target } = event

    if (type === 'mouseout') {
      return this._clearPreviousMouseEvent()
    }

    // we only replace the previous mouse event if the element is different
    // since we want to use the oldest possible selector
    if (!this._matchPreviousMouseEvent(target)) {
      this._previousMouseEvent = {
        element: target,
        selector: this.Cypress.SelectorPlayground.getSelector($(target)),
      }
    }
  }

  _getId = () => {
    return this._currentId++
  }

  _getName = (event, $el) => {
    const tagName = $el.prop('tagName')
    const { type } = event

    if (tagName === 'SELECT' && type === 'change') {
      return 'select'
    }

    if (type === 'keydown' || type === 'keyup') {
      return 'type'
    }

    if (type === 'click' && tagName === 'INPUT') {
      const inputType = $el.prop('type')
      const checked = $el.prop('checked')

      if (inputType === 'radio' || (inputType === 'checkbox' && checked)) {
        return 'check'
      }

      if (inputType === 'checkbox') {
        return 'uncheck'
      }
    }

    return type
  }

  _getMessage = (event, $el) => {
    if (!eventsWithValue.includes(event.type)) {
      return null
    }

    let val = $el.val()

    if (event.type === 'keydown' || event.type === 'keyup') {
      val = val.replace(/{/g, '{{}')

      if (event.key === 'Enter') {
        val = `${val}{enter}`
      }
    }

    return val
  }

  _shouldRecordEvent = (event, $el) => {
    const tagName = $el.prop('tagName')

    // only want to record keystrokes within input elements
    if ((event.type === 'keydown' || event.type === 'keyup') && tagName !== 'INPUT') {
      return false
    }

    // we record all normal keys on keyup (rather than keydown) since the input value will be updated
    // we do not record enter on keyup since a form submission will have already been triggered
    if (event.type === 'keyup' && event.key === 'Enter') {
      return false
    }

    // we record enter on keydown since this happens before a form submission is triggered
    // all other keys are recorded on keyup
    if (event.type === 'keydown' && event.key !== 'Enter') {
      return false
    }

    // cy cannot click on a select
    if (tagName === 'SELECT' && event.type === 'click') {
      return false
    }

    // do not record clicks on option elements since this is handled with cy.select()
    if (tagName === 'OPTION') {
      return false
    }

    return true
  }

  @action _recordEvent = (event) => {
    if (this.isFailed || !this._trustEvent(event)) return

    const $el = $(event.target)

    if (this._isAssertionsMenu($el)) {
      return
    }

    this._closeAssertionsMenu()

    if (!this._shouldRecordEvent(event, $el)) {
      return
    }

    const name = this._getName(event, $el)
    const message = this._getMessage(event, $el)

    if (name === 'change') {
      return
    }

    let selector = ''

    if (name === 'click' && this._matchPreviousMouseEvent($el)) {
      selector = this._previousMouseEvent.selector
    } else {
      selector = this.Cypress.SelectorPlayground.getSelector($el)
    }

    this._clearPreviousMouseEvent()

    if (name === 'type' && !message) {
      return this._removeLastLogIfType(selector)
    }

    const updateOnly = this._updateLastLog(selector, name, message)

    if (updateOnly) {
      return
    }

    if (name === 'type') {
      this._addClearLog(selector)
    }

    this._addLog({
      selector,
      name,
      message,
    })
  }

  @action _removeLastLogIfType = (selector) => {
    const lastLog = this.logs[this.logs.length - 1]

    if (lastLog.selector === selector && lastLog.name === 'type') {
      return this.removeLog(lastLog.id)
    }
  }

  @action removeLog = (commandId) => {
    const index = this.logs.findIndex((command) => command.id === commandId)
    const log = this.logs[index]

    this.logs.splice(index, 1)

    this._generateBothLogs(log).forEach((commandLog) => {
      this.eventManager.emit('reporter:log:remove', commandLog)
    })
  }

  _generateLog = ({ id, name, message, type, number }) => {
    return {
      id,
      testId: this.testId,
      hookId: this.hookId,
      name,
      message: message ? $driverUtils.stringifyActual(message) : null,
      type,
      state: 'passed',
      instrument: 'command',
      number,
      numElements: 1,
      isStudio: true,
    }
  }

  _generateBothLogs = (log) => {
    return [
      this._generateLog({
        id: `s${log.id}-get`,
        name: 'get',
        message: log.selector,
        type: 'parent',
        number: log.id,
      }),
      this._generateLog({
        id: `s${log.id}`,
        name: log.name,
        message: log.message,
        type: 'child',
      }),
    ]
  }

  @action _addLog = (log) => {
    log.id = this._getId()

    this.logs.push(log)

    this._generateBothLogs(log).forEach((commandLog) => {
      this.eventManager.emit('reporter:log:add', commandLog)
    })
  }

  _addClearLog = (selector) => {
    const lastLog = this.logs[this.logs.length - 1]

    if (lastLog && lastLog.name === 'clear' && lastLog.selector === selector) {
      return
    }

    this._addLog({
      selector,
      name: 'clear',
      message: null,
    })
  }

  _updateLog = (log) => {
    const { id, name, message } = log

    this.eventManager.emit('reporter:log:state:changed', this._generateLog({
      id: `s${id}`,
      name,
      message,
      type: 'child',
    }))
  }

  _updateLastLog = (selector, name, message) => {
    const { length } = this.logs

    if (!length) {
      return false
    }

    const lastLog = this.logs[length - 1]

    const updateLog = (newName = name, newMessage = message) => {
      lastLog.message = newMessage
      lastLog.name = newName

      this._updateLog(lastLog)
    }

    if (selector === lastLog.selector) {
      if (name === 'type' && lastLog.name === 'type') {
        updateLog()

        return true
      }

      // Cypress automatically issues a .click before every type
      // so we can turn the extra click event into the .clear that comes before every type
      if (name === 'type' && lastLog.name === 'click') {
        updateLog('clear', null)

        // we return false since we still need to add the type log
        return false
      }
    }

    return false
  }

  @action _addAssertion = ($el, ...args) => {
    const id = this._getId()
    const selector = this.Cypress.SelectorPlayground.getSelector($el)

    const log = {
      id,
      selector,
      name: 'should',
      message: args,
      isAssertion: true,
    }

    this.logs.push(log)

    const reporterLog = {
      id,
      selector,
      name: 'assert',
      message: this._generateAssertionMessage($el, args),
    }

    this._generateBothLogs(reporterLog).forEach((commandLog) => {
      this.eventManager.emit('reporter:log:add', commandLog)
    })

    this._closeAssertionsMenu()
  }

  _generateAssertionMessage = ($el, args) => {
    const elementString = $driverUtils.stringifyActual($el)
    const assertionString = args[0].replace(/\./g, ' ')

    let message = `expect **${elementString}** to ${assertionString}`

    if (args[1]) {
      message = `${message} **${args[1]}**`
    }

    if (args[2]) {
      message = `${message} with the value **${args[2]}**`
    }

    return message
  }

  _isAssertionsMenu = ($el) => {
    return $el.hasClass('__cypress-studio-assertions-menu')
  }

  _openAssertionsMenu = (event) => {
    event.preventDefault()
    event.stopPropagation()

    const $el = $(event.target)

    if (this._isAssertionsMenu($el)) {
      return
    }

    this._closeAssertionsMenu()

    dom.openStudioAssertionsMenu({
      $el,
      $body: $(this._body),
      props: {
        possibleAssertions: this._generatePossibleAssertions($el),
        addAssertion: this._addAssertion,
        closeMenu: this._closeAssertionsMenu,
      },
    })
  }

  _closeAssertionsMenu = () => {
    dom.closeStudioAssertionsMenu($(this._body))
  }

  _generatePossibleAssertions = ($el) => {
    const tagName = $el.prop('tagName')

    const possibleAssertions = []

    if (!tagNamesWithoutText.includes(tagName)) {
      const text = $el.text()

      if (text) {
        possibleAssertions.push({
          type: 'have.text',
          options: [{
            value: text,
          }],
        })
      }
    }

    if (tagNamesWithValue.includes(tagName)) {
      const val = $el.val()

      if (val !== undefined && val !== '') {
        possibleAssertions.push({
          type: 'have.value',
          options: [{
            value: val,
          }],
        })
      }
    }

    const attributes = $.map($el[0].attributes, ({ name, value }) => {
      if (name === 'value' || name === 'disabled') return

      if (name === 'class') {
        possibleAssertions.push({
          type: 'have.class',
          options: value.split(' ').map((value) => ({ value })),
        })

        return
      }

      if (name === 'id') {
        possibleAssertions.push({
          type: 'have.id',
          options: [{
            value,
          }],
        })

        return
      }

      if (value !== undefined && value !== '') {
        return {
          name,
          value,
        }
      }
    })

    if (attributes.length > 0) {
      possibleAssertions.push({
        type: 'have.attr',
        options: attributes,
      })
    }

    possibleAssertions.push({
      type: 'be.visible',
    })

    const isDisabled = $el.prop('disabled')

    if (isDisabled !== undefined) {
      possibleAssertions.push({
        type: isDisabled ? 'be.disabled' : 'be.enabled',
      })
    }

    const isChecked = $el.prop('checked')

    if (isChecked !== undefined) {
      possibleAssertions.push({
        type: isChecked ? 'be.checked' : 'not.be.checked',
      })
    }

    return possibleAssertions
  }
}
