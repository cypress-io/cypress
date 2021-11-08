import Warning from './Warning.vue'

describe('<Warning />', () => {
  it('renders with title and message', () => {
    cy.mount(<Warning
      title="The title"
      message="The message"
    />)

    cy.contains('The title')
    cy.contains('The message')
  })
})
