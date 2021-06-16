import { action, computed, observable, makeObservable } from 'mobx'
import _ from 'lodash'
import { UIPlugin } from '../plugins/UIPlugin'
import { nanoid } from 'nanoid'
import { automation } from '@packages/runner-shared'
import {
  DEFAULT_REPORTER_WIDTH,
  LEFT_NAV_WIDTH,
  DEFAULT_LIST_WIDTH,
  AUT_IFRAME_MARGIN,
  PLUGIN_BAR_HEIGHT,
  HEADER_HEIGHT,
  DEFAULT_PLUGINS_HEIGHT,
} from '../app/RunnerCt'

export type RunMode = 'single' | 'multi'

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

  spec: Cypress.Cypress['spec'] | null
  specs: Cypress.Cypress['spec'][]

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

  spec: null,
  specs: [],

  callbackAfterUpdate: null,
}

export default class State {
  defaults = _defaults

  isLoading = true;
  isRunning = false;
  waitingForInitialBuild = false;

  messageTitle = _defaults.messageTitle;
  messageDescription = _defaults.messageDescription;
  messageType = _defaults.messageType;
  callbackAfterUpdate = _defaults.callbackAfterUpdate;
  messageControls = _defaults.messageControls;

  snapshot = {
    showingHighlights: true,
    stateIndex: 0,
  };

  url = _defaults.url;
  highlightUrl = _defaults.highlightUrl;
  isLoadingUrl = _defaults.isLoadingUrl;

  width = _defaults.width;
  height = _defaults.height;

  screenshotting = false;

  // if null, the default CSS handles it
  // if non-null, the user has set it by resizing
  reporterWidth = _defaults.reporterWidth;
  pluginsHeight = _defaults.pluginsHeight;
  specListWidth = _defaults.specListWidth;
  isSpecsListOpen = _defaults.isSpecsListOpen;

  // what the dom reports, always in pixels
  absoluteReporterWidth = 0;
  headerHeight = 0;

  windowWidth = 0;
  windowHeight = 0;

  automation = automation.CONNECTING;

  scriptError: string | undefined;

  spec = _defaults.spec;
  specs = _defaults.specs;
  specRunId: string | null = null;
  /** @type {"single" | "multi"} */
  runMode: RunMode = 'single';
  multiSpecs: Cypress.Cypress['spec'][] = [];

  readyToRunTests = false;
  activePlugin: string | null = null;
  plugins: UIPlugin[] = [];

  constructor ({
    spec = _defaults.spec,
    specs = _defaults.specs,
    runMode = 'single' as RunMode,
    multiSpecs = [],
    reporterWidth = DEFAULT_REPORTER_WIDTH,
    specListWidth = DEFAULT_LIST_WIDTH,
    isSpecsListOpen = true,
  }, config: Cypress.RuntimeConfigOptions) {
    makeObservable(this, {
      isLoading: observable,
      isRunning: observable,
      waitingForInitialBuild: observable,
      messageTitle: observable,
      messageDescription: observable,
      messageType: observable,
      callbackAfterUpdate: observable,
      messageControls: observable.ref,
      snapshot: observable,
      url: observable,
      highlightUrl: observable,
      isLoadingUrl: observable,
      width: observable,
      height: observable,
      screenshotting: observable,
      reporterWidth: observable,
      pluginsHeight: observable,
      specListWidth: observable,
      isSpecsListOpen: observable,
      absoluteReporterWidth: observable,
      headerHeight: observable,
      windowWidth: observable,
      windowHeight: observable,
      automation: observable,
      scriptError: observable.ref,
      spec: observable,
      specs: observable,
      specRunId: observable,
      runMode: observable,
      multiSpecs: observable,
      readyToRunTests: observable,
      activePlugin: observable,
      plugins: observable,
      scale: computed,
      _containerWidth: computed,
      _containerHeight: computed,
      displayScale: computed,
      messageStyles: computed.struct,
      setScreenshotting: action,
      updateDimensions: action,
      toggleIsSpecsListOpen: action,
      setIsSpecsListOpen: action,
      setIsLoading: action,
      updateReporterWidth: action,
      updatePluginsHeight: action,
      updateSpecListWidth: action,
      updateWindowDimensions: action,
      clearMessage: action,
      setCallbackAfterUpdateToNull: action,
      resetUrl: action,
      setSpec: action,
      setSpecs: action,
      updateSpecByUrl: action,
      setSingleSpec: action,
      addSpecToMultiMode: action,
      setShowSnapshotHighlight: action,
      setSnapshotIndex: action,
      initializePlugins: action,
      registerDevtools: action,
      setActivePlugin: action,
      toggleDevtoolsPlugin: action,
      isAnyDevtoolsPluginOpen: computed,
      isAnyPluginToShow: computed,
    })

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

  get scale () {
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

  get _containerWidth () {
    return this.windowWidth - this.absoluteReporterWidth
  }

  get _containerHeight () {
    return this.windowHeight - this.headerHeight
  }

  get displayScale () {
    return Math.floor(this.scale * 100)
  }

  get messageStyles () {
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

  setScreenshotting (screenshotting: boolean) {
    this.screenshotting = screenshotting
  }

  updateDimensions (width: number, height: number) {
    this.height = height
    this.width = width
  }

  toggleIsSpecsListOpen () {
    this.isSpecsListOpen = !this.isSpecsListOpen

    return this.isSpecsListOpen
  }

  setIsSpecsListOpen (open: boolean) {
    this.isSpecsListOpen = open
  }

  setIsLoading (isLoading) {
    this.isLoading = isLoading
  }

  updateReporterWidth (width: number) {
    this.reporterWidth = width
  }

  updatePluginsHeight (height: number) {
    this.pluginsHeight = height
  }

  updateSpecListWidth (width: number) {
    this.specListWidth = width
  }

  updateWindowDimensions (
    {
      windowWidth,
      windowHeight,
      headerHeight,
    }: { windowWidth?: number, windowHeight?: number, headerHeight?: number },
  ) {
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

  clearMessage () {
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

  setCallbackAfterUpdateToNull () {
    this.callbackAfterUpdate = null
  }

  resetUrl () {
    this.url = _defaults.url
    this.highlightUrl = _defaults.highlightUrl
    this.isLoadingUrl = _defaults.isLoadingUrl
  }

  setSpec (spec: Cypress.Cypress['spec'] | null) {
    this.spec = spec
    this.specRunId = nanoid()
  }

  setSpecs (specs) {
    this.specs = specs
  }

  updateSpecByUrl (specUrl) {
    const foundSpec = _.find(this.specs, { name: decodeURI(specUrl) })

    if (foundSpec) {
      this.spec = foundSpec
    }
  }

  setSingleSpec (spec: Cypress.Cypress['spec'] | undefined) {
    if (this.runMode === 'multi') {
      this.runMode = 'single'
      this.multiSpecs = []
    }

    this.setSpec(spec)
  }

  addSpecToMultiMode (newSpec: Cypress.Cypress['spec']) {
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

  setShowSnapshotHighlight = (showingHighlights: boolean) => {
    this.snapshot.showingHighlights = showingHighlights
  };

  setSnapshotIndex = (stateIndex: number) => {
    this.snapshot.stateIndex = stateIndex
  };

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
  };

  registerDevtools = (contentWindow: Window) => {
    this.plugins.forEach((plugin) => {
      if (plugin.type === 'devtools') {
        plugin.initialize(contentWindow)
      }
    })
  };

  setActivePlugin = (newPlugin: string) => {
    this.activePlugin = newPlugin
  };

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
  };

  get isAnyDevtoolsPluginOpen () {
    return this.activePlugin !== null
  }

  get isAnyPluginToShow () {
    return Boolean(this.plugins.length > 0 && this.spec)
  }
}
