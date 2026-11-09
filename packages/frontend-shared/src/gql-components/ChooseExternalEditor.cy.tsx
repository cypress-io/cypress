import ChooseExternalEditor from './ChooseExternalEditor.vue'
import { ChooseExternalEditorFragmentDoc } from '../generated/graphql-test'

describe('ChooseExternalEditor', { viewportHeight: 400, viewportWidth: 300 }, () => {
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
        return (
          <div class="p-[16px]">
            <label id="example-label">Mock Choose Editor</label>
            <ChooseExternalEditor gql={gql} labelId="example-label" />
          </div>
        )
      },
    })

    cy.findByTestId('launch-editor-hint').should('have.text', 'Editor not listed? Set LAUNCH_EDITOR and restart.')
    .contains('a', 'LAUNCH_EDITOR').should('have.attr', 'href', 'https://on.cypress.io/file-opener-preference?utm_medium=Choose+External+Editor&utm_content=Launch+Editor+Hint&utm_source=Binary%3A+Launchpad')

    cy.contains('Choose your editor...')
    .should('be.visible')
    .as('chooseEditor')

    cy.get('@chooseEditor').click()
    cy.contains('On Computer').should('be.visible')
    cy.contains('Atom').should('be.visible')
    cy.contains('Vim').should('be.visible')
    cy.contains('Custom').should('not.exist')

    cy.contains('Vim').click()
    cy.contains('Vim').should('be.visible')
    cy.contains('Atom').should('not.exist')
  })

  it('shows an icon for a selected editor without its own', () => {
    cy.mountFragment(ChooseExternalEditorFragmentDoc, {
      onResult (result) {
        result.localSettings.availableEditors = [
          { id: 'nano', name: 'Nano', binary: 'nano', __typename: 'Editor' },
        ]

        result.localSettings.preferences.preferredEditorBinary = 'nano'
      },
      render: (gql) => <ChooseExternalEditor gql={gql} labelId="example-label" />,
    })

    cy.contains('button', 'Nano').find('svg').not('[data-testid=icon-caret]').should('be.visible')
  })
})
