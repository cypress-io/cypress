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
import { getMobxRunnerStore } from '../store'
import { injectBundle } from './injectBundle'
import type { BaseSpec } from '@packages/types/src/spec'
import { UnifiedReporterAPI } from './reporter'
import { getRunnerElement, empty } from './utils'
import { AutSnapshot, IframeModel } from './iframe-model'
import { AutIframe } from './aut-iframe'

const randomString = `${Math.random()}`

let _autIframeModel: any

/**
 * Creates an instance of an AutIframe model which ise used to control
 * various things like snapshots, and the lifecycle of the underlying
 * AUT <iframe> element
 *
 * This only needs to be created once per **spec**. If you change spec,
 * you need to create a new AUT IFrame model.
 */
function getAutIframeModel () {
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
  const state = getMobxRunnerStore()

  const toggleSnapshotHighlights = window.UnifiedRunner.MobX.runInAction(() => {
    return (snapshotProps: AutSnapshot) => {
      if (!state.snapshot) {
        return
      }

      state.setShowSnapshotHighlight(!state.snapshot.showingHighlights)

      if (state.snapshot.showingHighlights) {
        const snapshot = snapshotProps.snapshots[state.snapshot.stateIndex]

        autIframe.highlightEl(snapshot, snapshotProps)
      } else {
        autIframe.removeHighlights()
      }
    }
  })

  const changeSnapshotState = window.UnifiedRunner.MobX.runInAction(() => {
    return (snapshotProps: AutSnapshot, index: number) => {
      const snapshot = snapshotProps.snapshots[index]

      state.setSnapshotIndex(index)
      autIframe.restoreDom(snapshot)

      if (state.snapshot?.showingHighlights && snapshotProps.$el) {
        autIframe.highlightEl(snapshot, snapshotProps)
      } else {
        autIframe.removeHighlights()
      }
    }
  })

  const autIframe = getAutIframeModel()
  // IFrame Model to manage snapshots, etc.
  const iframeModel = new IframeModel(
    getMobxRunnerStore(),
    autIframe.detachDom,
    autIframe.restoreDom,
    autIframe.highlightEl,
    window.UnifiedRunner.eventManager,
    (snapshotProps: AutSnapshot) => {
      return window.UnifiedRunner.React.createElement(
        window.UnifiedRunner.SnapshotControls,
        {
          snapshotProps,
          state,
          eventManager: window.UnifiedRunner.eventManager,
          onToggleHighlights: toggleSnapshotHighlights,
          onStateChange: changeSnapshotState,
        },
      )
    },

    window.UnifiedRunner.MobX,
    {
      recorder: window.UnifiedRunner.studioRecorder,
      selectorPlaygroundModel: window.UnifiedRunner.selectorPlaygroundModel,
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

  window.UnifiedRunner.eventManager.addGlobalListeners(mobxRunnerStore, {
    automationElement: '__cypress-string',
    randomString,
  })

  window.UnifiedRunner.eventManager.start(window.UnifiedRunner.config)

  window.UnifiedRunner.MobX.reaction(
    () => [mobxRunnerStore.height, mobxRunnerStore.width],
    () => {
      mobxRunnerStore.viewportUpdateCallback?.()
    },
  )

  _autIframeModel = new AutIframe(
    'Test Project',
    window.UnifiedRunner.eventManager,
    window.UnifiedRunner._,
    window.UnifiedRunner.CypressJQuery,
    window.UnifiedRunner.logger,
    window.UnifiedRunner.dom,
    window.UnifiedRunner.visitFailure,
    {
      recorder: window.UnifiedRunner.studioRecorder,
      selectorPlaygroundModel: window.UnifiedRunner.selectorPlaygroundModel,
    },
    window.UnifiedRunner.blankContents,
  )

  createIframeModel()
}

/**
 * Get the URL for the spec. This is the URL of the AUT IFrame.
 */
function getSpecUrl (namespace: string, spec: BaseSpec, prefix = '') {
  return spec ? `${prefix}/${namespace}/iframes/${spec.absolute}` : ''
}

/**
 * Clean up the current Cypress instance and anything else prior to
 * running a new spec.
 * This should be called before you execute a spec,
 * or re-running the current spec.
 */
function teardownSpec () {
  return window.UnifiedRunner.eventManager.teardown(getMobxRunnerStore())
}

/**
 * Set up a spec by creating a fresh AUT and initializing
 * Cypress on it.
 *
 */
function runSpecCT (spec: BaseSpec) {
  // TODO: figure out how to manage window.config.
  const config = window.UnifiedRunner.config

  // this is how the Cypress driver knows which spec to run.
  config.spec = spec

  // creates a new instance of the Cypress driver for this spec,
  // initializes a bunch of listeners
  // watches spec file for changes.
  window.UnifiedRunner.eventManager.setup(config)

  const $runnerRoot = getRunnerElement()

  // clear AUT, if there is one.
  empty($runnerRoot)

  // create root for new AUT
  const $container = document.createElement('div')

  $runnerRoot.append($container)

  // create new AUT
  const autIframe = getAutIframeModel()
  const $autIframe: JQuery<HTMLIFrameElement> = autIframe.create().appendTo($container)
  const specSrc = getSpecUrl(config.namespace, spec)

  autIframe.showInitialBlankContents()
  $autIframe.prop('src', specSrc)

  // initialize Cypress (driver) with the AUT!
  window.UnifiedRunner.eventManager.initialize($autIframe, config)
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

/**
 * Set up an E2E spec by creating a fresh AUT for the spec to evaluate under,
 * a Spec IFrame to load the spec's source code, and
 * initialize Cypress on the AUT.
 */
function runSpecE2E (spec: BaseSpec) {
  // TODO: manage config with GraphQL, don't put it on window.
  const config = window.UnifiedRunner.config

  // this is how the Cypress driver knows which spec to run.
  config.spec = spec

  // creates a new instance of the Cypress driver for this spec,
  // initializes a bunch of listeners
  // watches spec file for changes.
  window.UnifiedRunner.eventManager.setup(config)

  const $runnerRoot = getRunnerElement()

  // clear AUT, if there is one.
  empty($runnerRoot)

  // create root for new AUT
  const $container = document.createElement('div')

  $runnerRoot.append($container)

  // create new AUT
  const autIframe = getAutIframeModel()

  autIframe.showInitialBlankContents()
  const $autIframe: JQuery<HTMLIFrameElement> = autIframe.create().appendTo($container)

  // create Spec IFrame
  const specSrc = getSpecUrl(config.namespace, spec)
  const $specIframe = createSpecIFrame(specSrc)

  // append to document, so the iframe will execute the spec
  $container.appendChild($specIframe)

  $specIframe.src = specSrc

  // initialize Cypress (driver) with the AUT!
  window.UnifiedRunner.eventManager.initialize($autIframe, config)
}

/**
 * Inject the global `UnifiedRunner` via a <script src="..."> tag.
 * which includes the event manager and AutIframe constructor.
 * It is bundlded via webpack and consumed like a third party module.
 *
 * This only needs to happen once, prior to running the first spec.
 */
async function initialize () {
  await injectBundle()
  window.UnifiedRunner.MobX.runInAction(() => setupRunner())
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
async function executeSpec (spec: BaseSpec) {
  const mobxRunnerStore = getMobxRunnerStore()

  mobxRunnerStore.setSpec(spec)

  await UnifiedReporterAPI.resetReporter()

  await teardownSpec()
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
}
