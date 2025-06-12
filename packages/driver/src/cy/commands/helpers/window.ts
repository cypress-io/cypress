export class TitleNotYetAvailableError extends Error {
  constructor () {
    const message = 'document.title is not yet available'

    super(message)
    this.name = 'TitleNotYetAvailableError'
  }
}

export function getTitleFromAutomation (Cypress: Cypress.Cypress, options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
  const timeout = options.timeout ?? Cypress.config('defaultCommandTimeout') as number

  this.set('timeout', timeout)

  let documentTitle: any = null
  let automationPromise: Promise<void> | null = null
  // need to set a valid type on this
  let mostRecentError = new TitleNotYetAvailableError()

  const getTitleFromAutomation = () => {
    if (automationPromise) {
      return automationPromise
    }

    documentTitle = null

    automationPromise = Cypress.automation('get:aut:title', {})
    .timeout(timeout)
    .then((returnedDocumentTitle) => {
      documentTitle = returnedDocumentTitle
    })
    .catch<void>((err) => mostRecentError = err)
    // Pass or fail, we always clear the automationPromise, so future retries know there's no live request to the server.
    .finally(() => automationPromise = null)

    return automationPromise
  }

  this.set('onFail', (err, timedOut) => {
    // if we are actively retrying or the assertion failed, we want to retry
    if (err.name === 'TitleNotYetAvailableError' || err.name === 'AssertionError') {
      // tslint:disable-next-line no-floating-promises
      getTitleFromAutomation()
    } else {
      throw err
    }
  })

  return () => {
    if (documentTitle !== null) {
      return documentTitle
    }

    // tslint:disable-next-line no-floating-promises
    getTitleFromAutomation()

    throw mostRecentError
  }
}
