import { defaultMessages } from '@cy/i18n'
import GlobalPage from './GlobalPage.vue'
import type { GlobalPageFragment } from '../generated/graphql-test'
import { GlobalPageFragmentDoc } from '../generated/graphql-test'

const searchLabel = defaultMessages.globalPage.searchPlaceholder
const emptyMessages = defaultMessages.globalPage.empty
const testProject = 'some-test-title'
const anotherTestProject = 'another-test-project'
const testProjectPath = '/usr/local/dev/projects/some-test-title'

describe('<GlobalPage />', { viewportHeight: 900, viewportWidth: 1200 }, () => {
  describe('without projects', () => {
    it('renders the empty state', () => {
      cy.mount(() => (<div>
        <GlobalPage gql={{ gql: {} } as unknown as GlobalPageFragment}/>
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
        render: (gqlVal) => <GlobalPage gql={gqlVal} />,
      })
    })

    it('renders projects', () => {
      cy.findByText(testProject).should('be.visible')
      cy.findByText(testProjectPath).should('be.visible')
    })

    it('can filter down the projects by name', () => {
      cy.findByText(testProject).should('be.visible')
      cy.findByLabelText(searchLabel).type(anotherTestProject, { delay: 0 })
      cy.findByText(anotherTestProject).should('be.visible')
      cy.findByText(testProject).should('not.exist')
      cy.findByLabelText(searchLabel).clear()
      cy.findByText(testProject).should('be.visible')
      cy.findByText(anotherTestProject).should('be.visible')
    })

    it('can add a project when clicking the button', () => {
      cy.contains('button', defaultMessages.globalPage.addProjectButton).click()
      cy.get('input[type=file]')
      .attachFileWithPath('absolute/path/to/yet-another-test-project/cypress.config.ts')
      .trigger('change', { force: true })
      // .findByText('yet-another-test-project').should('be.visible')
    })
  })
})
