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

    cy.get('input[type=file]')
    .then((subject) => attachFileToInputElement(subject[0] as HTMLInputElement))
    .trigger('change', { force: true })
  })
})
