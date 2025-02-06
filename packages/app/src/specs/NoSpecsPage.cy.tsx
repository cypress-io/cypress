import NoSpecsPage from './NoSpecsPage.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import { NoSpecsPageFragmentDoc } from '../generated/graphql-test'

const pageTitleSelector = '[data-cy=create-spec-page-title]'
const pageDescriptionSelector = '[data-cy=create-spec-page-description]'
const noSpecsMessageSelector = '[data-cy=no-specs-message]'
const viewSpecsSelector = '[data-cy=view-spec-pattern]'

const messages = defaultMessages.createSpec

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
          return <NoSpecsPage gql={gql} isDefaultSpecPattern={true} title={messages.page.defaultPatternNoSpecs.title} />
        },
      })
    })

    it('renders the "No Specs" footer', () => {
      cy.get(noSpecsMessageSelector)
      .should('be.visible')
      .and('contain.text', messages.noSpecsMessage)
      .get(viewSpecsSelector)
      .should('be.visible')
      .and('contain.text', messages.viewSpecPatternButton)
    })

    it('renders the correct text for component testing', () => {
      cy.get(pageTitleSelector).should('contain.text', messages.page.defaultPatternNoSpecs.title)
      .get(pageDescriptionSelector).should('contain.text', messages.page.defaultPatternNoSpecs.component.description)
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
          return <NoSpecsPage gql={gql} isDefaultSpecPattern={true} title={messages.page.defaultPatternNoSpecs.title} />
        },
      })
    })

    it('renders the correct text', () => {
      cy.get(pageTitleSelector)
      .should('contain.text', messages.page.defaultPatternNoSpecs.title)
      .get(pageDescriptionSelector).should('contain.text', messages.page.defaultPatternNoSpecs.e2e.description)

      const text = defaultMessages.createSpec.e2e

      cy.contains(text.importFromScaffold.header).should('be.visible')
      cy.contains(text.importFromScaffold.description).should('be.visible')
      cy.contains(text.importTemplateSpec.header).should('be.visible')
      cy.contains(text.importTemplateSpec.description).should('be.visible')
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
            <NoSpecsPage gql={gql} onShowCreateSpecModal={showCreateSpecModal} isDefaultSpecPattern={false} title={messages.page.customPatternNoSpecs.title} />
          )
        },
      })

      cy.get(pageTitleSelector).should('contain.text', messages.page.customPatternNoSpecs.title)
      .get(pageDescriptionSelector).should('contain.text', messages.page.customPatternNoSpecs.description.replace('{0}', ' specPattern '))

      // show spec pattern
      cy.contains(customSpecPattern)
      cy.contains(defaultMessages.createSpec.updateSpecPattern)

      cy.contains(defaultMessages.createSpec.newSpec).click()

      cy.get('@showCreateSpecModal').should('have.been.called')
    })
  })
})
