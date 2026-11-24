import ChooseExternalEditorModal from './ChooseExternalEditorModal.vue'
import { ChooseExternalEditorFragmentDoc } from '../generated/graphql-test'

describe('ChooseExternalEditorModal', () => {
  it('renders editors and UI elements work', () => {
    cy.mountFragment(ChooseExternalEditorFragmentDoc, {
      onResult (result) {
        result.localSettings.availableEditors = [
          { id: 'computer', name: 'On Computer', binary: 'computer', __typename: 'Editor' },
          { id: 'atom', name: 'Atom', binary: 'atom', __typename: 'Editor' },
          { id: 'vim', name: 'Vim', binary: 'vim', __typename: 'Editor' },
        ]
      },
      render: (gql) => {
        return <div class="p-[16px]"><ChooseExternalEditorModal gql={gql} open /></div>
      },
    })

    cy.contains('External editor preferences')
    cy.contains('Select your preference for opening files on your system.')
    cy.contains('You can change this later in the Settings page.')

    cy.findByTestId('launch-editor-hint').should('have.text', 'Editor not listed? Set LAUNCH_EDITOR and restart.')
    .contains('a', 'LAUNCH_EDITOR').should('have.attr', 'href', 'https://on.cypress.io/file-opener-preference?utm_medium=Choose+External+Editor&utm_content=Launch+Editor+Hint&utm_source=Binary%3A+Launchpad')

    cy.contains('Choose your editor...')
    .should('be.visible')
    .as('chooseEditor')

    cy.contains('Need help').should('have.attr', 'href', 'https://on.cypress.io/file-opener-preference?utm_medium=Choose+External+Editor&utm_content=Need+Help&utm_source=Binary%3A+Launchpad')

    // initial
    cy.percySnapshot()

    cy.get('@chooseEditor').click()
    cy.contains('On Computer').should('be.visible')
    cy.contains('Atom').should('be.visible')
    cy.contains('Vim').should('be.visible')
    cy.contains('Custom').should('not.exist')

    cy.percySnapshot('open')

    cy.contains('Vim').click()
    cy.contains('Vim').should('be.visible')
    cy.contains('Atom').should('not.exist')

    cy.percySnapshot('selected')
  })
})
