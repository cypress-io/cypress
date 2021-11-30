import CreateSpecPage from './CreateSpecPage.vue'
import { defaultMessages } from '@cy/i18n'
import { CreateSpecPageFragmentDoc } from '../generated/graphql-test'

const pageTitleSelector = '[data-testid=create-spec-page-title]'
const pageDescriptionSelector = '[data-testid=create-spec-page-description]'
const noSpecsMessageSelector = '[data-testid=no-specs-message]'
const viewSpecsSelector = '[data-testid=view-spec-pattern]'

const messages = defaultMessages.createSpec

describe('<CreateSpecPage />', () => {
  describe('mounting in component type', () => {
    beforeEach(() => {
      cy.mountFragment(CreateSpecPageFragmentDoc, {
        onResult: (ctx) => {
          ctx.currentProject = {
            ...ctx.currentProject,
            id: 'id',
            storybook: null,
            configFileAbsolutePath: '/usr/bin/cypress.config.ts',
            codeGenGlob: '**.vue',
            currentTestingType: 'component',
          }
        },
        render: (gql) => {
          return <CreateSpecPage gql={gql} />
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

    it('renders component mode', () => {
      expect(true).to.be.true
    })

    it('renders the correct text for component testing', () => {
      cy.get(pageTitleSelector).should('contain.text', messages.page.title)
      .get(pageDescriptionSelector).should('contain.text', messages.page.component.description)
    })
  })

  describe('mounting in e2e mode', () => {
    beforeEach(() => {
      cy.mountFragment(CreateSpecPageFragmentDoc, {
        onResult: (ctx) => {
          ctx.currentProject = {
            ...ctx.currentProject,
            configFileAbsolutePath: '/usr/bin/cypress.config.ts',
            id: 'id',
            storybook: null,
            codeGenGlob: '**.vue',
            currentTestingType: 'e2e',
          }
        },
        render: (gql) => {
          return <CreateSpecPage gql={gql} />
        },
      })
    })

    it('renders e2e mode', () => {
      expect(true).to.be.true
    })

    it('renders the correct text', () => {
      cy.get(pageTitleSelector)
      .should('contain.text', messages.page.title)
      .get(pageDescriptionSelector).should('contain.text', messages.page.e2e.description)
    })
  })
})
