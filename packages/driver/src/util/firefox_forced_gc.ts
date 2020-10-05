import { isNumber, isNull } from 'lodash'

function usingFirefoxWithGcBug (browser: Cypress.Browser) {
  // @see https://github.com/cypress-io/cypress/issues/8241
  return browser.family === 'firefox' && browser.majorVersion < 80
}

export function createIntervalGetter (Cypress: Cypress.Cypress) {
  return () => {
    if (!usingFirefoxWithGcBug(Cypress.browser)) {
      return undefined
    }

    const intervals = Cypress.config('firefoxGcInterval')

    if (isNumber(intervals) || isNull(intervals)) {
      return intervals
    }

    // @ts-ignore
    return intervals[Cypress.config('isInteractive') ? 'openMode' : 'runMode']
  }
}

export function install (Cypress: Cypress.Cypress & EventEmitter) {
  if (!usingFirefoxWithGcBug(Cypress.browser)) {
    return
  }

  let cyVisitedSinceLastGc = false
  let testsSinceLastForcedGc = 0

  Cypress.on('command:start', function (cmd) {
    if (cmd.get('name') === 'visit') {
      cyVisitedSinceLastGc = true
    }
  })

  Cypress.on('test:before:run:async', function (testAttrs) {
    const { order } = testAttrs

    testsSinceLastForcedGc++

    // if this is the first test, or the last test didn't run a cy.visit...
    if (order === 0 || !cyVisitedSinceLastGc) {
      return
    }

    const gcInterval = Cypress.getFirefoxGcInterval()

    cyVisitedSinceLastGc = false

    if (gcInterval && gcInterval > 0 && testsSinceLastForcedGc >= gcInterval) {
      testsSinceLastForcedGc = 0
      Cypress.emit('before:firefox:force:gc', { gcInterval })

      return Cypress.backend('firefox:force:gc').then(() => {
        return Cypress.emit('after:firefox:force:gc', { gcInterval })
      })
    }

    return
  })
}
