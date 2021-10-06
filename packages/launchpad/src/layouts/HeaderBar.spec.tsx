import { HeaderBarFragmentDoc } from '../generated/graphql-test'
import HeaderBar from './HeaderBar.vue'
import { defaultMessages } from '@cy/i18n'

describe('<HeaderBar />', () => {
  it('renders with functional browser menu when show-browsers prop is true', () => {
    cy.viewport(1000, 750)
    cy.mountFragment(HeaderBarFragmentDoc, {
      onResult: (result, ctx) => {
        result.app.activeProject = null
      },
      render: (gqlVal) => <div class="resize overflow-auto border-current border-1 h-700px"><HeaderBar gql={gqlVal} show-browsers={true} /></div>,
    })

    cy.get('[data-cy="topnav-browser-list"]')
    .should('be.visible')
    .click()

    cy.contains('Edge Canary')
    .should('be.visible')
  }),

  it('renders without browser menu by default and other items work', () => {
    cy.viewport(1000, 750)
    cy.mountFragment(HeaderBarFragmentDoc, {
      render: (gqlVal) => <div class="resize overflow-auto border-current border-1 h-700px"><HeaderBar gql={gqlVal} /></div>,
    })

    cy.get('[data-cy="topnav-browser-list"]').should('not.exist')
    cy.contains('button', defaultMessages.topNav.docsMenu.docsHeading).click()
    cy.contains('a', defaultMessages.topNav.docsMenu.firstTest).should('be.visible')
    cy.get('[data-cy="topnav-version-list"]').click()
    cy.contains('a', defaultMessages.topNav.docsMenu.firstTest).should('not.exist')
    cy.contains('a', defaultMessages.topNav.seeAllReleases).should('be.visible')
  })

  it('displays the active project name', () => {
    cy.viewport(1000, 750)
    cy.mountFragment(HeaderBarFragmentDoc, {
      render: (gqlVal) => <div class="resize overflow-auto border-current border-1 h-700px"><HeaderBar gql={gqlVal} /></div>,
    })

    cy.contains('test-project').should('be.visible')
  })
})
