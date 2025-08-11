export class UrlNotYetAvailableError extends Error {
  constructor () {
    const message = 'URL is not yet available'

    super(message)
    this.name = 'UrlNotYetAvailableError'
  }
}

export function getUrlFromAutomation (Cypress: Cypress.Cypress, options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
  const timeout = options.timeout ?? Cypress.config('defaultCommandTimeout') as number

  this.set('timeout', timeout)

  let fullUrlObj: any = null
  let hasBeenInitiallyResolved = false
  let automationPromise: Promise<void> | null = null
  // need to set a valid type on this
  let mostRecentError = new UrlNotYetAvailableError()

  const getUrlFromAutomation = () => {
    if (automationPromise) {
      return automationPromise
    }

    automationPromise = Cypress.automation('get:aut:url', {})
    .timeout(timeout)
    .then((url) => {
      const fullUrlObject = new URL(url)

      fullUrlObj = {
        hash: fullUrlObject.hash,
        host: fullUrlObject.host,
        hostname: fullUrlObject.hostname,
        href: fullUrlObject.href,
        origin: fullUrlObject.origin,
        pathname: fullUrlObject.pathname,
        port: fullUrlObject.port,
        protocol: fullUrlObject.protocol,
        search: fullUrlObject.search,
        searchParams: fullUrlObject.searchParams,
      }
    })
    .catch<void>((err) => mostRecentError = err)
    // Pass or fail, we always clear the automationPromise, so future retries know there's no live request to the server.
    .finally(() => automationPromise = null)

    return automationPromise
  }

  this.set('onFail', (err) => {
    // if we are actively retrying or the assertion failed, we want to retry
    if (err.name === 'UrlNotYetAvailableError' || err.name === 'AssertionError') {
      // tslint:disable-next-line no-floating-promises
      getUrlFromAutomation()
    } else {
      throw err
    }
  })

  return (options: {
    retryAfterResolve?: boolean
  } = {
    retryAfterResolve: false,
  }) => {
    if (fullUrlObj) {
      // In some cases, Cypress will want to retry fetching the url object after it is resolved.
      // For instance, in the case of the command yielding an object, like cy.location().

      // If cy.location().its('url').should('equal', 'https://www.foobar.com') initially fails the 'should' assertion,
      // Cypress will want to retry fetching the url object as the onFail handler is NOT called when the subject is chained after 'its'.

      // This does NOT apply if the assertion is chained directly after the command, like cy.location().should('equal', 'https://www.foobar.com').
      // This examples DOES call the onFail handler and fetching the url will be retried from the context of the onFail handler.
      if (options?.retryAfterResolve && hasBeenInitiallyResolved) {
        // tslint:disable-next-line no-floating-promises
        getUrlFromAutomation()
      }

      // We only want to retry if the url object has been resolved at least once.
      // Otherwise, this will always fetch n + 1 times which is usually unnecessary.
      hasBeenInitiallyResolved = true

      return fullUrlObj
    }

    // tslint:disable-next-line no-floating-promises
    getUrlFromAutomation()

    throw mostRecentError
  }
}
