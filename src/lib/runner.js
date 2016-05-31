import _ from 'lodash'

import overrides from './overrides'
import Cypress from './cypress'

const channel = io.connect({ path: "/__socket.io" })

const CypressEvents = "run:start run:end suite:start suite:end hook:start hook:end test:start test:end".split(" ")

export default {
  start () {
    overrides.overloadMochaRunnerUncaught()

    Cypress.setConfig({})

    Cypress.start()

    _.each(CypressEvents, (event) => {
      Cypress.on(event, (...args) => channel.emit(event, ...args))
    })
  },

  run (specWindow, remoteIframe) {
    Cypress.initialize(specWindow, $(remoteIframe))

    Cypress.run((numErrs, results) => {
    })
  },
}
