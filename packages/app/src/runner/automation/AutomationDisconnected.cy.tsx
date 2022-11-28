import { AutomationDisconnected_RelaunchBrowserDocument } from '../../generated/graphql-test'
import AutomationDisconnected from './AutomationDisconnected.vue'

describe('AutomationDisconnected', () => {
  it('should relaunch browser', () => {
    cy.mount(<AutomationDisconnected />)

    cy.percySnapshot()

    const relaunchStub = cy.stub()

    cy.stubMutationResolver(AutomationDisconnected_RelaunchBrowserDocument, (defineResult) => {
      relaunchStub()

      return defineResult({ launchOpenProject: { id: '1' } })
    })

    cy.contains('button', 'Reload the browser').click()

    cy.wrap(relaunchStub).should('have.been.called')
  })
})
