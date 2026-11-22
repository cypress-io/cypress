import Debug from 'debug'
import type { BeforeUnloadDialogAcceptedParams } from '@packages/types'
import type { ICypress } from '../cypress'
import type { $Cy } from '../cypress/cy'

const debug = Debug('cypress:driver:user-activation')

// An activation that hasn't answered by now is not going to, and the page load
// must not wait on it any longer.
const ACTIVATION_TIMEOUT_MS = 2000

const isEnabled = (Cypress: ICypress) => Cypress.config('userActivation') && !Cypress.isBrowser('webkit')

// The browser notifies activation as a real user's click or key press would: the
// AUT gains sticky activation and, for a few seconds, transient activation. No
// input event reaches the application.
const activate = async (Cypress: ICypress) => {
  let timeout: ReturnType<typeof setTimeout> | undefined

  try {
    await Promise.race([
      Cypress.automation('activate:aut:frame', {}),
      new Promise((resolve) => {
        timeout = setTimeout(resolve, ACTIVATION_TIMEOUT_MS)
      }),
    ])
  } catch (err) {
    debug('failed to activate the AUT: %o', err)
  } finally {
    clearTimeout(timeout)
  }
}

// Gives the AUT document sticky user activation, so it behaves as it would once a
// real user had interacted with it. Activation belongs to a document, so this runs
// after every AUT page load.
export const activateAut = async (Cypress: ICypress, autWindow: Window | undefined) => {
  if (!isEnabled(Cypress)) {
    return
  }

  try {
    // about:blank is what the AUT shows between tests, not the application
    if (autWindow?.location.href === 'about:blank') {
      return
    }
  } catch {
    // a cross-origin AUT can't be read from here, and still needs activating
  }

  await activate(Cypress)
}

// Gives the AUT the transient activation a real click or key press gives it, which
// APIs like `requestFullscreen()` and `showPicker()` need when the app calls them
// from the event handler. Transient activation lasts a few seconds and some APIs use
// it up, so action commands renew it just before they fire their events. Returns
// nothing when there is nothing to renew, so the caller can stay synchronous.
export const renewTransientActivation = (Cypress: ICypress, win: Window | null | undefined): Promise<void> | undefined => {
  if (!isEnabled(Cypress)) {
    return
  }

  try {
    if (win?.navigator.userActivation?.isActive) {
      return
    }
  } catch {
    // a window that can't be read is renewed all the same
  }

  return activate(Cypress)
}

// Activates an AUT document that loaded before Cypress began listening for its
// load event. One that is still loading is activated when its load event fires.
export const activateLoadedAut = async (Cypress: ICypress, autWindow: Window | undefined) => {
  try {
    if (autWindow?.document.readyState !== 'complete') {
      return
    }
  } catch {
    return
  }

  await activateAut(Cypress, autWindow)
}

export const logBeforeUnloadDialogAccepted = (Cypress: ICypress, cy: $Cy, data: BeforeUnloadDialogAcceptedParams) => {
  // The AUT is navigated to about:blank between tests, when there is no test to log to.
  if (!cy.state('runnable') || !cy.state('duringUserTestExecution')) {
    return
  }

  Cypress.log({
    name: 'beforeunload',
    message: 'accepted the "Leave site?" dialog',
    event: true,
    snapshot: false,
    consoleProps () {
      return {
        Note: 'The application has a `beforeunload` handler that asks the user to confirm leaving the page. Cypress accepted the dialog so the navigation could continue. Set `userActivation: false` to test the page before anyone interacts with it, when browsers do not show this dialog.',
        ...(data.url ? { URL: data.url } : {}),
        ...(data.message ? { Message: data.message } : {}),
      }
    },
  })
}
