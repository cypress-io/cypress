import Warning from './Warning.vue'

describe('<Warning />', () => {
  it('renders with title and message', () => {
    cy.mount(() => (<div class="p-4"><Warning
      title="The title"
      message="The message"
      dismiss={() => {}}
    /></div>))

    cy.contains('The title')
    cy.contains('The message')
  })

  it('calls dismiss when X is clicked', () => {
    const onDismiss = cy.stub()

    cy.mount(() => (<div class="p-4"><Warning
      title="The title"
      message="The message"
      dismiss={onDismiss}
    /></div>))

    cy.get('[data-cy=dismiss]').click()
    cy.wrap(onDismiss).should('be.called')
  })
})
