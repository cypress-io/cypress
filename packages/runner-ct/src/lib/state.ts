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
}

const _defaults: Defaults = {
  messageTitle: null,
  messageDescription: null,
  messageType: '',
  messageControls: null,

  pluginsHeight: PLUGIN_BAR_HEIGHT,

  reporterWidth: null,
  specListWidth: DEFAULT_LIST_WIDTH,
  isSpecsListOpen: true,

}

export default class State extends BaseStore {
  defaults = _defaults

  @observable isRunning = false
  @observable waitingForInitialBuild = false

  @observable.ref messageControls = _defaults.messageControls

  @observable snapshot = {
    showingHighlights: true,
    stateIndex: 0,
  }

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
    reporterWidth = DEFAULT_REPORTER_WIDTH,
    specListWidth = DEFAULT_LIST_WIDTH,
    isSpecsListOpen = true,
  }, config: Cypress.RuntimeConfigOptions) {
    super('component')

    this.reporterWidth = reporterWidth
    this.isSpecsListOpen = isSpecsListOpen
    this.spec = spec
    this.specs = specs
    this.specListWidth = specListWidth
    this.runMode = runMode

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

  @action toggleIsSpecsListOpen () {
    this.isSpecsListOpen = !this.isSpecsListOpen

    return this.isSpecsListOpen
  }

  @action setIsSpecsListOpen (open: boolean) {
    this.isSpecsListOpen = open
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

  @action updateSpecByUrl (specUrl) {
    const foundSpec = _.find(this.specs, { relative: decodeURI(specUrl) })

    if (foundSpec) {
      this.spec = foundSpec
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
