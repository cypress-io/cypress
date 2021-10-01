import { defaultMessages } from '@cy/i18n'
import GlobalPageHeader from './GlobalPageHeader.vue'
import { ref } from 'vue'

const searchSelector = `input[placeholder="${defaultMessages.globalPage.searchPlaceholder}"]`

type FileWebKitDirectory = File & { path: string }

export default function attachFileToInputElement (element: HTMLInputElement) {
  const file = new File([new Blob()], 'cypress.json') as FileWebKitDirectory

  file.path = 'absolute/path/to/cypress.json'

  const dataTransfer = new window.DataTransfer()

  dataTransfer.items.add(file)

  element.files = dataTransfer.files
}

describe('<GlobalPageHeader />', () => {
  it('renders and has a reactive input', () => {
    const search = ref('')

    cy.mount(() => (<div class="p-12 overflow-auto resize-x max-w-600px"><GlobalPageHeader vModel={search.value}/></div>))

    const searchText = 'My project name goes here'

    cy.get(searchSelector).should('be.visible')
    cy.get(searchSelector).type(searchText)
    cy.should(() => expect(search.value).to.equal(searchText))
  })

  it('handles a file upload', () => {
    cy.mount(() => (<div class="p-12 overflow-auto resize-x max-w-600px"><GlobalPageHeader /></div>))
    const fileUploadSpy = cy.spy()

    cy.get('input[file]')
       .as('file-input')
       
       // Test that we open the file picker
       .invoke('on', 'change', fileUploadSpy)

       .get('@file-input')
       // Simulate attaching file to input element
       .then(attachFileToInputElement)
       .get('[data-testid=add-project-button]')
       .click()
       .get(fileUploadSpy).should.have.been.called
       // Since this component does not emit an event
       // you can't tell if `addProject` was added with a valid directory name.
       // I talk about how you could to solve this in another comment.
  })
})
