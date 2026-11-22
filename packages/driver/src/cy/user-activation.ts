import Debug from 'debug'
import type { BeforeUnloadDialogAcceptedParams } from '@packages/types'
import type { ICypress } from '../cypress'
import type { $Cy } from '../cypress/cy'

const debug = Debug('cypress:driver:user-activation')

// An activation that hasn't answered by now is not going to, and the page load
// must not wait on it any longer.
const ACTIVATION_TIMEOUT_MS = 2000

// what activating the AUT needs from Cypress
interface ActivationHost {
  config: (key: 'userActivation') => unknown
  isBrowser: (matcher: 'webkit') => boolean
  automation: (eventName: 'activate:aut:frame', data: Record<string, never>) => Promise<unknown>
}

const isEnabled = (Cypress: ActivationHost) => !!Cypress.config('userActivation') && !Cypress.isBrowser('webkit')

// The browser notifies activation as a real user's click or key press would: the
// AUT gains sticky activation and, for a few seconds, transient activation. No
// input event reaches the application. Resolves `false` when the browser didn't
// activate the AUT in time.
const activate = async (Cypress: ActivationHost): Promise<boolean> => {
  let timeout: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      Cypress.automation('activate:aut:frame', {}).then(() => true),
      new Promise<boolean>((resolve) => {
        timeout = setTimeout(() => resolve(false), ACTIVATION_TIMEOUT_MS)
      }),
    ])
  } catch (err) {
    debug('failed to activate the AUT: %o', err)

    return false
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

// Renewing at least this often leaves an app most of the few seconds that transient
// activation lasts, even when actionability retries or typing go on for a while.
const RENEWAL_INTERVAL_MS = 1000

// Gives the AUT the transient activation a real click or key press gives it, which
// APIs like `requestFullscreen()` and `showPicker()` need when the app calls them
// from an event handler, including after awaiting something there. A real click or
// key press always starts a fresh activation, so a command renews it before it
// fires its first events, and again once a second has passed.
//
// Returns the function to call before each attempt or key. It returns nothing when
// there is nothing to renew, so the caller can stay synchronous. After a renewal
// fails, it stops trying for the rest of the command, which would otherwise wait on
// the browser before every retry.
export const createTransientActivationRenewer = (Cypress: ActivationHost, { justRenewed = false } = {}) => {
  let renewedAt = justRenewed ? Date.now() : undefined
  let failed = false

  return (): Promise<void> | undefined => {
    if (failed || !isEnabled(Cypress)) {
      return
    }

    if (renewedAt !== undefined && Date.now() - renewedAt < RENEWAL_INTERVAL_MS) {
      return
    }

    renewedAt = Date.now()

    return activate(Cypress).then((activated) => {
      failed = !activated
    })
  }
}

// An AUT document that loaded before Cypress began listening for its load event,
// which is how a component testing spec's page usually loads. One that is still
// loading is activated when its load event fires instead.
let documentLoadedEarly: Document | undefined

export const deferActivationOfLoadedAut = (autWindow: Window | undefined) => {
  try {
    documentLoadedEarly = autWindow?.document.readyState === 'complete' ? autWindow.document : undefined
  } catch {
    documentLoadedEarly = undefined
  }
}

// Activates the document that loaded early once a test that wants activation starts,
// because a suite's or test's `userActivation` only applies from then on. Once the
// AUT has moved to another document, that document's load event activates it.
export const activateAutLoadedEarly = async (Cypress: ICypress, autWindow: Window | undefined) => {
  if (!documentLoadedEarly || !isEnabled(Cypress)) {
    return
  }

  let isSameDocument = false

  try {
    isSameDocument = autWindow?.document === documentLoadedEarly
  } catch {
    // a cross-origin AUT is a different document from the one that loaded early
  }

  documentLoadedEarly = undefined

  if (isSameDocument) {
    await activateAut(Cypress, autWindow)
  }
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
