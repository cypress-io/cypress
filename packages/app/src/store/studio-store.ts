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

const eventsWithValue = [
  'change',
  'keydown',
  'keyup',
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

export type EntrySource = 'welcome' | 'new-test-root' | 'new-test-suite' | 'edit'

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
  _initialUrl?: string

  fileDetails?: FileDetails
  absoluteFile?: string
  runnableTitle?: string
  _previousMouseEvent?: {
    element: Element
    selector: string
  }
  _currentId: number

  canAccessStudioAI: boolean
  showUrlPrompt: boolean
  cloudStudioRequested: boolean
  sessionId?: string
  _isStudioCreatedTest: boolean
  newTestLineNumber?: number
  _originalGrepSettings: Record<string, string>
  entrySource?: EntrySource
}

function getUrlParams () {
  const url = new URL(window.location.href)
  const hashParams = new URLSearchParams(url.hash)

  const testId = hashParams.get('testId')
  const suiteId = hashParams.get('suiteId')
  const visitUrl = hashParams.get('url')
  const newTestLineNumber = hashParams.get('newTestLineNumber') ? Number(hashParams.get('newTestLineNumber')) : undefined
  const sessionId = hashParams.get('sessionId')

  return { testId, suiteId, url: visitUrl, newTestLineNumber, sessionId }
}

export const useStudioStore = defineStore('studioRecorder', {
  state: (): StudioRecorderState => {
    // try to restore sessionId from URL parameters
    const urlParams = getUrlParams()
    const persistedSessionId = urlParams.sessionId || undefined

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
      canAccessStudioAI: false,
      showUrlPrompt: true,
      cloudStudioRequested: false,
      sessionId: persistedSessionId,
      newTestLineNumber: undefined,
      _isStudioCreatedTest: false,
      _originalGrepSettings: {},
      entrySource: undefined,
    }
  },

  actions: {
    setCloudStudioRequested (cloudStudioRequested: boolean) {
      this.cloudStudioRequested = cloudStudioRequested
    },

    setShowUrlPrompt (shouldShowUrlPrompt: boolean) {
      this.showUrlPrompt = shouldShowUrlPrompt
    },

    setTestId (testId: string) {
      this.testId = testId
      this.suiteId = undefined
      this.newTestLineNumber = undefined
      this._updateUrlParams(['testId', 'suiteId', 'newTestLineNumber'])
    },

    setSuiteId (suiteId: string) {
      this.suiteId = suiteId
      this.testId = undefined
      this._updateUrlParams(['testId', 'suiteId'])
    },

    setCanAccessStudioAI (canAccessStudioAI: boolean) {
      this.canAccessStudioAI = canAccessStudioAI
    },

    setSessionId (sessionId: string) {
      this.sessionId = sessionId
      this._updateUrlParams(['sessionId'])
    },

    clearSessionId () {
      this.sessionId = undefined
      this._removeUrlParams(['sessionId'])
    },

    setNewTestLineNumber (newTestLineNumber: number) {
      this.newTestLineNumber = newTestLineNumber
      this._updateUrlParams(['newTestLineNumber'])
    },

    clearRunnableIds () {
      this.testId = undefined
      this.suiteId = undefined
      this.newTestLineNumber = undefined
    },

    needsProtocolCleanup () {
      // Protocol cleanup (page reload) is only needed if the user has actually entered single test mode in Studio
      return this._hasStarted || this.testId || this._isStudioCreatedTest
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

    setActive (isActive: boolean) {
      this.isActive = isActive
    },

    setUrl (url?: string) {
      this.url = url
    },

    setEntrySource (entrySource: EntrySource) {
      this.entrySource = entrySource
    },

    testFailed () {
      this.isFailed = true
    },

    setup (config) {
      const studio = this.getUrlParams()

      if (studio.newTestLineNumber) {
        this.setNewTestLineNumber(studio.newTestLineNumber)
      } else if (studio.testId) {
        this.setTestId(studio.testId)
      } else if (studio.suiteId) {
        this.setSuiteId(studio.suiteId)
      }

      if (studio.url) {
        this._initialUrl = studio.url
      }

      if (studio.sessionId) {
        this.sessionId = studio.sessionId
      }

      // if we have an existing test or are creating a new test, we need to start loading
      // otherwise if we have a suite, we can just set the studio active
      if (this.testId || studio.newTestLineNumber) {
        this.setAbsoluteFile(config.spec.absolute)
        this.startLoading()
      } else if (this.suiteId) {
        this.setActive(true)
      }
    },

    initialize () {
      if (this.newTestLineNumber) {
        getCypress().runner.setNewTestLineNumber(this.newTestLineNumber)
        // Creating a new test - need to bypass .only filtering
        getCypress().runner.setIsStudioCreatedTest(true)
        this._isStudioCreatedTest = true
      } else if (this.testId) {
        getCypress().runner.setOnlyTestId(this.testId)
        getCypress().runner.setIsStudioCreatedTest(this._isStudioCreatedTest)
      }
    },

    interceptTest (test) {
      // if this test is the one we created, we can just set the test id
      if ((this.newTestLineNumber && test.invocationDetails?.line === this.newTestLineNumber) || (this.suiteId && this._hasStarted)) {
        this._isStudioCreatedTest = true
        this.setTestId(test.id)
        getCypress().runner.setIsStudioCreatedTest(true)
      }

      if (this.testId) {
        if (test.invocationDetails) {
          this.setFileDetails(test.invocationDetails)
        }

        this.setRunnableTitle(test.title)
      }
    },

    start () {
      this.isActive = true
      this.isLoading = false
      this.logs = []
      this._currentId = 1
      this._hasStarted = true

      const autStore = useAutStore()

      if (this._initialUrl || this.url) {
        this.setUrl(this._initialUrl)
      }

      if (!this.url && autStore.url) {
        this.setUrl(autStore.url)
      }
    },

    stop () {
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
      this.showUrlPrompt = true
      this._isStudioCreatedTest = false
      this._originalGrepSettings = {}

      this._maybeResetRunnables()
    },

    cancel () {
      this.reset()
      this.clearRunnableIds()
      this._removeUrlParams()
      this._initialUrl = undefined
      this.clearSessionId()
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

    saveSuccess () {
      this.stop()
      this._removeUrlParams()
      this._initialUrl = undefined
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

    _maybeResetRunnables () {
      const url = new URL(window.location.href)
      const hashParams = new URLSearchParams(url.hash)

      // if we don't have studio params, then we can reset the runnables
      // otherwise, we need to keep the runnables since we're still in studio
      if (!hashParams.has('studio')) {
        this.clearRunnableIds()
      }
    },

    getUrlParams,

    _updateUrlParams (filter: string[] = ['testId', 'suiteId', 'url', 'newTestLineNumber', 'sessionId']) {
      // if we don't have studio params, we don't need to update them
      if (!this.testId && !this.suiteId && !this.url && !this.newTestLineNumber && !this.sessionId) return

      // if we have studio params, we need to remove them before adding them back
      this._removeUrlParams(filter)

      const url = new URL(window.location.href)
      const hashParams = new URLSearchParams(url.hash)

      // set the studio params
      hashParams.set('studio', '')
      filter.forEach((param) => {
        if (this[param]) hashParams.set(param, this[param])
      })

      // update the url
      url.hash = decodeURIComponent(hashParams.toString())
      window.history.replaceState({}, '', url.toString())
    },

    _removeUrlParams (filter: string[] = ['testId', 'suiteId', 'url', 'newTestLineNumber', 'sessionId']) {
      const url = new URL(window.location.href)
      const hashParams = new URLSearchParams(url.hash)

      // if we don't have studio params, we don't need to remove them
      if (!hashParams.has('studio')) return

      // remove the studio params
      filter.forEach((param) => {
        hashParams.delete(param)
      })

      // if there are no studio specific params left, we can also remove the studio param
      if (!hashParams.has('testId') && !hashParams.has('suiteId') && !hashParams.has('url') && !hashParams.has('newTestLineNumber') && !hashParams.has('sessionId')) {
        hashParams.delete('studio')
      }

      // update the url
      url.hash = decodeURIComponent(hashParams.toString())
      window.history.replaceState({}, '', url.toString())
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
          selector: getCypress().ElementSelector._getSelector(window.UnifiedRunner.CypressJQuery(target)),
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

    _openAssertionsMenu (event, body: HTMLElement, addAssertion: ($el: HTMLElement | JQuery<HTMLElement>, ...args: AssertionArgs) => void, generatePossibleAssertions?: ($el: JQuery<Element>) => PossibleAssertions) {
      event.preventDefault()
      event.stopPropagation()

      const $el = window.UnifiedRunner.CypressJQuery(event.target)

      if (this._isAssertionsMenu($el)) {
        return
      }

      this._closeAssertionsMenu(body)

      openStudioAssertionsMenu({
        $el,
        $body: window.UnifiedRunner.CypressJQuery(body),
        props: {
          possibleAssertions: generatePossibleAssertions ? generatePossibleAssertions($el) : this._generatePossibleAssertions($el),
          addAssertion,
          closeMenu: () => this._closeAssertionsMenu(body),
        },
      })
    },

    _closeAssertionsMenu (body: HTMLElement) {
      closeStudioAssertionsMenu(window.UnifiedRunner.CypressJQuery(body))
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
      return state.isActive && !state.url && !state.isFailed && state._hasStarted
    },

    testError: (state) => {
      return {
        id: state.testId,
        state: 'failed',
      }
    },
  },
})
