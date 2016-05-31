import overrides from './overrides'
import Cypress from './cypress'

export default {
  start () {
    overrides.overloadMochaRunnerUncaught()

    Cypress.setConfig({})

    Cypress.start()
  },

  run (specWindow, remoteIframe) {
    Cypress.initialize(specWindow, $(remoteIframe))

    Cypress.run((numErrs, results) => {
    })
  },
}
