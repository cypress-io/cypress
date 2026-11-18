import NoSpecsPage from './NoSpecsPage.vue'
import { NoSpecsPageFragmentDoc } from '../generated/graphql-test'

const pageTitleSelector = '[data-cy=create-spec-page-title]'
const pageDescriptionSelector = '[data-cy=create-spec-page-description]'
const noSpecsMessageSelector = '[data-cy=no-specs-message]'
const viewSpecsSelector = '[data-cy=view-spec-pattern]'

describe('<NoSpecsPage />', { viewportHeight: 655, viewportWidth: 1032 }, () => {
  describe('mounting in component mode with default specPattern set', () => {
    beforeEach(() => {
      cy.mountFragment(NoSpecsPageFragmentDoc, {
        onResult: (ctx) => {
          ctx.currentProject = {
            ...ctx.currentProject!,
            config: [{ field: 'specPattern', from: 'config', value: '**/*.cy.{js,jsx,ts,tsx}' }],
            id: 'id',
            configFileAbsolutePath: '/usr/bin/cypress.config.ts',
            currentTestingType: 'component',
          }
        },
        render: (gql) => {
          return <NoSpecsPage gql={gql} isDefaultSpecPattern={true} title="Create your first spec" />
        },
      })
    })

    it('renders the "No Specs" footer', () => {
      cy.get(noSpecsMessageSelector)
      .should('be.visible')
      .and('contain.text', 'If you feel that you\'re seeing this screen in error, and there should be specs listed here, you likely need to update the spec pattern.')
      .get(viewSpecsSelector)
      .should('be.visible')
      .and('contain.text', 'View spec pattern')
    })

    it('renders the correct text for component testing', () => {
      cy.get(pageTitleSelector).should('contain.text', 'Create your first spec')
      .get(pageDescriptionSelector).should('contain.text', 'Since this project looks new, we recommend that you get started by creating a spec for one of your components.')
    })
  })

  describe('mounting in e2e mode with default spec pattern set', () => {
    beforeEach(() => {
      cy.mountFragment(NoSpecsPageFragmentDoc, {
        onResult: (ctx) => {
          ctx.currentProject = {
            ...ctx.currentProject!,
            config: [{ field: 'specPattern', from: 'config', value: '**/*.cy.{js,jsx,ts,tsx}' }],
            configFileAbsolutePath: '/usr/bin/cypress.config.ts',
            id: 'id',
            currentTestingType: 'e2e',
          }
        },
        render: (gql) => {
          return <NoSpecsPage gql={gql} isDefaultSpecPattern={true} title="Create your first spec" />
        },
      })
    })

    it('renders the correct text', () => {
      cy.get(pageTitleSelector)
      .should('contain.text', 'Create your first spec')
      .get(pageDescriptionSelector).should('contain.text', 'Since this project looks new, we recommend that you use the specs and tests that we\'ve written for you to get started.')

      cy.contains('Scaffold example specs').should('be.visible')
      cy.contains('We\'ll generate several example specs to help guide you on how to write tests in Cypress.').should('be.visible')
      cy.contains('Create new spec').should('be.visible')
      cy.contains('We\'ll generate a template spec file which can be used to start testing your application.').should('be.visible')
    })
  })

  describe('mounting with custom specPattern set', () => {
    it('renders the correct text for component testing', () => {
      const customSpecPattern = 'cypress/**/*.cy.ts'

      const showCreateSpecModal = cy.spy().as('showCreateSpecModal')

      cy.mountFragment(NoSpecsPageFragmentDoc, {
        onResult: (res) => {
          if (res.currentProject?.config) {
            res.currentProject.config = res.currentProject.config.map((x) => {
              if (x.field === 'specPattern') {
                return { ...x, value: customSpecPattern }
              }

              return x
            })
          }
        },
        render: (gql) => {
          return (
            <NoSpecsPage gql={gql} onShowCreateSpecModal={showCreateSpecModal} isDefaultSpecPattern={false} title="No specs found" />
          )
        },
      })

      cy.get(pageTitleSelector).should('contain.text', 'No specs found')
      .get(pageDescriptionSelector).should('contain.text', 'We couldn\'t find any files matching the following spec patterns. You may need to move your specs or update your  specPattern  to find them.')

      // show spec pattern
      cy.contains(customSpecPattern)
      cy.contains('Update spec pattern')

      cy.contains('New spec').click()

      cy.get('@showCreateSpecModal').should('have.been.called')
    })
  })
})
