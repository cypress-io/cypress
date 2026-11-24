import Debug from 'debug'
import type { BeforeUnloadDialogAcceptedParams } from '@packages/types'
import type { ICypress } from '../cypress'
import type { $Cy } from '../cypress/cy'

const debug = Debug('cypress:driver:user-activation')

// An activation that hasn't answered by now is not going to, and the page load
// must not wait on it any longer.
const ACTIVATION_TIMEOUT_MS = 2000

// A command's activation counts against the command's timeout, so it gets less time.
const RENEWAL_TIMEOUT_MS = 500

// only the parts of Cypress that activating the AUT uses, so a unit test can supply them
interface ActivationHost {
  config: (key: 'userActivation') => unknown
  isBrowser: (matcher: 'webkit' | 'firefox') => boolean
  automation: (eventName: 'activate:aut:frame', data: Record<string, never>) => Promise<unknown>
}

const isEnabled = (Cypress: ActivationHost) => !!Cypress.config('userActivation') && !Cypress.isBrowser('webkit')

// What Cypress knows about activating the AUT during a spec: when it last asked
// the browser to, and whether the browser stopped answering. `lastRequest` lets a
// request that answers after a newer one leave the newer one's state alone.
interface ActivationRecord {
  requestedAt?: number
  unresponsive: boolean
  lastRequest: number
}

const records = new WeakMap<ActivationHost, ActivationRecord>()

const recordFor = (Cypress: ActivationHost) => {
  let record = records.get(Cypress)

  if (!record) {
    record = { unresponsive: false, lastRequest: 0 }
    records.set(Cypress, record)
  }

  return record
}

const TIMED_OUT = Symbol('timed out')

// The browser notifies activation as a real user's click or key press would: the
// AUT gains sticky activation and, for a few seconds, transient activation. No
// input event reaches the application. Resolves `false` when the browser didn't
// activate the AUT. A browser that doesn't answer a page load's activation in time
// isn't asked again until that request answers, so it can't hold up every page load
// and command meanwhile. A command's renewal has less time, so running out of it only
// stops that command from renewing.
const activate = async (Cypress: ActivationHost, { isRenewal = false } = {}): Promise<boolean> => {
  const record = recordFor(Cypress)

  if (record.unresponsive) {
    return false
  }

  const request = ++record.lastRequest
  const isLatest = () => record.lastRequest === request

  record.requestedAt = Date.now()

  let timeout: ReturnType<typeof setTimeout> | undefined

  const activating = Cypress.automation('activate:aut:frame', {})

  try {
    const result = await Promise.race([
      activating,
      new Promise<typeof TIMED_OUT>((resolve) => {
        timeout = setTimeout(() => resolve(TIMED_OUT), isRenewal ? RENEWAL_TIMEOUT_MS : ACTIVATION_TIMEOUT_MS)
      }),
    ])

    if (result === TIMED_OUT) {
      if (isLatest()) {
        record.requestedAt = undefined
      }

      if (isRenewal) {
        debug('the browser did not renew the activation in time')

        return false
      }

      debug('the browser did not activate the AUT in time, so it is not asked again until it answers')

      if (isLatest()) {
        record.unresponsive = true
      }

      const answered = () => {
        if (isLatest()) {
          record.unresponsive = false
        }
      }

      activating.then(answered, answered)

      return false
    }

    return true
  } catch (err) {
    debug('failed to activate the AUT: %o', err)

    if (isLatest()) {
      record.requestedAt = undefined
    }

    return false
  } finally {
    clearTimeout(timeout)
  }
}

// Gives the AUT document sticky user activation, so it behaves as it would once a
// real user had interacted with it. Activation belongs to a document, so this runs
// after every AUT page load.
export const activateAut = async (Cypress: ActivationHost, autWindow: { location: { href: string } } | undefined) => {
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

// only what renewing reads from the AUT window, so a unit test can supply it
type ActivationWindow = { navigator: { userActivation?: { isActive: boolean } } }

// Gives the AUT the transient activation a real click or key press gives it, which
// APIs like `requestFullscreen()` and `showPicker()` need when the app calls them
// from an event handler, including after awaiting something there. A real click or
// key press always starts a fresh activation, so a command renews it before it
// fires its events, unless Cypress activated the AUT less than a second ago and
// `autWindow` hasn't used that activation up.
//
// Returns the function to call before each attempt or key. It returns nothing when
// there is nothing to renew, so the caller can stay synchronous. After a renewal
// fails, it stops trying for the rest of the command, which would otherwise wait on
// the browser before every retry.
//
// Firefox isn't asked: activating the page there again before a command's events
// leaves the app's handlers without transient activation, so it would only make
// every action command wait on the browser.
export const createTransientActivationRenewer = (Cypress: ActivationHost, autWindow: ActivationWindow | undefined) => {
  let failed = false

  const isUsedUp = () => {
    try {
      return autWindow?.navigator.userActivation?.isActive === false
    } catch {
      return false
    }
  }

  return (): Promise<void> | undefined => {
    const { requestedAt, unresponsive } = recordFor(Cypress)

    if (failed || unresponsive || !isEnabled(Cypress) || Cypress.isBrowser('firefox')) {
      return
    }

    if (requestedAt !== undefined && Date.now() - requestedAt < RENEWAL_INTERVAL_MS && !isUsedUp()) {
      return
    }

    return activate(Cypress, { isRenewal: true }).then((activated) => {
      failed = !activated
    })
  }
}

// A component testing spec's page that loaded before a test started, when a test's
// `userActivation` doesn't apply yet, so it is activated once a test starts. Kept per
// Cypress instance, so it goes away with the spec.
const documentsLoadedEarly = new WeakMap<ActivationHost, Document>()

export const deferActivationOfLoadedAut = (Cypress: ActivationHost, autWindow: Window | undefined) => {
  try {
    if (autWindow) {
      documentsLoadedEarly.set(Cypress, autWindow.document)
    }
  } catch {
    documentsLoadedEarly.delete(Cypress)
  }
}

// Activates the deferred document once a test that wants activation starts, because
// a suite's or test's `userActivation` only applies from then on.
export const activateAutLoadedEarly = async (Cypress: ICypress, autWindow: Window | undefined) => {
  const documentLoadedEarly = documentsLoadedEarly.get(Cypress)

  if (!documentLoadedEarly || !isEnabled(Cypress)) {
    return
  }

  let isSameDocument = false

  try {
    isSameDocument = autWindow?.document === documentLoadedEarly
  } catch {
    // a cross-origin AUT is a different document from the one that loaded early
  }

  documentsLoadedEarly.delete(Cypress)

  if (isSameDocument) {
    await activateAut(Cypress, autWindow)
  }
}

export const logBeforeUnloadDialogAccepted = (Cypress: ICypress, cy: $Cy | null, data: BeforeUnloadDialogAcceptedParams) => {
  // The AUT is navigated to about:blank between tests, when there is no test to log
  // to, and a spec that is still loading has no `cy` yet.
  if (!cy || !cy.state('runnable') || !cy.state('duringUserTestExecution')) {
    return
  }

  Cypress.log({
    name: 'beforeunload',
    message: 'accepted the "Leave site?" dialog',
    event: true,
    end: true,
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
