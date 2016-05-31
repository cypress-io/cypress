import overrides from './overrides'

const Cypress = $Cypress.create({loadModules: true})

export default {
  start () {
    overrides.overloadMochaRunnerUncaught()

    Cypress.setConfig({})

    Cypress.start()
  },

  run (specWindow, remoteIframe) {
    Cypress.initialize(specWindow, $(remoteIframe))

    Cypress.run((numErrs, results) => {
      debugger
    })
  },
}
