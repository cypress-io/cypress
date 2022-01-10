import NoSpecsPage from './NoSpecsPage.vue'
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
            ...ctx.currentProject,
            config: {},
            id: 'id',
            storybook: null,
            configFileAbsolutePath: '/usr/bin/cypress.config.ts',
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
      .and('contain.text', messages.viewSpecPatternButton)
      .and('have.attr', 'href', '#/settings?section=project&setting=specPattern')
    })

    it('renders the correct text for component testing', () => {
      cy.get(pageTitleSelector).should('contain.text', messages.page.defaultPatternNoSpecs.title)
      .get(pageDescriptionSelector).should('contain.text', messages.page.defaultPatternNoSpecs.component.description)
    })

    it('percy snapshot', () => {
      cy.percySnapshot()
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

      cy.percySnapshot()
    })
  })

  describe('mounting with custom specPattern set', () => {
    it('renders the correct text for component testing', () => {
      cy.mountFragment(NoSpecsPageFragmentDoc, {
        render: (gql) => {
          return <NoSpecsPage gql={gql} isUsingDefaultSpecs={false} title={messages.page.customPatternNoSpecs.title} />
        },
      })

      cy.get(pageTitleSelector).should('contain.text', messages.page.customPatternNoSpecs.title)
      .get(pageDescriptionSelector).should('contain.text', messages.page.customPatternNoSpecs.description.replace('{0}', ' specPattern '))

      // show spec pattern
      cy.contains('**/*.spec.{js,ts,tsx,jsx}')
      cy.contains(defaultMessages.createSpec.updateSpecPattern)

      cy.log('state before clicking "New Spec" ')
      cy.percySnapshot()

      cy.contains(defaultMessages.createSpec.newSpec).click()
      cy.contains(defaultMessages.createSpec.newSpecModalTitle)
      cy.log('state after clicking "New Spec"')
      cy.percySnapshot()
    })
  })
})
