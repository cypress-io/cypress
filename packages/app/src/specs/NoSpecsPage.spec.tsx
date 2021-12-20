import NoSpecsPage from './NoSpecsPage.vue'
import { defaultMessages } from '@cy/i18n'
import { NoSpecsPageFragmentDoc } from '../generated/graphql-test'

const pageTitleSelector = '[data-testid=create-spec-page-title]'
const pageDescriptionSelector = '[data-testid=create-spec-page-description]'
const noSpecsMessageSelector = '[data-testid=no-specs-message]'
const viewSpecsSelector = '[data-testid=view-spec-pattern]'

const messages = defaultMessages.createSpec

describe('<NoSpecsPage />', () => {
  describe('mounting in component mode with default specPattern set', () => {
    beforeEach(() => {
      cy.mountFragment(NoSpecsPageFragmentDoc, {
        onResult: (ctx) => {
          ctx.currentProject = {
            ...ctx.currentProject,
            config: {},
            id: 'id',
            storybook: null,
            configFileAbsolutePath: '/usr/bin/cypress.config.ts',
            configFilePath: 'cypress.config.ts',
            codeGenGlobs: {
              id: 'super-unique-id',
              __typename: 'CodeGenGlobs',
              component: '**.vue',
              story: '**/*.stories.*',
            },
            currentTestingType: 'component',
          }
        },
        render: (gql) => {
          return <NoSpecsPage gql={gql} isUsingDefaultSpecs={true} title={messages.page.defaultPatternNoSpecs.title} />
        },
      })
    })

    it('renders the "No Specs" footer', () => {
      cy.get(noSpecsMessageSelector)
      .should('be.visible')
      .and('contain.text', messages.noSpecsMessage)
      .get(viewSpecsSelector)
      .should('be.visible')
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
            ...ctx.currentProject,
            config: {},
            configFileAbsolutePath: '/usr/bin/cypress.config.ts',
            configFilePath: 'cypress.config.ts',
            id: 'id',
            storybook: null,
            currentTestingType: 'e2e',
            codeGenGlobs: {
              id: 'super-unique-id',
              __typename: 'CodeGenGlobs',
              component: '**.vue',
              story: '**/*.stories.*',
            },
          }
        },
        render: (gql) => {
          return <NoSpecsPage gql={gql} isUsingDefaultSpecs={true} title={messages.page.defaultPatternNoSpecs.title} />
        },
      })
    })

    it('renders the correct text', () => {
      cy.get(pageTitleSelector)
      .should('contain.text', messages.page.defaultPatternNoSpecs.title)
      .get(pageDescriptionSelector).should('contain.text', messages.page.defaultPatternNoSpecs.e2e.description)
    })
  })

  describe('mounting with custom specPattern set', () => {
    //mode doesn't matter now as content is the same in each mode
    beforeEach(() => {
      cy.mountFragment(NoSpecsPageFragmentDoc, {
        render: (gql) => {
          return <NoSpecsPage gql={gql} isUsingDefaultSpecs={false} title={messages.page.customPatternNoSpecs.title} />
        },
      })
    })

    it('renders the correct text for component testing', () => {
      cy.get(pageTitleSelector).should('contain.text', messages.page.customPatternNoSpecs.title)
      .get(pageDescriptionSelector).should('contain.text', messages.page.customPatternNoSpecs.description.replace('{0}', ' specPattern '))

      // show spec pattern
      cy.contains('**/*.spec.{js,ts,tsx,jsx}')
      cy.contains(defaultMessages.createSpec.updateSpecPattern)
      cy.contains(defaultMessages.createSpec.newSpec).click()
      cy.contains(defaultMessages.createSpec.newSpecModalTitle)
    })
  })
})
