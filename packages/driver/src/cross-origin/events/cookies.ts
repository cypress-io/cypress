import type { AutomationCookie } from '@packages/server/lib/automation/cookies'
import type { ICypress } from '../../cypress'

// cross-origin cookies collected by the the proxy are sent down to the driver
// via this event, so that they can be set via automation once the page has
// loaded. it's necessary to wait until page load because Firefox with the
// extension will hang the page load if we attempt to set the cookies via
// automation before the page loads
export const handleCrossOriginCookies = (Cypress: ICypress) => {
  // multiple requests could set cookies while the page is loading, so we
  // collect all cookies and only send set them via automation once after
  // the page has loaded
  let cookiesToSend: AutomationCookie[] = []
  let waitingToSend = false

  Cypress.on('cross:origin:cookies', (cookies: AutomationCookie[]) => {
    cookiesToSend = cookiesToSend.concat(cookies)

    Cypress.backend('cross:origin:cookies:received')

    if (waitingToSend) return

    waitingToSend = true

    // this event allows running a handler before stability is released.
    // this prevents subsequent commands from running until the cookies
    // are set via automation
    // @ts-ignore
    Cypress.once('before:stability:release', () => {
      const cookies = cookiesToSend

      cookiesToSend = []
      waitingToSend = false

      // this will be awaited before any stability-reliant actions
      return Cypress.automation('add:cookies', cookies)
      .catch(() => {
        // errors here can be ignored as they're not user-actionable
      })
    })
  })
}
