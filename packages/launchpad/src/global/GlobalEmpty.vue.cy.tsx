import GlobalEmpty from './GlobalEmpty.vue'

describe('<GlobalEmpty />', () => {
  beforeEach(() => {
    cy.mount(() => (<div
      class="p-12 min-w-[280px] max-w-[650px] overflow-auto resize-x">
      <GlobalEmpty />
    </div>))
  })

  it('renders the empty state', () => {
    cy.contains('Add project')
    cy.contains('Get started by adding your first project below.')

    cy.contains('Drag your project directory here or ')
    cy.contains('browse manually.')

    cy.get('input[type=file]').should('have.length', 1)
  })
})
