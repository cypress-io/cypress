import 'cypress-real-events/support'
// @ts-ignore
import installCustomPercyCommand from '@packages/ui-components/cypress/support/customPercyCommand'

installCustomPercyCommand({
  before () {
    cy.get('.focus-tests-text').should('be.visible')
  },
  elementOverrides: {
    '.command-progress': true,
  },
})
