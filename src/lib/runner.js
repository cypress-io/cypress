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

    // hacks to simply force a response to automation
    // requests so our tests run
    Cypress.on("get:cookies", (options, cb) => {
      cb({ response: [] })
    })

    Cypress.on("clear:cookies", (options, cb) => {
      cb({ response: [] })
    })
  },

  run (specWindow, $autIframe) {
    Cypress.initialize(specWindow, $autIframe)

    Cypress.run((numErrs, results) => {
    })
  },
}
