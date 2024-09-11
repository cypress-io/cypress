/// <reference types="../../index" />

/**
 * This is the seam between the new "unified app", built with
 * Vite and Vue.
 * It consumes some older code, including:
 * - driver
 * - reporter
 * which are built with React and bundle with webpack.
 *
 * The entry point for the webpack bundle is `runner/main.tsx`.
 * Any time you need to consume some existing code, add it to the `window.UnifiedRunner`
 * namespace there, and access it with `window.UnifiedRunner`.
 *
 */
import { watchEffect } from 'vue'
import { getMobxRunnerStore, initializeMobxStore, useAutStore, useRunnerUiStore } from '../store'
import { dfd } from './injectBundle'
import type { SpecFile } from '@packages/types/src/spec'
import { UnifiedReporterAPI } from './reporter'
import { getRunnerElement, empty } from './utils'
import { IframeModel } from './iframe-model'
import { AutIframe } from './aut-iframe'
import { EventManager } from './event-manager'
import { createWebsocket as createWebsocketIo } from '@packages/socket/lib/browser'
import type { AutomationElementId } from '@packages/types'
import { useSnapshotStore } from './snapshot-store'
import { useStudioStore } from '../store/studio-store'
import { getRunnerConfigFromWindow } from './get-runner-config-from-window'

let _eventManager: EventManager | undefined

export function createWebsocket (config: Cypress.Config) {
  const ws = createWebsocketIo({ path: config.socketIoRoute, browserFamily: config.browser.family })

  ws.on('connect', () => {
    ws.emit('runner:connected')
  })

  ws.on('change:to:url', (url) => {
    window.location.href = url
  })

  return ws
}

export function initializeEventManager (UnifiedRunner: any) {
  if (!window.ws) {
    throw Error('Need window.ws to exist before initializing event manager')
  }

  _eventManager = new EventManager(
    UnifiedRunner.CypressDriver,
    UnifiedRunner.MobX,
    UnifiedRunner.selectorPlaygroundModel,
    window.ws,
  )
}

export function getEventManager () {
  if (!_eventManager) {
    throw Error(`eventManager is undefined. Make sure you call initializeEventManager before attempting to access it.`)
  }

  return _eventManager
}

window.getEventManager = getEventManager

let _autIframeModel: AutIframe | null

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
    autIframe.doesAUTMatchTopSuperDomainOrigin,
    getEventManager(),
    {
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
function setupRunner () {
  const mobxRunnerStore = getMobxRunnerStore()
  const runnerUiStore = useRunnerUiStore()
  const config = getRunnerConfigFromWindow()

  getEventManager().addGlobalListeners(mobxRunnerStore, {
    randomString: runnerUiStore.randomString,
    element: getAutomationElementId(),
  })

  getEventManager().start(config)

  const autStore = useAutStore()
  const studioStore = useStudioStore()

  watchEffect(() => {
    autStore.viewportUpdateCallback?.()
  }, { flush: 'post' })

  watchEffect(() => {
    window.UnifiedRunner.MobX.runInAction(() => {
      mobxRunnerStore.setCanSaveStudioLogs(studioStore.logs.length > 0)
    })
  })

  _autIframeModel = new AutIframe(
    'Test Project',
    getEventManager(),
    window.UnifiedRunner.CypressJQuery,
  )

  createIframeModel()
}

interface GetSpecUrlOptions {
  browserFamily?: string
  namespace: string
  specSrc: string
}

/**
 * Get the URL for the spec. This is the URL of the AUT IFrame.
 * CT uses absolute URLs, and serves from the dev server.
 * E2E uses relative, serving from our internal server's spec controller.
 */
function getSpecUrl ({ browserFamily, namespace, specSrc }: GetSpecUrlOptions) {
  let url = `/${namespace}/iframes/${specSrc}`

  if (browserFamily) {
    url += `?browserFamily=${browserFamily}`
  }

  return url
}

/**
 * Clean up the current Cypress instance and anything else prior to
 * running a new spec.
 * This should be called before you execute a spec,
 * or re-running the current spec.
 */
function teardownSpec (isRerun: boolean = false) {
  useSnapshotStore().$reset()

  return getEventManager().teardown(getMobxRunnerStore(), isRerun)
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
 * Add a cross origin iframe for cy.origin support
 */
export function addCrossOriginIframe (location) {
  const id = `Spec Bridge: ${location.origin}`

  // if it already exists, don't add another one
  if (document.getElementById(id)) {
    getEventManager().notifyCrossOriginBridgeReady(location.origin)

    return
  }

  const config = getRunnerConfigFromWindow()

  addIframe({
    id,
    // the cross origin iframe is added to the document body instead of the
    // container since it needs to match the size of the top window for screenshots
    $container: document.body,
    className: 'spec-bridge-iframe',
    src: `${location.origin}/${config.namespace}/spec-bridge-iframes?browserFamily=${config.browser.family}`,
  })
}

/**
 * Set up a spec by creating a fresh AUT and initializing
 * Cypress on it.
 *
 */
function runSpecCT (config, spec: SpecFile) {
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

  // the iframe controller will forward the specpath via header to the devserver.
  // using a query parameter allows us to recognize relative requests and proxy them to the devserver.
  const specIndexUrl = `index.html?specPath=${encodeURI(spec.absolute)}`

  const specSrc = getSpecUrl({
    namespace: config.namespace,
    specSrc: specIndexUrl,
  })

  autIframe._showInitialBlankPage()
  $autIframe.prop('src', specSrc)

  // initialize Cypress (driver) with the AUT!
  getEventManager().initialize($autIframe, config)
}

/**
 * Create an IFrame. If the Iframe is the spec iframe,
 * this function is used for loading the spec to execute in E2E
 */
function addIframe ({ $container, id, src, className }) {
  const $addedIframe = document.createElement('iframe')

  $addedIframe.id = id,
  $addedIframe.className = className

  $container.appendChild($addedIframe)
  $addedIframe.setAttribute('src', src)
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
function runSpecE2E (config, spec: SpecFile) {
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

  // Remove the spec bridge iframe
  document.querySelectorAll('iframe.spec-bridge-iframe').forEach((el) => {
    el.remove()
  })

  autIframe.visitBlankPage()

  // create Spec IFrame
  const specSrc = getSpecUrl({
    browserFamily: config.browser.family,
    namespace: config.namespace,
    specSrc: encodeURIComponent(spec.relative),
  })

  // FIXME: BILL Determine where to call client with to force browser repaint
  /**
   * call the clientWidth to force the browser to repaint for viewport changes
   * otherwise firefox may fail when changing the viewport in between origins
   * this.refs.container.clientWidth
   */

  // append to document, so the iframe will execute the spec
  addIframe({
    $container,
    src: specSrc,
    id: `Your Spec: '${specSrc}'`,
    className: 'spec-iframe',
  })

  // initialize Cypress (driver) with the AUT!
  getEventManager().initialize($autIframe, config)
}

/**
 * Inject the global `UnifiedRunner` via a <script src="..."> tag.
 * which includes the event manager and AutIframe constructor.
 * It is bundled via webpack and consumed like a third party module.
 *
 * This only needs to happen once, prior to running the first spec.
 */
async function initialize () {
  await dfd.promise

  isTorndown = false

  const config = getRunnerConfigFromWindow()

  if (isTorndown) {
    return
  }

  // Reset stores
  const autStore = useAutStore()

  autStore.$reset()

  const studioStore = useStudioStore()

  studioStore.cancel()

  // TODO(lachlan): UNIFY-1318 - use GraphQL to get the viewport dimensions
  // once it is more practical to do so
  // find out if we need to continue managing viewportWidth/viewportHeight in MobX at all.
  autStore.updateDimensions(config.viewportWidth, config.viewportHeight)

  // window.UnifiedRunner exists now, since the Webpack bundle with
  // the UnifiedRunner namespace was injected by `injectBundle`.
  initializeEventManager(window.UnifiedRunner)

  window.UnifiedRunner.MobX.runInAction(() => {
    const store = initializeMobxStore(window.__CYPRESS_TESTING_TYPE__)

    store.updateDimensions(config.viewportWidth, config.viewportHeight)
  })

  window.UnifiedRunner.MobX.runInAction(() => setupRunner())
}

async function updateDevServerWithSpec (spec: SpecFile) {
  return new Promise<void>((resolve, _reject) => {
    // currently, we don't have criteria to reject the promise
    // as the dev-server can take a long time to compile, which is variable per user.
    Cypress.once('dev-server:on-spec-updated', () => {
      resolve()
    })

    Cypress.emit('dev-server:on-spec-update', spec)
  })
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
 * 3. Teardown spec. This does a few things, primarily stopping the current
 *    spec run, which involves stopping the driver and runner.
 *
 * 4. Force the Reporter to re-render with the new spec we are executed.
 *
 * 5. Setup the spec. This involves a few things, see the `runSpecCT` function's
 *    description for more information.
 */
async function executeSpec (spec: SpecFile, isRerun: boolean = false) {
  await teardownSpec(isRerun)

  const mobxRunnerStore = getMobxRunnerStore()

  mobxRunnerStore.setSpec(spec)

  await UnifiedReporterAPI.resetReporter()

  UnifiedReporterAPI.setupReporter()

  // TODO: UNIFY-1318 - figure out how to manage window.config.
  const config = getRunnerConfigFromWindow()

  // this is how the Cypress driver knows which spec to run.
  config.spec = setSpecForDriver(spec)

  // creates a new instance of the Cypress driver for this spec,
  // initializes a bunch of listeners watches spec file for changes.
  await getEventManager().setup(config)

  if (window.__CYPRESS_TESTING_TYPE__ === 'e2e') {
    return runSpecE2E(config, spec)
  }

  if (window.__CYPRESS_TESTING_TYPE__ === 'component') {
    if (config.experimentalJustInTimeCompile && !config.isTextTerminal) {
      // If running with experimentalJustInTimeCompile enabled and in open mode,
      // send a signal to the dev server to load the spec before running
      // since the spec and related resources are not yet compiled.
      await updateDevServerWithSpec(spec)
    }

    return runSpecCT(config, spec)
  }

  throw Error('Unknown or undefined testingType on window.__CYPRESS_TESTING_TYPE__')
}

function getAutomationElementId (): AutomationElementId {
  return `${window.__CYPRESS_CONFIG__.namespace}-string`
}

export const UnifiedRunnerAPI = {
  initialize,
  executeSpec,
  teardown,
  getAutomationElementId,
}
