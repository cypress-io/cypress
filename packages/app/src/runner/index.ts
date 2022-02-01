/// <reference types="../../index" />

/**
 * This is the seam between the new "unified app", built with
 * Vite and Vue, and the existing code, including:
 * - driver
 * - reporter
 * - event manager
 * - anything in runner-shared, such as AutIframe, etc.
 * which are built with React and bundle with webpack.
 *
 * The entry point for the webpack bundle is `runner-ct/main.tsx`.
 * Any time you need to consume some existing code, add it to the `window.UnifiedRunner`
 * namespace there, and access it with `window.UnifiedRunner`.
 *
 */
import { watchEffect } from 'vue'
import { getMobxRunnerStore, initializeMobxStore, useAutStore, useRunnerUiStore } from '../store'
import { injectBundle } from './injectBundle'
import type { SpecFile } from '@packages/types/src/spec'
import { UnifiedReporterAPI } from './reporter'
import { getRunnerElement, empty } from './utils'
import { IframeModel } from './iframe-model'
import { AutIframe } from './aut-iframe'
import { EventManager } from './event-manager'
import { client } from '@packages/socket/lib/browser'
import { decodeBase64Unicode } from '@packages/frontend-shared/src/utils/base64'
import type { AutomationElementId } from '@packages/types/src'
import { useSnapshotStore } from './snapshot-store'

let _eventManager: EventManager | undefined

export function createWebsocket (socketIoRoute) {
  const socketConfig = {
    path: socketIoRoute,
    transports: ['websocket'],
  }

  const ws = client(socketConfig)

  ws.on('connect', () => {
    ws.emit('runner:connected')
  })

  return ws
}

export function initializeEventManager (UnifiedRunner: any) {
  _eventManager = new EventManager(
    UnifiedRunner.CypressDriver,
    UnifiedRunner.MobX,
    UnifiedRunner.selectorPlaygroundModel,
    UnifiedRunner.StudioRecorder,
    // created once when opening runner at the very top level in main.ts
    window.ws,
  )
}

export function getEventManager () {
  if (!_eventManager) {
    throw Error(`eventManager is undefined. Make sure you call initializeEventManager before attempting to access it.`)
  }

  return _eventManager
}

let _autIframeModel: AutIframe

/**
 * Creates an instance of an AutIframe model which ise used to control
 * various things like snapshots, and the lifecycle of the underlying
 * AUT <iframe> element
 *
 * This only needs to be created once per **spec**. If you change spec,
 * you need to create a new AUT IFrame model.
 */
export function getAutIframeModel (): AutIframe {
  if (!_autIframeModel) {
    throw Error('Must create a new instance of AutIframe before accessing')
  }

  return _autIframeModel
}

/**
 * 1:1: relationship with the AUT IFrame model.
 * controls various things to do with snapshots, test url, etc.
 * It also has a listen function which initializes many events to do with the
 * run lifecycle, snapshots, and viewport.
 */
function createIframeModel () {
  const autIframe = getAutIframeModel()
  // IFrame Model to manage snapshots, etc.
  const iframeModel = new IframeModel(
    autIframe.detachDom,
    autIframe.restoreDom,
    autIframe.highlightEl,
    getEventManager(),
    {
      recorder: getEventManager().studioRecorder,
      selectorPlaygroundModel: getEventManager().selectorPlaygroundModel,
    },
  )

  iframeModel.listen()
}

/**
 * One-time setup. Required `window.UnifiedRunner` to exist,
 * so this is passed as a callback to the `renderRunner` function,
 * which injects `UnifiedRunner` onto `window`.
 * Everything on `window.UnifiedRunner` is bundled using webpack.
 *
 * Creates Cypress instance, initializes various event buses to allow
 * for communication between driver, runner, reporter via event bus,
 * and server (via web socket).
 */
function setupRunner (namespace: AutomationElementId) {
  const mobxRunnerStore = getMobxRunnerStore()
  const runnerUiStore = useRunnerUiStore()

  getEventManager().addGlobalListeners(mobxRunnerStore, {
    randomString: runnerUiStore.randomString,
    element: `${namespace}-string`,
  })

  getEventManager().start(window.UnifiedRunner.config)

  const autStore = useAutStore()

  watchEffect(() => {
    autStore.viewportUpdateCallback?.()
  }, { flush: 'post' })

  _autIframeModel = new AutIframe(
    'Test Project',
    getEventManager(),
    window.UnifiedRunner._,
    window.UnifiedRunner.CypressJQuery,
    window.UnifiedRunner.logger,
    window.UnifiedRunner.dom,
    window.UnifiedRunner.visitFailure,
    getEventManager().studioRecorder,
    window.UnifiedRunner.blankContents,
  )

  createIframeModel()
}

/**
 * Get the URL for the spec. This is the URL of the AUT IFrame.
 * CT uses absolute URLs, and serves from the dev server.
 * E2E uses relative, serving from our internal server's spec controller.
 */
function getSpecUrl (namespace: string, specSrc: string) {
  return `/${namespace}/iframes/${specSrc}`
}

/**
 * Clean up the current Cypress instance and anything else prior to
 * running a new spec.
 * This should be called before you execute a spec,
 * or re-running the current spec.
 */
function teardownSpec () {
  useSnapshotStore().$reset()

  return getEventManager().teardown(getMobxRunnerStore())
}

let isTorndown = false

/**
 * Called when navigating away from the runner page.
 * This will teardown the reporter, event manager, and
 * any associated events.
 */
export async function teardown () {
  UnifiedReporterAPI.setInitializedReporter(false)
  _eventManager?.stop()
  _eventManager?.teardown(getMobxRunnerStore())
  await _eventManager?.resetReporter()
  _eventManager = undefined
  isTorndown = true
}

/**
 * Set up a spec by creating a fresh AUT and initializing
 * Cypress on it.
 *
 */
function runSpecCT (spec: SpecFile) {
  // TODO: figure out how to manage window.config.
  const config = window.UnifiedRunner.config

  // this is how the Cypress driver knows which spec to run.
  config.spec = setSpecForDriver(spec)

  // creates a new instance of the Cypress driver for this spec,
  // initializes a bunch of listeners
  // watches spec file for changes.
  getEventManager().setup(config)

  const $runnerRoot = getRunnerElement()

  // clear AUT, if there is one.
  empty($runnerRoot)

  // create root for new AUT
  const $container = document.createElement('div')

  $container.classList.add('screenshot-height-container')

  $runnerRoot.append($container)

  // create new AUT
  const autIframe = getAutIframeModel()
  const $autIframe: JQuery<HTMLIFrameElement> = autIframe.create().appendTo($container)

  const specSrc = getSpecUrl(config.namespace, spec.absolute)

  autIframe.showInitialBlankContents()
  $autIframe.prop('src', specSrc)

  // initialize Cypress (driver) with the AUT!
  getEventManager().initialize($autIframe, config)
}

/**
 * Create a Spec IFrame. Used for loading the spec to execute in E2E
 */
function createSpecIFrame (specSrc: string) {
  const el = document.createElement('iframe')

  el.id = `Your Spec: '${specSrc}'`,
  el.className = 'spec-iframe'

  return el
}

// this is how the Cypress driver knows which spec to run.
// we change name internally to be the relative path, and
// the `spec.name` property is now `spec.baseName`.
// but for backwards compatibility with the Cypress.spec API
// just assign `name` to be `baseName`.
function setSpecForDriver (spec: SpecFile) {
  return { ...spec, name: spec.baseName }
}

/**
 * Set up an E2E spec by creating a fresh AUT for the spec to evaluate under,
 * a Spec IFrame to load the spec's source code, and
 * initialize Cypress on the AUT.
 */
function runSpecE2E (spec: SpecFile) {
  // TODO: manage config with GraphQL, don't put it on window.
  const config = window.UnifiedRunner.config

  // this is how the Cypress driver knows which spec to run.
  config.spec = setSpecForDriver(spec)

  // creates a new instance of the Cypress driver for this spec,
  // initializes a bunch of listeners
  // watches spec file for changes.
  getEventManager().setup(config)

  const $runnerRoot = getRunnerElement()

  // clear AUT, if there is one.
  empty($runnerRoot)

  // create root for new AUT
  const $container = document.createElement('div')

  $container.classList.add('screenshot-height-container')

  $runnerRoot.append($container)

  // create new AUT
  const autIframe = getAutIframeModel()

  const $autIframe: JQuery<HTMLIFrameElement> = autIframe.create().appendTo($container)

  autIframe.showInitialBlankContents()

  // create Spec IFrame
  const specSrc = getSpecUrl(config.namespace, encodeURIComponent(spec.relative))

  const $specIframe = createSpecIFrame(specSrc)

  // append to document, so the iframe will execute the spec
  $container.appendChild($specIframe)

  $specIframe.src = specSrc

  // initialize Cypress (driver) with the AUT!
  getEventManager().initialize($autIframe, config)
}

/**
 * Inject the global `UnifiedRunner` via a <script src="..."> tag.
 * which includes the event manager and AutIframe constructor.
 * It is bundlded via webpack and consumed like a third party module.
 *
 * This only needs to happen once, prior to running the first spec.
 */
async function initialize () {
  isTorndown = false

  const config = JSON.parse(decodeBase64Unicode(window.__CYPRESS_CONFIG__.base64Config))

  await injectBundle(config.namespace)

  if (isTorndown) {
    return
  }

  const autStore = useAutStore()

  // TODO(lachlan): use GraphQL to get the viewport dimensions
  // once it is more practical to do so
  // find out if we need to continue managing viewportWidth/viewportHeight in MobX at all.
  autStore.updateDimensions(config.viewportWidth, config.viewportHeight)

  // just stick config on window until we figure out how we are
  // going to manage it
  window.UnifiedRunner.config = config

  // window.UnifiedRunner exists now, since the Webpack bundle with
  // the UnifiedRunner namespace was injected by `injectBundle`.
  initializeEventManager(window.UnifiedRunner)

  window.UnifiedRunner.MobX.runInAction(() => {
    const store = initializeMobxStore(window.UnifiedRunner.config.testingType)

    store.updateDimensions(config.viewportWidth, config.viewportHeight)
  })

  window.UnifiedRunner.MobX.runInAction(() => setupRunner(config.namespace))
}

/**
 * This wraps all of the required interactions to run a spec.
 * Here are the things that happen:
 *
 * 1. set the current spec in the store. The Reporter, Driver etc
 *    are all coupled to MobX tightly and require the MobX store containing
 *    the current spec.
 *
 * 2. Reset the Reporter. We use the same instance of the Reporter,
 *    but reset the internal state each time we run a spec.
 *
 * 3. Teardown spec. This does a few things, primaily stopping the current
 *    spec run, which involves stopping the driver and runner.
 *
 * 4. Force the Reporter to re-render with the new spec we are executed.
 *
 * 5. Setup the spec. This involves a few things, see the `runSpecCT` function's
 *    description for more information.
 */
async function executeSpec (spec: SpecFile) {
  await teardownSpec()

  const mobxRunnerStore = getMobxRunnerStore()

  mobxRunnerStore.setSpec(spec)

  await UnifiedReporterAPI.resetReporter()

  UnifiedReporterAPI.setupReporter()

  if (window.UnifiedRunner.config.testingType === 'e2e') {
    return runSpecE2E(spec)
  }

  if (window.UnifiedRunner.config.testingType === 'component') {
    return runSpecCT(spec)
  }

  throw Error('Unknown or undefined testingType on window.UnifiedRunner.config.testingType')
}

export const UnifiedRunnerAPI = {
  initialize,
  executeSpec,
  teardown,
}
