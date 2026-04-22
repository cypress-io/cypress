import type { FileDetails, Instrument, TestState } from '@packages/types/src'
import { defineStore } from 'pinia'

import { getEventManager } from '../runner'
import { closeStudioAssertionsMenu, openStudioAssertionsMenu } from '../runner/studio/mounter'
import { useAutStore } from './aut-store'
import type { PossibleAssertions, AssertionArgs } from '../runner/studio/types'

function getCypress () {
  const eventManager = getEventManager()

  return eventManager.getCypress()
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
}

export type EntrySource = 'welcome' | 'new-test-root' | 'new-test-suite' | 'edit'

interface StudioRecorderState {
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

  canAccessStudioAI: boolean
  showUrlPrompt: boolean
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
  const entrySource = hashParams.get('entrySource')

  return { testId, suiteId, url: visitUrl, newTestLineNumber, sessionId, entrySource }
}

export const useStudioStore = defineStore('studioRecorder', {
  state: (): StudioRecorderState => {
    // try to restore sessionId from URL parameters
    const urlParams = getUrlParams()
    const persistedSessionId = urlParams.sessionId || undefined

    return {
      url: '',
      isLoading: false,
      isActive: false,
      isFailed: false,
      _hasStarted: false,
      canAccessStudioAI: false,
      showUrlPrompt: true,
      sessionId: persistedSessionId,
      newTestLineNumber: undefined,
      _isStudioCreatedTest: false,
      _originalGrepSettings: {},
      entrySource: undefined,
    }
  },

  actions: {
    setShowUrlPrompt (shouldShowUrlPrompt: boolean) {
      this.showUrlPrompt = shouldShowUrlPrompt
    },

    setTestId (testId: string) {
      this.testId = testId
      this.suiteId = undefined
      this.newTestLineNumber = undefined
      this.entrySource = undefined
      this._updateUrlParams(['testId', 'suiteId', 'newTestLineNumber', 'entrySource'])
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
      this.entrySource = undefined
      this._updateUrlParams(['newTestLineNumber', 'entrySource'])
    },

    clearRunnableIds () {
      this.testId = undefined
      this.suiteId = undefined
      this.newTestLineNumber = undefined
      this.entrySource = undefined
    },

    needsProtocolCleanup () {
      // Protocol cleanup (page reload) is only needed if the user has actually entered single test mode in Studio
      return this._hasStarted || this.testId || this._isStudioCreatedTest
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
      this._updateUrlParams(['entrySource'])
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
        // we only need to set the entry source if we are displaying the welcome screen or creating a new test
        if (studio.entrySource) {
          this.setEntrySource(studio.entrySource as EntrySource)
        }
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

      this.url = undefined
      this._hasStarted = false
      this.isFailed = false
      this.showUrlPrompt = true
      this._isStudioCreatedTest = false
      this._originalGrepSettings = {}
      this.entrySource = undefined

      this._maybeResetRunnables()
    },

    cancel () {
      this.reset()
      this.clearRunnableIds()
      this._removeUrlParams()
      this._initialUrl = undefined
      this.clearSessionId()
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

    _updateUrlParams (filter: string[] = ['testId', 'suiteId', 'url', 'newTestLineNumber', 'sessionId', 'entrySource']) {
      // if we don't have studio params, we don't need to update them
      if (!this.testId && !this.suiteId && !this.url && !this.newTestLineNumber && !this.sessionId && !this.entrySource) return

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

    _removeUrlParams (filter: string[] = ['testId', 'suiteId', 'url', 'newTestLineNumber', 'sessionId', 'entrySource']) {
      const url = new URL(window.location.href)
      const hashParams = new URLSearchParams(url.hash)

      // if we don't have studio params, we don't need to remove them
      if (!hashParams.has('studio')) return

      // remove the studio params
      filter.forEach((param) => {
        hashParams.delete(param)
      })

      // if there are no studio specific params left, we can also remove the studio param
      if (!hashParams.has('testId') && !hashParams.has('suiteId') && !hashParams.has('url') && !hashParams.has('newTestLineNumber') && !hashParams.has('sessionId') && !hashParams.has('entrySource')) {
        hashParams.delete('studio')
      }

      // update the url
      url.hash = decodeURIComponent(hashParams.toString())
      window.history.replaceState({}, '', url.toString())
    },

    _isAssertionsMenu ($el) {
      return $el.hasClass('__cypress-studio-assertions-menu')
    },

    _openAssertionsMenu (event, body: HTMLElement, addAssertion: ($el: HTMLElement | JQuery<HTMLElement>, ...args: AssertionArgs) => void, generatePossibleAssertions: ($el: JQuery<Element>) => PossibleAssertions) {
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
          possibleAssertions: generatePossibleAssertions($el),
          addAssertion,
          closeMenu: () => this._closeAssertionsMenu(body),
        },
      })
    },

    _closeAssertionsMenu (body: HTMLElement) {
      closeStudioAssertionsMenu(window.UnifiedRunner.CypressJQuery(body))
    },
  },

  getters: {
    isOpen: (state) => {
      return state.isActive || state.isLoading || state._hasStarted
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
