import type { Client } from 'webdriver'
import Debug from 'debug'

const debug = Debug('cypress:server:automation:command:user_gesture')

// Derive the exact accepted action-source shape from the webdriver client itself so this stays
// in sync with the installed `webdriver` types without having to redeclare them.
type InputSourceActions = Parameters<Client['inputPerformActions']>[0]['actions']

// Firefox 93+ requires a transient user activation (a recent, real user gesture) before display
// capture (`getUserMedia` with `mediaSource: 'browser'`) is permitted. Cypress records Firefox
// video through that API, so without a gesture the call rejects with "Display capture requires
// transient activation from a user gesture" and no video is ever produced.
// @see https://bugzilla.mozilla.org/show_bug.cgi?id=1729889
// @see https://github.com/cypress-io/cypress/issues/18415
//
// Input synthesized through WebDriver BiDi produces a *trusted* event, which grants the activation.
// We dispatch a single mouse click in the top-level Cypress window (where the driver calls
// `getUserMedia`) at the very top-left corner so the click can't land on the AUT iframe or any
// interactive reporter control.
export async function bidiPerformUserGesture (client: Client, context: string): Promise<void> {
  const id = `cypress-user-gesture-${Date.now()}`

  debug('performing trusted user gesture on context %s', context)

  const actions: InputSourceActions = [{
    type: 'pointer',
    id,
    parameters: { pointerType: 'mouse' },
    actions: [
      { type: 'pointerMove', x: 0, y: 0 },
      { type: 'pointerDown', button: 0 },
      { type: 'pointerUp', button: 0 },
    ],
  }]

  try {
    await client.inputPerformActions({ context, actions })
    await client.inputReleaseActions({ context })
  } catch (e) {
    debug('error performing user gesture: %o', e)

    throw e
  }
}
