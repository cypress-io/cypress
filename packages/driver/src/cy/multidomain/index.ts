export function addCommands (Commands, Cypress: Cypress.Cypress, cy: Cypress.cy, state: Cypress.State) {
  Commands.addAll({
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
