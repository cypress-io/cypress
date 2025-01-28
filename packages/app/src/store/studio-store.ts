import type { FileDetails, Instrument, TestState } from '@packages/types/src'
import { defineStore } from 'pinia'

import { getEventManager } from '../runner'
import type { StudioSavePayload } from '../runner/event-manager-types'
import { closeStudioAssertionsMenu, openStudioAssertionsMenu } from '../runner/studio/mounter'
import { useAutStore } from './aut-store'
import type { PossibleAssertions, AssertionArgs } from '../runner/studio/types'

function getCypress () {
  const eventManager = getEventManager()

  return eventManager.getCypress()
}

function stringifyActual (val: any) {
  // @ts-expect-error - this exists, but not in TypeScript.
  return Cypress.utils.stringifyActual(val)
}

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

function assertNonNullish<TValue> (
  value: TValue,
  message: string,
): asserts value is NonNullable<TValue> {
  if (value === null || value === undefined) {
    throw Error(message)
  }
}

export interface CommandLog {
  id: `s${string}`
  testId?: string
  hookId?: string
  state: TestState
  name: string
  message: string
  type: 'parent' | 'child'
  number?: number
  instrument: Instrument
  numElements: number
  isStudio: boolean
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
  'PROGRESS',
  'TEXTAREA',
]

export interface StudioLog {
  id?: number
  name: string
  selector?: string
  message?: unknown // todo: what is the type
  isAssertion?: boolean
}

interface StudioRecorderState {
  saveModalIsOpen: boolean
  instructionModalIsOpen: boolean
  logs: StudioLog[]
  isLoading: boolean
  isActive: boolean
  isFailed: boolean
  _hasStarted: boolean

  testId?: string
  suiteId?: string
  url?: string

  fileDetails?: FileDetails
  absoluteFile?: string
  runnableTitle?: string
  _previousMouseEvent?: {
    element: Element
    selector: string
  }
  _body?: Element
  _currentId: number
}

export const useStudioStore = defineStore('studioRecorder', {
  state: (): StudioRecorderState => {
    return {
      saveModalIsOpen: false,
      instructionModalIsOpen: false,
      logs: [],
      url: '',
      isLoading: false,
      isActive: false,
      isFailed: false,
      _hasStarted: false,
      _currentId: 1,
    }
  },

  actions: {
    setTestId (testId: string) {
      this.testId = testId
    },

    setSuiteId (suiteId: string) {
      this.suiteId = suiteId
      this.testId = undefined
    },

    clearRunnableIds () {
      this.testId = undefined
      this.suiteId = undefined
    },

    openInstructionModal () {
      this.instructionModalIsOpen = true
    },

    closeInstructionModal () {
      this.instructionModalIsOpen = false
    },

    showSaveModal () {
      this.saveModalIsOpen = true
    },

    closeSaveModal () {
      this.saveModalIsOpen = false
    },

    startLoading () {
      this.isLoading = true
    },

    setInactive () {
      this.isActive = false
    },

    setUrl (url?: string) {
      this.url = url
    },

    testFailed () {
      this.isFailed = true
    },

    initialize (config, state) {
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

      if (this.testId || this.suiteId) {
        this.setAbsoluteFile(config.spec.absolute)
        this.startLoading()

        if (this.suiteId) {
          getCypress().runner.setOnlySuiteId(this.suiteId)
        } else if (this.testId) {
          getCypress().runner.setOnlyTestId(this.testId)
        }
      }
    },

    interceptTest (test) {
      if (this.suiteId) {
        this.setTestId(test.id)
      }

      if (this.testId || this.suiteId) {
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
    },

    start (body: HTMLBodyElement) {
      this.isActive = true
      this.isLoading = false
      this.logs = []
      this._currentId = 1
      this._hasStarted = true

      const autStore = useAutStore()

      if (this.url) {
        this.visitUrl()
      }

      if (!this.url && autStore.url) {
        this.setUrl(autStore.url)
      }

      this.attachListeners(body)
    },

    stop () {
      this.removeListeners()

      this.isActive = false
      this.isLoading = false
    },

    reset () {
      this.stop()

      this.logs = []
      this.url = undefined
      this._hasStarted = false
      this._currentId = 1
      this.isFailed = false
    },

    cancel () {
      this.reset()
      this.clearRunnableIds()
    },

    startSave () {
      if (this.suiteId) {
        this.showSaveModal()
      } else {
        this.save()
      }
    },

    save (testName?: string) {
      this.closeSaveModal()
      this.stop()

      assertNonNullish(this.absoluteFile, `absoluteFile should exist`)

      const payload: StudioSavePayload = {
        fileDetails: this.fileDetails,
        absoluteFile: this.absoluteFile,
        runnableTitle: this.runnableTitle,
        commands: this.logs,
        isSuite: !!this.suiteId,
        isRoot: this.suiteId === 'r1',
        testName,
      }

      getEventManager().emit('studio:save', payload)
    },

    visitUrl (url?: string) {
      this.setUrl(url ?? this.url)

      getCypress().cy.visit(this.url)

      this.logs.push({
        id: this._getId(),
        selector: undefined,
        name: 'visit',
        message: this.url,
      })
    },

    _recordEvent (event) {
      if (this.isFailed || !this._trustEvent(event)) return

      const $el = window.UnifiedRunner.CypressJQuery(event.target)

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

      let selector: string | undefined = ''

      if (name === 'click' && this._matchPreviousMouseEvent($el)) {
        selector = this._previousMouseEvent?.selector
      } else {
        selector = getCypress().SelectorPlayground.getSelector($el)
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
    },

    _removeLastLogIfType (selector?: string) {
      const lastLog = this.logs[this.logs.length - 1]

      if (lastLog.selector === selector && lastLog.name === 'type') {
        return this.removeLog(lastLog.id)
      }
    },

    removeLog (commandId?: number) {
      const index = this.logs.findIndex((command) => command.id === commandId)
      const log = this.logs[index]

      this.logs.splice(index, 1)

      this._generateBothLogs(log).forEach((commandLog) => {
        getEventManager().emit('reporter:log:remove', commandLog)
      })
    },

    _addLog (log: StudioLog) {
      log.id = this._getId()

      this.logs.push(log)

      this._generateBothLogs(log).forEach((commandLog) => {
        getEventManager().emit('reporter:log:add', commandLog)
      })
    },

    _addAssertion ($el: HTMLElement | JQuery<HTMLElement>, ...args: AssertionArgs) {
      const id = this._getId()
      const selector = getCypress().SelectorPlayground.getSelector($el)

      const log: StudioLog = {
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
        message: this._generateAssertionMessage($el as HTMLElement, ...args),
      }

      this._generateBothLogs(reporterLog).forEach((commandLog) => {
        getEventManager().emit('reporter:log:add', commandLog)
      })

      this._closeAssertionsMenu()
    },

    saveError (err: Error) {
      return {
        id: this.testId,
        err: {
          ...err,
          message: saveErrorMessage(err.message),
          docsUrl: 'https://on.cypress.io/studio-beta',
        },
      }
    },

    setFileDetails (fileDetails) {
      this.fileDetails = fileDetails
    },

    setAbsoluteFile (absoluteFile: string) {
      this.absoluteFile = absoluteFile
    },

    setRunnableTitle (runnableTitle) {
      this.runnableTitle = runnableTitle
    },

    _clearPreviousMouseEvent () {
      this._previousMouseEvent = undefined
    },

    _matchPreviousMouseEvent (el) {
      return this._previousMouseEvent && window.UnifiedRunner.CypressJQuery(el).is(this._previousMouseEvent.element)
    },

    attachListeners (body: HTMLBodyElement) {
      if (this.isFailed) {
        return
      }

      this._body = body

      for (const event of eventTypes) {
        this._body.addEventListener(event, this._recordEvent, {
          capture: true,
          passive: true,
        })
      }

      for (const event of internalMouseEvents) {
        this._body.addEventListener(event, this._recordMouseEvent, {
          capture: true,
          passive: true,
        })
      }

      this._body.addEventListener('contextmenu', this._openAssertionsMenu, {
        capture: true,
      })

      this._clearPreviousMouseEvent()
    },

    removeListeners () {
      if (!this._body) return

      for (const event of eventTypes) {
        this._body.removeEventListener(event, this._recordEvent, {
          capture: true,
        })
      }

      for (const event of internalMouseEvents) {
        this._body.removeEventListener(event, this._recordMouseEvent, {
          capture: true,
        })
      }

      this._body.removeEventListener('contextmenu', this._openAssertionsMenu, {
        capture: true,
      })

      this._clearPreviousMouseEvent()
    },

    copyToClipboard (commandsText) {
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
      textArea.style.opacity = '0'

      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      textArea.remove()

      return Promise.resolve()
    },

    _trustEvent (event) {
      // only capture events sent by the actual user
      // but disable the check if we're in a test
      return event.isTrusted || getCypress().env('INTERNAL_E2E_TESTS') === 1
    },

    _recordMouseEvent (event) {
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
          selector: getCypress().SelectorPlayground.getSelector(window.UnifiedRunner.CypressJQuery(target)),
        }
      }
    },

    _getId () {
      return this._currentId++
    },

    _getName (event, $el) {
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
    },

    _getMessage (event, $el) {
      if (!eventsWithValue.includes(event.type)) {
        return undefined
      }

      let val = $el.val()

      if (event.type === 'keydown' || event.type === 'keyup') {
        val = val.replace(/{/g, '{{}')

        if (event.key === 'Enter') {
          val = `${val}{enter}`
        }
      }

      return val
    },

    _shouldRecordEvent (event, $el) {
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
    },

    _generateLog ({ id, name, message, type, number }: { id: `s${string}`, name: string, message: unknown, type: 'parent' | 'child', number?: number }): CommandLog {
      return {
        id,
        testId: this.testId,
        hookId: this.hookId,
        name,
        message: message ? stringifyActual(message) : undefined,
        type,
        state: 'passed',
        instrument: 'command',
        number,
        numElements: 1,
        isStudio: true,
      }
    },

    _generateBothLogs (log): [CommandLog, CommandLog] {
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
    },

    _addClearLog (selector) {
      const lastLog = this.logs[this.logs.length - 1]

      if (lastLog && lastLog.name === 'clear' && lastLog.selector === selector) {
        return
      }

      this._addLog({
        selector,
        name: 'clear',
        message: undefined,
      })
    },

    _updateLog (log: StudioLog) {
      const { id, name, message } = log

      getEventManager().emit('reporter:log:state:changed', this._generateLog({
        id: `s${id}`,
        name,
        message,
        type: 'child',
      }))
    },

    _updateLastLog (selector: string | undefined, name: string, message: unknown) {
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
          updateLog('clear', undefined)

          // we return false since we still need to add the type log
          return false
        }
      }

      return false
    },

    _generateAssertionMessage ($el: HTMLElement, ...args: AssertionArgs) {
      const elementString = stringifyActual($el)
      const assertionString = args[0].replace(/\./g, ' ')

      let message = `expected **${elementString}** to ${assertionString}`

      if (args[1]) {
        message = `${message} **${args[1]}**`
      }

      if (args[2]) {
        message = `${message} with the value **${args[2]}**`
      }

      return message
    },

    _isAssertionsMenu ($el) {
      return $el.hasClass('__cypress-studio-assertions-menu')
    },

    _openAssertionsMenu (event) {
      if (!this._body) {
        throw Error('this._body was not defined')
      }

      event.preventDefault()
      event.stopPropagation()

      const $el = window.UnifiedRunner.CypressJQuery(event.target)

      if (this._isAssertionsMenu($el)) {
        return
      }

      this._closeAssertionsMenu()

      openStudioAssertionsMenu({
        $el,
        $body: window.UnifiedRunner.CypressJQuery(this._body),
        props: {
          possibleAssertions: this._generatePossibleAssertions($el),
          addAssertion: this._addAssertion,
          closeMenu: this._closeAssertionsMenu,
        },
      })
    },

    _closeAssertionsMenu () {
      if (!this._body) {
        throw Error('this._body was not defined')
      }

      closeStudioAssertionsMenu(window.UnifiedRunner.CypressJQuery(this._body))
    },

    _generatePossibleAssertions ($el: JQuery<Element>) {
      const tagName = $el.prop('tagName')

      const possibleAssertions: PossibleAssertions = []

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

      const attributes = Array.from($el[0].attributes).reduce<Array<{ name: string, value: string }>>((acc, { name, value }) => {
        if (name === 'value' || name === 'disabled') {
          return acc
        }

        if (name === 'class') {
          possibleAssertions.push({
            type: 'have.class',
            options: value.split(' ').map((value) => ({ value })),
          })

          return acc
        }

        if (name === 'id') {
          possibleAssertions.push({
            type: 'have.id',
            options: [{
              value,
            }],
          })

          return acc
        }

        if (name !== undefined && name !== '' && value !== undefined && value !== '') {
          return acc.concat({
            name,
            value,
          })
        }

        return acc
      }, [])

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
    },
  },

  getters: {
    hasRunnableId (state) {
      return !!state.testId || !!state.suiteId
    },

    isOpen: (state) => {
      return state.isActive || state.isLoading || state._hasStarted
    },

    isEmpty: (state): boolean => {
      return state.logs.length === 0
    },

    hookId: (state) => {
      return `${state.testId}-studio`
    },

    needsUrl: (state) => {
      return state.isActive && !state.url && !state.isFailed
    },

    testError: (state) => {
      return {
        id: state.testId,
        state: 'failed',
      }
    },
  },
})
