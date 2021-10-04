import { defaultMessages } from '@cy/i18n'
import GlobalPageHeader from './GlobalPageHeader.vue'
import { ref } from 'vue'

const searchSelector = `input[placeholder="${defaultMessages.globalPage.searchPlaceholder}"]`
const fileInputSelector = 'input[type=file]'
const addProjectSelector = '[data-testid=addProjectButton]'

describe('<GlobalPageHeader />', () => {
  beforeEach(() => {
    const search = ref('')

    cy.wrap(search).as('search')
    const fileUploadSpy = cy.spy().as('fileUpload')

    cy.mount(() => (<div class="p-12 overflow-auto resize-x max-w-600px"><GlobalPageHeader onAddProject={fileUploadSpy} vModel={search.value}/></div>))
    .get(fileInputSelector)
    .then(($input) => {
      $input.on('change', fileUploadSpy)
    })
  })

  it('renders and has a reactive input', () => {
    const searchText = 'My project name goes here'

    cy.get(searchSelector).should('be.visible')
    .get(searchSelector).type(searchText)
    .get('@search').its('value').should('eq', searchText)
  })

  it('should not display the file input', () => {
    cy.get(fileInputSelector).should('not.be.visible')
  })

  it('should be accessible', () => {
    cy.get(addProjectSelector)
    .should('have.attr', 'aria-controls', 'fileupload')
  })

  it('should have webkit attributes', () => {
    // These two properties allow us to get the full file path of the file
    cy.get(fileInputSelector).should('have.attr', 'webkitdirectory')
    .get(fileInputSelector).should('have.attr', 'webkitRelativePath')
  })

  it('handles a file upload', () => {
    cy.get(fileInputSelector)
    .attachFile('test-project/cypress.json')
    .get(addProjectSelector)
    .click()
    .get('@fileUpload').should('have.been.called')
  })
})
