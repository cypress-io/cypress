import { AutomationMissingFragmentDoc, VerticalBrowserListItems_SetBrowserDocument } from '../../generated/graphql-test'
import AutomationMissing from './AutomationMissing.vue'

describe('AutomationMissing', () => {
  it('should render', () => {
    let browsers

    cy.mountFragment(AutomationMissingFragmentDoc, {
      render (gql) {
        browsers = gql.browsers

        return (<AutomationMissing gql={gql} />)
      },
    })

    cy.percySnapshot()

    const selectBrowserStub = cy.stub()

    cy.stubMutationResolver(VerticalBrowserListItems_SetBrowserDocument, (defineResult, { id }) => {
      selectBrowserStub()

      return defineResult({
        launchpadSetBrowser: {
          id,
          browsers,
        },
        launchOpenProject: {
          id,
        },
      })
    })

    cy.get('[data-cy="select-browser"]').click()
    cy.contains('li', 'Chrome').click()

    cy.wrap(selectBrowserStub).should('have.been.called')
  })
})
