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
import { store, Store } from '../store'
import { injectBundle } from './injectBundle'
import type { SpecFile } from '@packages/types/src/spec'
import { UnifiedReporterAPI } from './reporter'
import { getRunnerElement } from './utils'

function empty (el: HTMLElement) {
  while (el.lastChild) {
    if (el && el.firstChild) {
      el.removeChild(el.firstChild)
    }
  }
}

const randomString = `${Math.random()}`

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
  window.UnifiedRunner.eventManager.addGlobalListeners(store, {
    automationElement: '__cypress-string',
    randomString,
  })
}

/**
 * Get the URL for the spec. This is the URL of the AUT IFrame.
 */
function getSpecUrl (namespace: string, spec: SpecFile, prefix = '') {
  return `/__cypress/iframes/integration/basic.spec.ts`
  return spec ? `${prefix}/${namespace}/iframes/${spec.absolute}` : ''
}

/**
 * Clean up the current Cypress instance and anything else prior to
 * running a new spec.
 * This should be called before you execute a spec,
 * or re-running the current spec.
 */
function teardownSpec (store: Store) {
  return window.UnifiedRunner.eventManager.teardown(store)
}

/**
 * Set up an E2E spec by creating a fresh AUT for the spec to evaluate under,
 * a Spec IFrame to load the spec's source code, and
 * initialize Cypress on the AUT.
 */
function setupSpecE2E (spec: SpecFile) {
  // @ts-ignore - TODO: figure out how to manage window.config.
  const config = window.config

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
  const autIframe = new window.UnifiedRunner.AutIframe('Test Project')
  autIframe.showInitialBlankContents()
  const $autIframe: JQuery<HTMLIFrameElement> = autIframe.create().appendTo($container)

  // create Spec IFrame
  const specSrc = getSpecUrl(config.namespace, spec)
  const $specIframe = createSpecIFrame(specSrc)

  console.log(`$specIframe: ${specSrc}, $aut ${$autIframe.prop('src')}`)
  const { protocol, host, port } = document.location
  console.log({protocol, host, port})

  // append to document, so the iframe will execute the spec
  $container.appendChild($specIframe)

  $specIframe.src = specSrc

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
 * Set up a CT spec by creating a fresh AUT with the URL pointing
 * to the dev server, and initializing Cypress on the AUT.
 */
function setupSpecCT (spec: SpecFile) {
  // @ts-ignore - TODO: figure out how to manage window.config.
  const config = window.config

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
  const autIframe = new window.UnifiedRunner.AutIframe('Test Project')
  const $autIframe: JQuery<HTMLIFrameElement> = autIframe.create().appendTo($container)

  autIframe.showInitialBlankContents()
  $autIframe.prop('src', getSpecUrl(config.namespace, spec))

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
function initialize () {
  injectBundle(setupRunner)
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
 * 5. Setup the spec. This involves a few things, see the `setupSpecCT` function's
 *    description for more information.
 */
async function executeSpec (spec: SpecFile) {
  store.setSpec(spec)

  await UnifiedReporterAPI.resetReporter()

  await teardownSpec(store)

  UnifiedReporterAPI.setupReporter()

  return setupSpecE2E(spec)
  // return setupSpecCT(spec)
}

export const UnifiedRunnerAPI = {
  initialize,
  executeSpec,
}
