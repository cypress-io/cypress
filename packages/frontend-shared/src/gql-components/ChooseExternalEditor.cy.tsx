import ChooseExternalEditor from './ChooseExternalEditor.vue'
import { ChooseExternalEditorFragmentDoc } from '../generated/graphql-test'
import { defaultMessages } from '@cy/i18n'

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
        return <div class="p-16px"><ChooseExternalEditor gql={gql} /></div>
      },
    })

    cy.contains(defaultMessages.settingsPage.editor.noEditorSelectedPlaceholder)
    .should('be.visible')
    .as('chooseEditor')

    // initial
    cy.percySnapshot()

    cy.get('@chooseEditor').click()
    cy.contains('On Computer').should('be.visible')
    cy.contains('Atom').should('be.visible')
    cy.contains('Vim').should('be.visible')

    cy.percySnapshot('open')

    cy.contains('Vim').click()
    cy.contains('Vim').should('be.visible')
    cy.contains('Atom').should('not.exist')

    cy.percySnapshot('selected')

    cy.get('[data-cy="custom-editor"]').should('not.exist')

    cy.get('@chooseEditor').click()
    cy.contains('Custom').click()
    cy.get('[data-cy="custom-editor"]').should('exist')

    cy.findByLabelText(defaultMessages.settingsPage.editor.customPathPlaceholder)
    .type('test/path')
    .should('have.value', 'test/path')

    cy.percySnapshot('custom editor input')
  })
})
