// tslint:disable-next-line: no-implicit-dependencies - need to handle this
import { defaultMessages } from '@cy/i18n'
import GlobalPageHeader from './GlobalPageHeader.vue'
import { ref } from 'vue'

const searchLabel = defaultMessages.globalPage.searchPlaceholder
const dropzoneSelector = '[data-cy="dropzone"] > div'
const fileInputSelector = 'input[type=file]'
const addProjectSelector = '[data-cy=addProjectButton]'

describe('<GlobalPageHeader />', () => {
  beforeEach(() => {
    const search = ref('')

    cy.wrap(search).as('search')
    const fileUploadSpy = cy.spy().as('fileUpload')

    // @ts-ignore = vModel is v-model in vue
    cy.mount(() => (<div class="p-12 overflow-auto resize-x max-w-[600px]"><GlobalPageHeader onAddProject={fileUploadSpy} vModel={search.value}/></div>))

    cy.contains('button', defaultMessages.globalPage.addProjectButton)
    .click()
    .get(fileInputSelector)
    .then(($input) => {
      $input.on('change', fileUploadSpy)
    })
  })

  it('renders and has a reactive input', () => {
    const searchText = 'My project name goes here'

    cy.findByLabelText(searchLabel)
    .type(searchText)
    .get('@search').its('value').should('eq', searchText)
  })

  it('should not display the file input', () => {
    cy.get(fileInputSelector).should('not.be.visible')
  })

  it('should have webkit attributes', () => {
    // These two properties allow us to get the full file path of the file
    cy.get(fileInputSelector).should('have.attr', 'webkitdirectory')
    .get(fileInputSelector).should('have.attr', 'webkitRelativePath')
  })

  it('handles a file upload', () => {
    cy.get(dropzoneSelector)
    .selectFile('cypress/fixtures/test-project/cypress.config.ts', { action: 'drag-drop' })
    .get(addProjectSelector)
    .click()
    .get('@fileUpload').should('have.been.called')
  })
})
