import type { SerializableAutomationCookie } from '@packages/server/lib/util/cookies'
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
  let cookiesToSend: SerializableAutomationCookie[] = []
  let waitingToSend = false

  Cypress.on('cross:origin:cookies', (cookies: SerializableAutomationCookie[]) => {
    cookiesToSend = cookiesToSend.concat(cookies)

    Cypress.backend('cross:origin:cookies:received')

    if (waitingToSend) return

    waitingToSend = true

    const syncCookiesViaAutomation = () => {
      const cookies = cookiesToSend

      cookiesToSend = []
      waitingToSend = false

      // this will be awaited before any stability-reliant actions
      return Cypress.automation('add:cookies', cookies)
      .catch(() => {
        // errors here can be ignored as they're not user-actionable
      })
    }

    // if the application is already stable, sync the cookies to the automation client immediately
    if (cy.state('isStable')) {
      syncCookiesViaAutomation()
    } else {
      // otherwise, wait until stability is achieved
      // this event allows running a handler before stability is released.
      // this prevents subsequent commands from running until the cookies
      // are set via automation
      // @ts-ignore
      Cypress.once('before:stability:release', syncCookiesViaAutomation)
    }
  })
}
