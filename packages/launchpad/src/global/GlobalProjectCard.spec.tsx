import GlobalProjectCard from './GlobalProjectCard.vue'
import { GlobalProjectCardFragmentDoc } from '../generated/graphql-test'
import { defaultMessages } from '@cy/i18n'

const defaultPath = '/usr/local/dev/projects/some-test-title'

describe('<GlobalProjectCard />', () => {
  beforeEach(() => {
    cy.mountFragment(GlobalProjectCardFragmentDoc, {
      render: (gqlValue) => (
        <div class="p-12 overflow-auto resize-x max-w-600px">
          <GlobalProjectCard gql={gqlValue} />
        </div>
      ),
    })
  })

  it('renders', () => {
    cy.findByText('Some Test Title').should('be.visible')
    cy.findByText(defaultPath).should('be.visible')
  })

  function openActionsMenu () {
    cy.findByLabelText(defaultMessages.globalPage.projectActions, { selector: 'button' })
    .click()
  }

  function assertEventEmittedOnce (eventName: string) {
    cy.vue(GlobalProjectCard)
    .then((card) => {
      cy.wrap(card.emitted(eventName)[0][0]).should('equal', defaultPath)
    })
  }

  it('emits project action events with path value on click', () => {
    openActionsMenu()
    cy.contains('button', defaultMessages.globalPage.removeProject)
    .click()

    assertEventEmittedOnce('removeProject')

    openActionsMenu()
    cy.contains('button', defaultMessages.globalPage.openInFinder)
    .click()

    assertEventEmittedOnce('openInFinder')

    openActionsMenu()
    cy.contains('button', defaultMessages.globalPage.openInIDE)
    .click()

    assertEventEmittedOnce('openInIDE')
  })
})
