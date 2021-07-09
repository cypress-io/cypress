import Bluebird from 'bluebird'

export function addCommands (Commands, Cypress: Cypress.Cypress, cy: Cypress.cy, state: Cypress.State) {
  Commands.addAll({
    anticipateMultidomain () {
      state('anticipateMultidomain', true)

      return new Bluebird((resolve) => {
        // @ts-ignore
        Cypress.once('cross:domain:bridge:ready', () => {
          resolve()
        })

        Cypress.action('cy:expect:domain', '127.0.0.1:3501')
      })
    },

    switchToDomain (domain, fn) {
      Cypress.log({
        name: 'switchToDomain',
        type: 'parent',
        message: domain,
        end: true,
      })

      Cypress.action('cy:cross:domain:message', 'run:in:domain', fn.toString())
    },
  })
}
