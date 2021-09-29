import { defaultMessages } from '@cy/i18n'
import GlobalPageHeader from './GlobalPageHeader.vue'
import { ref } from 'vue'

const searchSelector = `input[placeholder="${defaultMessages.globalPage.searchPlaceholder}"]`

describe('<GlobalPageHeader />', () => {
  it('renders and has a reactive input', () => {
    const search = ref('')

    cy.mount(() => (<div class="p-12 overflow-auto resize-x max-w-600px"><GlobalPageHeader vModel={search.value}/></div>))

    const searchText = 'My project name goes here'

    cy.get(searchSelector).should('be.visible')
    cy.get(searchSelector).type(searchText)
    cy.should(() => expect(search.value).to.equal(searchText))
  })
})
