import { AutomationDisconnected_RelaunchBrowserDocument } from '../../generated/graphql-test'
import AutomationDisconnected from './AutomationDisconnected.vue'

describe('AutomationDisconnected', () => {
  it('should relaunch browser', () => {
    cy.mount(<AutomationDisconnected />)

    cy.findByTestId('collapsible').should('be.visible')
    cy.contains('h2', 'The Cypress extension has disconnected.')
    cy.contains('p', 'Cypress cannot run tests without this extension.')
    cy.get('a').contains('Read more about browser management').should('have.attr', 'href', 'https://on.cypress.io/launching-browsers')

    const relaunchStub = cy.stub()

    cy.stubMutationResolver(AutomationDisconnected_RelaunchBrowserDocument, (defineResult) => {
      relaunchStub()

      return defineResult({ launchOpenProject: { id: '1' } })
    })

    cy.contains('button', 'Reload the browser').click()

    cy.wrap(relaunchStub).should('have.been.called')
  })
})
