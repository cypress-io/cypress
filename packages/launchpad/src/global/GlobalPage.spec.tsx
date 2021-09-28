import { defaultMessages } from '../locales/i18n'
import GlobalPage from './GlobalPage.vue'
import { GlobalPageFragmentDoc } from '../generated/graphql-test'

const searchSelector = `input[placeholder="${defaultMessages.globalPage.searchPlaceholder}"`
const emptyMessages = defaultMessages.globalPage.empty
const testProject = 'test-project'
const anotherTestProject = 'another-test-project'
const testProjectPath = '/usr/local/dev/projects/test-project'

describe('<GlobalPage />', { viewportHeight: 900, viewportWidth: 1200 }, () => {
  describe('without projects', () => {
    it('renders the empty state', () => {
      cy.mount(() => (<div>
        <GlobalPage />
      </div>))

      cy.findByText(emptyMessages.title).should('be.visible')
      cy.findByText(emptyMessages.helper).should('be.visible')

      // TODO: This should open a native file picker
      cy.findByText(emptyMessages.browseManually).click()
    })
  })

  describe('with projects', () => {
    beforeEach(() => {
      cy.mountFragment(GlobalPageFragmentDoc, {
        type: (ctx) => {
          return {
            ...ctx.stubApp,
          }
        },
        render: (gqlVal) => <GlobalPage gql={gqlVal} />,
      })
    })

    it('renders projects', () => {
      cy.findByText(testProject).should('be.visible')
      cy.findByText(testProjectPath).should('be.visible')
    })

    it('can filter down the projects', () => {
      cy.findByText(testProject).should('be.visible')
      cy.get(searchSelector).type(anotherTestProject, { delay: 0 })
      cy.findByText(anotherTestProject).should('be.visible')
      cy.findByText(testProject).should('not.exist')
      cy.get(searchSelector).clear()
      cy.findByText(testProject).should('be.visible')
      cy.findByText(anotherTestProject).should('be.visible')
    })

    describe('Welcome Guide', () => {
      it('renders the welcome guide', () => {
        cy.findByText(defaultMessages.welcomeGuide.header.description).should('be.visible')
      })
    })
  })
})
