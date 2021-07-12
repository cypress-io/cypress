import { action, computed, observable } from 'mobx'
import _ from 'lodash'
import { UIPlugin } from '../plugins/UIPlugin'
import { automation, BaseStore, RunMode } from '@packages/runner-shared'
import {
  DEFAULT_REPORTER_WIDTH,
  LEFT_NAV_WIDTH,
  DEFAULT_LIST_WIDTH,
  AUT_IFRAME_MARGIN,
  PLUGIN_BAR_HEIGHT,
  HEADER_HEIGHT,
  DEFAULT_PLUGINS_HEIGHT,
} from '../app/RunnerCt'

interface Defaults {
  messageTitle: string | null
  messageDescription: string | null
  messageType: string
  messageControls: unknown

  reporterWidth: number | null
  pluginsHeight: number | null
  specListWidth: number | null
  isSpecsListOpen: boolean

  height: number
  width: number

  url: string
  highlightUrl: boolean
  isLoadingUrl: boolean

  callbackAfterUpdate: ((...args: unknown[]) => void) | null
}

const _defaults: Defaults = {
  messageTitle: null,
  messageDescription: null,
  messageType: '',
  messageControls: null,

  height: 500,
  width: 500,

  pluginsHeight: PLUGIN_BAR_HEIGHT,

  reporterWidth: null,
  specListWidth: DEFAULT_LIST_WIDTH,
  isSpecsListOpen: true,

  url: '',
  highlightUrl: false,
  isLoadingUrl: false,

  callbackAfterUpdate: null,
}

export default class State extends BaseStore {
  defaults = _defaults

  @observable isLoading = true
  @observable isRunning = false
  @observable waitingForInitialBuild = false

  @observable messageTitle = _defaults.messageTitle
  @observable messageDescription = _defaults.messageDescription
  @observable messageType = _defaults.messageType
  @observable callbackAfterUpdate = _defaults.callbackAfterUpdate
  @observable.ref messageControls = _defaults.messageControls

  @observable snapshot = {
    showingHighlights: true,
    stateIndex: 0,
  }

  @observable url = _defaults.url
  @observable highlightUrl = _defaults.highlightUrl
  @observable isLoadingUrl = _defaults.isLoadingUrl

  @observable width = _defaults.width
  @observable height = _defaults.height

  @observable screenshotting = false

  // if null, the default CSS handles it
  // if non-null, the user has set it by resizing
  @observable reporterWidth = _defaults.reporterWidth
  @observable pluginsHeight = _defaults.pluginsHeight
  @observable specListWidth = _defaults.specListWidth
  @observable isSpecsListOpen = _defaults.isSpecsListOpen

  // what the dom reports, always in pixels
  @observable absoluteReporterWidth = 0
  @observable headerHeight = 0

  @observable windowWidth = 0
  @observable windowHeight = 0

  @observable automation = automation.CONNECTING

  @observable.ref scriptError: string | undefined

  @observable specRunId: string | null = null

  @observable readyToRunTests = false
  @observable activePlugin: string | null = null
  @observable plugins: UIPlugin[] = []

  constructor ({
    spec,
    specs = [],
    runMode = 'single' as RunMode,
    multiSpecs = [],
    reporterWidth = DEFAULT_REPORTER_WIDTH,
    specListWidth = DEFAULT_LIST_WIDTH,
    isSpecsListOpen = true,
  }, config: Cypress.RuntimeConfigOptions) {
    super()
    this.reporterWidth = reporterWidth
    this.isSpecsListOpen = isSpecsListOpen
    this.spec = spec
    this.specs = specs
    this.specListWidth = specListWidth
    this.runMode = runMode
    this.multiSpecs = multiSpecs

    // TODO: Refactor so `config` is only needed in MobX, not passed separately to arbitrary components
    if (config.isTextTerminal) {
      this.isSpecsListOpen = false
    }

    // TODO: receive chosen spec from state and set it here
  }

  @computed get scale () {
    // the width of the AUT area can be determined by subtracting the
    // width of the other parts of the UI from the window.innerWidth
    // we also need to consider the margin around the aut iframe
    // window.innerWidth - leftNav - specList - reporter - aut-iframe-margin
    const autAreaWidth = this.windowWidth
      - LEFT_NAV_WIDTH
      - (this.isSpecsListOpen ? this.specListWidth : 0) // if spec list is closed, don't need to consider it.
      - this.reporterWidth
      - (AUT_IFRAME_MARGIN.X * 2)

    // same for the height.
    // height - pluginsHeight (0 if no plugins are open) - plugin-bar-height - header-height - margin
    const autAreaHeight = this.windowHeight - this.pluginsHeight - PLUGIN_BAR_HEIGHT - HEADER_HEIGHT - (AUT_IFRAME_MARGIN.Y * 2)

    // defensively return scale 1 if either height is negative.
    // this should not happen in general.
    if (autAreaWidth < 0 || autAreaHeight < 0) {
      return 1
    }

    if (autAreaWidth < this.width || autAreaHeight < this.height) {
      return Math.min(
        autAreaWidth / this.width,
        autAreaHeight / this.height,
      )
    }

    return 1
  }

  @computed get _containerWidth () {
    return this.windowWidth - this.absoluteReporterWidth
  }

  @computed get _containerHeight () {
    return this.windowHeight - this.headerHeight
  }

  @computed get displayScale () {
    return Math.floor(this.scale * 100)
  }

  @computed.struct get messageStyles () {
    const actualHeight = this.height * this.scale
    const messageHeight = 33
    const nudge = 10

    if ((actualHeight + messageHeight + (nudge * 2)) >= this._containerHeight) {
      return { state: 'stationary' }
    }

    return {
      state: 'attached',
      styles: {
        top: (actualHeight + this.headerHeight + nudge),
      },
    }
  }

  @action setScreenshotting (screenshotting: boolean) {
    this.screenshotting = screenshotting
  }

  @action updateDimensions (width: number, height: number) {
    this.height = height
    this.width = width
  }

  @action toggleIsSpecsListOpen () {
    this.isSpecsListOpen = !this.isSpecsListOpen

    return this.isSpecsListOpen
  }

  @action setIsSpecsListOpen (open: boolean) {
    this.isSpecsListOpen = open
  }

  @action setIsLoading (isLoading) {
    this.isLoading = isLoading
  }

  @action updateReporterWidth (width: number) {
    this.reporterWidth = width
  }

  @action updatePluginsHeight (height: number) {
    this.pluginsHeight = height
  }

  @action updateSpecListWidth (width: number) {
    this.specListWidth = width
  }

  @action updateWindowDimensions ({
    windowWidth,
    windowHeight,
    headerHeight,
  }: { windowWidth?: number, windowHeight?: number, headerHeight?: number }) {
    if (windowWidth) {
      this.windowWidth = windowWidth
    }

    if (windowHeight) {
      this.windowHeight = windowHeight
    }

    if (headerHeight) {
      this.headerHeight = headerHeight
    }
  }

  @action clearMessage () {
    this.messageTitle = _defaults.messageTitle
    this.messageDescription = _defaults.messageDescription
    this.messageType = _defaults.messageType
  }

  setCallbackAfterUpdate (cb) {
    this.callbackAfterUpdate = () => {
      this.setCallbackAfterUpdateToNull()

      cb()
    }
  }

  @action setCallbackAfterUpdateToNull () {
    this.callbackAfterUpdate = null
  }

  @action resetUrl () {
    this.url = _defaults.url
    this.highlightUrl = _defaults.highlightUrl
    this.isLoadingUrl = _defaults.isLoadingUrl
  }

  @action updateSpecByUrl (specUrl) {
    const foundSpec = _.find(this.specs, { name: decodeURI(specUrl) })

    if (foundSpec) {
      this.spec = foundSpec
    }
  }

  @action addSpecToMultiMode (newSpec: Cypress.Cypress['spec']) {
    const isAlreadyRunningNewSpec = this.multiSpecs.some(
      (existingSpec) => existingSpec.relative === newSpec.relative,
    )

    if (isAlreadyRunningNewSpec) {
      this.multiSpecs = this.multiSpecs.filter((existingSpec) => existingSpec.relative !== newSpec.relative)
    } else if (this.runMode === 'single' && this.spec) {
      // when the new
      this.multiSpecs = [this.spec, newSpec]
    } else {
      this.multiSpecs = [...this.multiSpecs, newSpec]
    }

    this.runMode = 'multi'
    this.runMultiMode().catch((e) => {
      throw e
    })
  }

  runMultiMode = async () => {
    const eventManager = require('@packages/runner-shared').eventManager
    const waitForRunEnd = () => new Promise((res) => eventManager.on('run:end', res))

    this.setSpec(null)
    for (const spec of this.multiSpecs) {
      this.setSpec(spec)
      await waitForRunEnd()
    }
  }

  loadReactDevTools = () => {
    return import(/* webpackChunkName: "ctChunk-reactdevtools" */ '../plugins/ReactDevtools')
    .then(action((ReactDevTools) => {
      this.plugins = [
        ReactDevTools.create(),
      ]
    }))
  }

  @action
  setShowSnapshotHighlight = (showingHighlights: boolean) => {
    this.snapshot.showingHighlights = showingHighlights
  }

  @action
  setSnapshotIndex = (stateIndex: number) => {
    this.snapshot.stateIndex = stateIndex
  }

  @action
  initializePlugins = (config: Cypress.RuntimeConfigOptions & Cypress.ResolvedConfigOptions) => {
    if (config.env.reactDevtools && !config.isTextTerminal) {
      this.loadReactDevTools()
      .then(action(() => {
        this.readyToRunTests = true
      }))
      .catch((e) => {
        this.readyToRunTests = true
        // eslint-disable-next-line
        console.error('Can not load react-devtools.', e)
      })
    } else {
      this.readyToRunTests = true
    }
  }

  @action
  registerDevtools = (contentWindow: Window) => {
    this.plugins.forEach((plugin) => {
      if (plugin.type === 'devtools') {
        plugin.initialize(contentWindow)
      }
    })
  }

  @action
  setActivePlugin = (newPlugin: string) => {
    this.activePlugin = newPlugin
  }

  @action
  toggleDevtoolsPlugin = (plugin: UIPlugin, domElement: HTMLElement) => {
    if (this.activePlugin === plugin.name) {
      plugin.unmount()
      this.setActivePlugin(null)
      // set this back to default to force the AUT to resize vertically
      // if the aspect ratio is very long on the Y axis.
      this.pluginsHeight = PLUGIN_BAR_HEIGHT
    } else {
      this.setActivePlugin(plugin.name)
      // set this to force the AUT to resize vertically if the aspect ratio is very long
      // on the Y axis.
      this.pluginsHeight = DEFAULT_PLUGINS_HEIGHT
      plugin.mount(domElement)
    }
  }

  @computed
  get isAnyDevtoolsPluginOpen () {
    return this.activePlugin !== null
  }

  @computed
  get isAnyPluginToShow () {
    return Boolean(this.plugins.length > 0 && this.spec)
  }
}
