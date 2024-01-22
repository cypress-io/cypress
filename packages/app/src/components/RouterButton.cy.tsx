import RouterButton from './RouterButton.vue'
import { createRouter, createWebHistory } from 'vue-router'

describe('<Button />', { viewportWidth: 300, viewportHeight: 400 }, () => {
  it('can render a Router Link', () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [],
    })

    cy.mount(() => (
      <RouterButton variant="link" size="32" to={{ path: '/test', query: { example: 'param' } }}>test</RouterButton>
    ), {
      global: {
        plugins: [router],
      },
    })

    cy.contains('a', 'test')
    .should('have.attr', 'href')
    .and('include', '/test?example=param')
  })

  it('renders button with a "to" prop', () => {
    cy.mount(() => (
      <RouterButton variant="link" size="32" to="cypress.io"> test </RouterButton>
    ))

    cy.contains('a', 'test').should('not.have.attr', 'href')
    cy.contains('a', 'test').should('have.attr', 'aria-disabled', 'disabled')
    cy.contains('a', 'test').should('have.attr', 'role', 'link')
  })
})
