import FileChooser from './FileChooser.vue'

import { randomComponents } from '@packages/frontend-shared/cypress/support/mock-graphql/testStubSpecs'
import { ref } from 'vue'
import { defaultMessages } from '@cy/i18n'

const numFiles = 120
const allFiles = randomComponents(numFiles)
const fileRowSelector = '[data-testid=file-list-row]'
const filenameInputSelector = `[placeholder="${defaultMessages.components.fileSearch.byFilenameInput}"]`
const loadingSelector = '[data-testid=loading]'


describe('<FileChooser />', () => {
  it('renders files in a list', () => {
    cy.mount(() => (<FileChooser files={ allFiles } />))
    cy.get(fileRowSelector)
      .should('have.length', numFiles)
  })

  it('can search by file name', () => {
    cy.mount(() => (<FileChooser files={ allFiles } />))
    cy.get(filenameInputSelector)
      .first()
      .type("random string")
  })

  it('shows loading text when loading', () => {
    const loading = ref(true)
    cy.mount(() => (<div>
      <button data-testid="toggle-button" onClick={() => loading.value = !loading.value}>Toggle Loading</button>
      <FileChooser files={ allFiles } loading={ loading.value } /></div>))
      .get(loadingSelector)
      .should('be.visible')
      .get('[data-testid=toggle-button]')
      .click()
      .get(loadingSelector).should('not.be.visible')
      .get('[data-testid=toggle-button]')
      .click()
      .get(loadingSelector).should('be.visible')
  })
})