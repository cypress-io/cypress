import { get, isNumber, isNull } from 'lodash'

export function createIntervalGetter (config) {
  return () => {
    if (get(config('browser'), 'family') !== 'firefox') {
      return undefined
    }

    const intervals = config('firefoxGcInterval')

    if (isNumber(intervals) || isNull(intervals)) {
      return intervals
    }

    return intervals[config('isInteractive') ? 'openMode' : 'runMode']
  }
}

export function install (Cypress: Cypress.Cypress & EventEmitter) {
  if (!Cypress.isBrowser('firefox')) {
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
