import Button from '@cy/components/Button.vue'
import CreateSpecPage from './CreateSpecPage.vue'
import { ref } from 'vue'
import { defaultMessages } from '@cy/i18n'

const pageTitleSelector = '[data-testid=create-spec-page-title]'
const pageDescriptionSelector = '[data-testid=create-spec-page-description]'
const noSpecsMessageSelector = '[data-testid=no-specs-message]'
const viewSpecsSelector = '[data-testid=view-spec-pattern]'

const messages = defaultMessages.createSpec

describe('<CreateSpecPage />', () => {
  describe('mounting in component type', () => {
    beforeEach(() => {
      cy.mount(() => <div class="p-12"><CreateSpecPage gql={{ activeTestingType: 'component' }}/></div>)
    })

    it('renders the "No Specs" footer', () => {
      cy.get(noSpecsMessageSelector)
      .should('be.visible')
      .and('contain.text', messages.noSpecsMessage)
      .get(viewSpecsSelector)
      .should('be.visible')
    })

    it('renders component mode', () => {
      expect(true).to.be.true
    })

    it('renders the correct text for component testing', () => {
      cy.get(pageTitleSelector).should('contain.text', messages.page.title)
      .get(pageDescriptionSelector).should('contain.text', messages.page.component.description)
    })
  })

  describe('mounting in e2e mode', () => {
    beforeEach(() => {
      cy.mount(() => <div class="p-12"><CreateSpecPage gql={{ activeTestingType: 'e2e' }}/></div>)
    })

    it('renders e2e mode', () => {
      expect(true).to.be.true
    })

    it('renders the correct text', () => {
      cy.get(pageTitleSelector)
      .should('contain.text', messages.page.title)
      .get(pageDescriptionSelector).should('contain.text', messages.page.e2e.description)
    })
  })

  it('playground', () => {
    const testingType = ref('component')

    cy.mount(() => (
      <div class="p-12 space-y-10 resize overflow-auto">
        { /* Testing Utils */ }
        <Button variant="outline"
          size="md"
          onClick={() => testingType.value = testingType.value === 'component' ? 'e2e' : 'component'}>
          Toggle Testing Types
        </Button>

        { /* Subject Under Test */ }
        <CreateSpecPage gql={{
          activeTestingType: testingType.value,
        }} />
      </div>))
  })
})
