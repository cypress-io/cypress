/**
 * The eventManager and driver are bundled separately
 * by webpack. We cannot import them because of
 * circular dependencies.
 * To work around this, we build the driver, eventManager
 * and some other dependencies using webpack, and consumed the dist'd
 * source code.
 * 
 * This is attached to `window` under the `UnifiedRunner` namespace.
 */
interface Window {
  UnifiedRunner: {
    /**
     * decode config, which we receive as a base64 string
     * This comes from Driver.utils
     */
    decodeBase64: (base64: string) => Record<string, unknown>

    /**
     * Proxy event to the reporter via `Reporter.defaultEvents.emit`
     */
    emit (evt: string, ...args: unknown[]): void

    /**
     * This is the eventManager which orchestrates all the communication
     * between the reporter, driver, and server, as well as handle
     * setup, teardown and running of specs.
     * 
     * It's only used on the "Runner" part of the unified runner.
     */
    eventManager: any
  }
}

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