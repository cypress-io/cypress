import { allBrowsersIcons } from '@packages/frontend-shared/src/assets/browserLogos'
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

    cy.findByTestId('collapsible').should('be.visible')
    cy.contains('h3', 'The Cypress extension is missing.')
    cy.contains('p', 'Cypress cannot run tests without this extension. Please choose another browser.')
    cy.findByTestId('external').contains('Read more about browser management').should('have.attr', 'href', 'https://on.cypress.io/launching-browsers')

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

  it('shows generic browser icon when current browser icon is not configured', () => {
    cy.mountFragment(AutomationMissingFragmentDoc, {
      render (gql) {
        gql.activeBrowser = gql.browsers?.find((x) => x.displayName === 'Fake Browser') ?? null

        return (<AutomationMissing gql={gql} />)
      },
    })

    cy.get('[data-cy="select-browser"] > button img').should('have.attr', 'src', allBrowsersIcons.generic)
    cy.percySnapshot()
  })
})
