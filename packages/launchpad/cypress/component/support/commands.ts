import { registerMountFn } from '@packages/frontend-shared/cypress/support/common'

registerMountFn()

Cypress.Commands.add('vue', (componentToFind = null) => {
  if (componentToFind) {
    return cy.wrap(Cypress.vueWrapper.findComponent(componentToFind))
  }

  return cy.wrap(Cypress.vueWrapper)
})
