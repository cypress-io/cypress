/// <reference types="../index" />

/**
 * There are several primary "phases" involved in running a spec. They are
 * - Teardown Phase
 * - Run Phase
 *
 * Before running a spec, you need to do a one-time setup (Setup phase)
 *
 * Setup Phase involves:
 *   Setting up a lot of event buses. window.eventManager.addGlobalListeners does all of this.
 *
 * Run Phase involves:
 *   - Two distinct "sub" phases, you need to do them all.
 *     - Initialize (create Cypress instance (aka Driver), add event listeners, etc...)
 *     - Execute (actually run the spec)
 *   - "Initialize" is only once per **spec**. So if you re-run a spec many times, you just do it once.
 *   - "Execute" is for each time you run the spec.
 *
 * +================+
 * | Running a Spec |
 * +================+
 *
 * `window.eventManager` wraps most of the functionality for you, so if you are
 * implementing a Cypress UI, you'll primarily use the eventMananger.
 *
 * You will always do teardown -> run in this order, even if it's the first spec run.
 *
 * Teardown involves:
 *
 * 1. Cleanup the Driver.
 *
 * Cypress.stop(). This is the bulk of teardown. This will stop the driver, which is basically:
 *   - cy.stop()  (clear current command queue, etc
 *   - runner.stop() (stop the actual run)
 *       - Note, it is not **destroying** the driver. Just cleaning it up. We can re-use it for the next run
 *         of this same spec. We create a new one per **spec**, not per run.
 *
 * 2. Cleanup the Reporter
 *   - this is handled by emitting reporter:restart:test:run via the reporterBus
 *   - cleans up the Reporter by resetting the internal stores, which are managed with MobX (app, runnables, stats, etc)
 *
 * 3. Various other cleanup
 *   - these will change over time as we add/change features,
 *   - unlike the above two, which are basically set in stone.
 *   - examples would be:
 *     - tearing down the current Studio session,
 *     - closing modal(s)
 *     - resetting plugins
 *
 * 4. window.Cypress.removeAllListeners
 *   - window.Cypress (aka Driver) is an event emitter, we want to
 *   - remove all the events it is subscribed as part of teardown.
 *
 * 5. eventManager.emit('restart')
 *   - tell the event manager we are done with cleanup, and to proceed to the next run ("Setup phase")
 *
 * Now comes the "run" phase. You'll probably want to write a function that does all these things,
 * then subscribe to eventManager.on('restart'), and call your function.
 *
 * Run involves:
 *
 * 1. eventManager.setup()
 *   - this creates a new instance of the Driver (via Cypress.create) if it doesn't exist
 *   - setup event listeneres on the Driver instance
 *   - set up server side event + watcher current spec file
 *
 * 2. Clear AUT
 *   - Clear current AUT if it exists. We want a new AUT for each spec.
 *
 * 3. Create AUT
 *   - Create a new AUT, and set the url to be the current spec.
 *
 * 4. eventManager.initialize(aut)
 *   - This initializes the Cypress instance (aka Driver) that was created in step 1.
 *   - Pass in a reference to the AUT. and a callback, `onSpecReady`,
 *   - which the Driver will call when it's ready.
 *   - This then starts the reporter via an event, reporter:start, and calls Cypress.run, which executes the spec.
 *
 */

import { store, Store } from './store'
import { injectRunner } from './runner/renderRunner'
import type { SpecFile } from '@packages/types/src/spec'
import { renderReporter, unmountReporter } from './runner/renderReporter'

function getRunnerElement () {
  const el = document.querySelector<HTMLElement>('#unified-runner')

  if (!el) {
    throw Error('Expected element with #unified-runner but did not find it.')
  }

  return el
}

export function getReporterElement () {
  const el = document.querySelector<HTMLElement>('#unified-reporter')

  if (!el) {
    throw Error('Expected element with #unified-reporter but did not find it.')
  }

  return el
}

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
 * so passed as a callback to `renderRunner`, which injects `UnifiedRunner`
 * onto `window`.
 */
function setupRunner () {
  window.UnifiedRunner.eventManager.addGlobalListeners(store, {
    automationElement: '__cypress-string',
    randomString,
  })
}

export function setupReporter () {
  // Teardown reporter. Ideally we should reuse the existing reporter,
  // I am having trouble getting it to update, since it relies on React and props changing.
  const $reporterRoot = getReporterElement()

  renderReporter($reporterRoot, store, window.UnifiedRunner.eventManager)
}

/**
 * Get the URL for the spec. This is the URL of the AUT IFrame.
 */
export function getSpecUrl (namespace: string, spec: SpecFile, prefix = '') {
  return spec ? `${prefix}/${namespace}/iframes/${spec.absolute}` : ''
}

/**
 * Clean up the current Cypress instance and anything else prior to
 * running a new spec.
 * This should be called before you execute a spec,
 * or re-running the current spec.
 */
export function teardownSpec (store: Store) {
  // @ts-ignore
  const UnifiedRunner = window.UnifiedRunner as UnifiedRunner

  return UnifiedRunner.eventManager.teardown(store)
}

/**
 * Set up a spec by creating a fresh AUT and initializing
 * Cypress on it.
 */
export function setupSpec (spec: SpecFile) {
  // @ts-ignore - TODO: figure out how to manage window.config.
  const config = window.config

  // this is how the Cypress driver knows which spec to run.
  config.spec = spec

  // @ts-ignore
  const UnifiedRunner = window.UnifiedRunner as UnifiedRunner

  UnifiedRunner.eventManager.setup(config)

  const $runnerRoot = getRunnerElement()

  // clear AUT, if there is one.
  empty($runnerRoot)

  // create root for new AUT
  const $container = document.createElement('div')

  $runnerRoot.append($container)

  // create new AUT
  const autIframe = new UnifiedRunner.AutIframe('Test Project')
  const $autIframe: JQuery<HTMLIFrameElement> = autIframe.create().appendTo($container)

  autIframe.showInitialBlankContents()
  $autIframe.prop('src', getSpecUrl(config.namespace, spec))

  // initialize Cypress (driver) with the AUT!
  UnifiedRunner.eventManager.initialize($autIframe, config)
}

/**
 * Inject the global `UnifiedRunner` via a <script src="..."> tag.
 * which includes the event manager and AutIframe constructor.
 * It is bundlded via webpack and consumed like a third party module.
 *
 * This only needs to happen once, prior to running the first spec.
 */
export function initialize () {
  injectRunner(setupRunner)
}

let hasInitializeReporter = false

export const executeSpec = async (spec: SpecFile) => {
  store.setSpec(spec)

  await unmountReporter()

  if (hasInitializeReporter) {
    await window.UnifiedRunner.eventManager.teardownReporter()
  }

  await teardownSpec(store)

  setupReporter()
  hasInitializeReporter = true

  return setupSpec(spec)
}
