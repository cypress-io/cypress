import RouterButton from './RouterButton.vue'
import 'vue-router'

describe('<RouterButton />', { viewportWidth: 300, viewportHeight: 400 }, () => {
  it('can render a Router Link', () => {
    cy.mount(() => (
      <RouterButton variant="link" size="32" to={{ path: '/test', query: { example: 'param' } }}>test</RouterButton>
    ))

    cy.contains('a', 'test')
    .should('have.attr', 'href')
    .and('include', '/test?example=param')
  })

  it('renders button with a "to" prop', () => {
    cy.mount(() => (
      <RouterButton variant="link" size="32" to="cypress.io" disabled> test </RouterButton>
    ))

    cy.contains('a', 'test').should('not.have.attr', 'href')
    cy.contains('a', 'test').should('have.attr', 'aria-disabled', 'true')
    cy.contains('a', 'test').should('have.attr', 'role', 'link')
  })
})
