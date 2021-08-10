import { defaultMessages } from '../locales/i18n'
import GlobalPage from './GlobalPage.vue'

const searchSelector = `input[placeholder="${defaultMessages.globalPage.searchPlaceholder}"`
const emptyMessages = defaultMessages.globalPage.empty

describe('<GlobalPage />', { viewportHeight: 900, viewportWidth: 1200 }, () => {
  beforeEach(() => {
    cy.mount(() => (<div>
      <GlobalPage />
    </div>))
  })

  // TODO: add gql so that we can mock out the fragment response
  describe.skip('without projects', () => {
    it('renders the empty state', () => {
      cy.findByText(emptyMessages.title).should('be.visible')
      cy.findByText(emptyMessages.helper).should('be.visible')

      // TODO: This should open a native file picker
      cy.findByText(emptyMessages.browseManually).click()
    })
  })

  describe('with projects', () => {
    it('renders an empty input field', () => {
      cy.get(searchSelector).should('be.visible').and('not.have.value')
    })

    it('renders projects', () => {
      // TODO: add gql so that we can mock out the fragment response
      cy.findByText('Ten Days ago').should('be.visible')
      cy.findByText('Project Name 2').should('be.visible')
    })

    it('can filter down the projects', () => {
      cy.findByText('Ten Days ago').should('be.visible')
      cy.findByText('Project Name 2').should('be.visible')
      cy.get(searchSelector).type('Project Name 2', { delay: 0 })
      cy.findByText('Project Name 2').should('be.visible')
      cy.findByText('Ten Days ago').should('not.exist')
      cy.get(searchSelector).clear()
      cy.findByText('Ten Days ago').should('be.visible')
      cy.findByText('Project Name 2').should('be.visible')
    })

    describe('Welcome Guide', () => {
      it('renders the welcome guide', () => {
        cy.findByText(defaultMessages.welcomeGuide.header.description).should('be.visible')
      })
    })
  })
})
