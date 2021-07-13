/**
 * This is the entry point for the script that gets injected into
 * the AUT on a secondary domain. It gets bundled on its own and injected
 * into the <head> of the AUT by `packages/proxy`.
 *
 * If adding to this bundle, try to keep it light and free of
 * dependencies.
 */

// TODO: uncomment the following code once the timing is worked out to have
// the sibling Cypress global available before this injection code runs

//  import { createTimers } from './timers'

//  const Cypress = window.Cypress = parent.Cypress

//  if (!Cypress) {
//    throw new Error('Something went terribly wrong and we cannot proceed. We expected to find the global Cypress in the parent window but it is missing!. This should never happen and likely is a bug. Please open an issue!')
//  }

//  // We wrap timers in the injection code because if we do it in the driver (like
//  // we used to do), any uncaught errors thrown in the timer callbacks would
//  // get picked up by the top frame's 'error' handler instead of the AUT's.
//  // We need to wrap the timer callbacks in the AUT itself for errors to
//  // propagate properly.
//  const timers = createTimers()

//  Cypress.removeAllListeners('app:timers:reset')
//  Cypress.removeAllListeners('app:timers:pause')

//  Cypress.on('app:timers:reset', timers.reset)
//  Cypress.on('app:timers:pause', timers.pause)

//  timers.wrap()

// TODO: don't hard-code the index. need it to be predictable or need
// to search for the right one somehow. will need to be fixed when we
// test out visiting a 3rd domain
const cyBridgeFrame = window.parent.frames[2]

cyBridgeFrame.__onBeforeAppWindowLoad(window)
