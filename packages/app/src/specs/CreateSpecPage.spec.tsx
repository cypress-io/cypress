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
  it('renders the "No Specs" footer', () => {
    cy.mount(() => <div class="p-12"><CreateSpecPage testingType="component"/></div>)
    .get(noSpecsMessageSelector)
    .should('be.visible')
    .and('contain.text', messages.noSpecsMessage)
    .get(viewSpecsSelector)
    .should('be.visible')
  })

  it('renders component mode', () => {
    cy.mount(() => <div class="p-12"><CreateSpecPage testingType="component"/></div>)
  })

  it('renders e2e mode', () => {
    cy.mount(() => <div class="p-12"><CreateSpecPage testingType="e2e"/></div>)
  })

  it('renders the correct text for e2e', () => {
    cy.mount(() => <div class="p-12"><CreateSpecPage testingType="e2e"/></div>)
    .get(pageTitleSelector).should('contain.text', messages.page.title)
    .get(pageDescriptionSelector).should('contain.text', messages.page.e2e.description)
  })

  it('renders the correct text for component testing', () => {
    cy.mount(() => <div class="p-12"><CreateSpecPage testingType="component"/></div>)
    .get(pageTitleSelector).should('contain.text', messages.page.title)
    .get(pageDescriptionSelector).should('contain.text', messages.page.component.description)
  })

  it.only('playground', () => {
    const testingType = ref('component')

    cy.mount(() => (
      <div class="p-12 space-y-10 resize overflow-auto">
        { /* Testing Utils */ }
        <Button variant="outline" size="md" onClick={() => testingType.value = testingType.value === 'component' ? 'e2e' : 'component'}>Toggle Testing Types</Button>

        { /* Subject Under Test */ }
        <CreateSpecPage testingType={testingType.value} />
      </div>))
  })
})
