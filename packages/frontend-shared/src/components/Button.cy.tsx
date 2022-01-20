import Button from './Button.vue'
import IconCoffee from '~icons/mdi/coffee'
import { createRouter, createWebHistory } from 'vue-router'

describe('<Button />', { viewportWidth: 300, viewportHeight: 300 }, () => {
  it('playground', () => {
    cy.mount(() => (
      <div class="grid p-6 gap-2">
        <Button size="sm">Primary with text</Button>
        <Button size="md">Primary with text</Button>
        <Button size="lg">Primary with text</Button>
        <Button variant="outline" size="sm" prefixIcon={IconCoffee}>Primary with text</Button>
        <Button variant="outline">Outline with text</Button>
        {/* <Button variant="underline">An Underlined button</Button> */}
      </div>
    ))
  })

  it('can render an exteral link', () => {
    cy.mount(() => (
      <Button href="https://test.test">test</Button>
    ))

    cy.contains('a', 'test').should('have.attr', 'data-cy', 'external')
  })

  it('can render an internal link', () => {
    cy.mount(() => (
      <Button href="/test" internalLink={true}>test</Button>
    ))

    cy.contains('a', 'test').should('have.attr', 'href', '/test')
    cy.contains('a', 'test').should('not.have.attr', 'data-cy')
  })

  it('can render a Router Link', () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [],
    })

    cy.mount(() => (
      <Button to={{ path: '/test', query: { example: 'param' } }}>test</Button>
    ), {
      global: {
        plugins: [router],
      },
    })

    cy.contains('a', 'test')
    .should('have.attr', 'href')
    .and('include', '/test?example=param')
  })

  it('shows disabled properly', () => {
    cy.mount(() => (
      <Button disabled>test</Button>
    ))
  })
})
