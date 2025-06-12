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
  let automationPromise: Promise<void> | null = null
  // need to set a valid type on this
  let mostRecentError = new UrlNotYetAvailableError()

  const getUrlFromAutomation = () => {
    if (automationPromise) {
      return automationPromise
    }

    fullUrlObj = null

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

  return () => {
    if (fullUrlObj) {
      return fullUrlObj
    }

    // tslint:disable-next-line no-floating-promises
    getUrlFromAutomation()

    throw mostRecentError
  }
}
