import InlineCodeFragment from './InlineCodeFragment.vue'

describe('<InlineCodeFragment/>', () => {
  it('renders fragment', () => {
    cy.mount(() => <InlineCodeFragment>I am code</InlineCodeFragment>)

    cy.contains('I am code')
    .should('be.visible')
  })
})
