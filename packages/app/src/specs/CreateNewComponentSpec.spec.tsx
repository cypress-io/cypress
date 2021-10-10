import CreateNewComponentSpec from './CreateNewComponentSpec.vue'

// import { defaultMessages } from '@cy/i18n'

// const pageTitleSelector = '[data-testid=create-spec-page-title]'
// const pageDescriptionSelector = '[data-testid=create-spec-page-description]'
// const noSpecsMessageSelector = '[data-testid=no-specs-message]'
// const viewSpecsSelector = '[data-testid=view-spec-pattern]'

// const messages = defaultMessages.createSpec

describe('<CreateSpecPage />', () => {
  it('renders', () => {
    cy.mount(() => <div class="border-1 rounded resize max-w-700px overflow-auto p-12"><CreateNewComponentSpec/></div>)
  })
})
