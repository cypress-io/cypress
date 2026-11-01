import Button from './Button.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these module imports
import IconCoffee from '~icons/mdi/coffee'
import { createRouter, createWebHistory } from 'vue-router'

const prefixIcon = () => <IconCoffee data-cy="coffee-icon"/>

describe('<Button />', { viewportWidth: 300, viewportHeight: 400 }, () => {
  it('playground', { viewportWidth: 300, viewportHeight: 800 }, () => {
    cy.mount(() => (
      <div class="grid p-6 gap-2">
        <Button size="md">Primary with text</Button>
        <Button size="lg">Primary with text</Button>
        <Button variant="outline" prefixIcon={IconCoffee}>Outline with text and icon</Button>
        <Button variant="outline">Outline with text</Button>
        <Button variant="outline" disabled>Outline disabled</Button>
        <Button disabled>Primary disabled</Button>
        <Button prefixIcon={prefixIcon}>Has a Prefix Icon</Button>
        <Button variant="text">Text with text</Button>
        <Button variant="text" disabled>Text with text disabled</Button>
        <Button variant="white" size="md">White with text</Button>
        <Button variant="white" size="md" disabled>White with text disabled</Button>
      </div>
    ))

    cy.percySnapshot()
  })

  it('can render an external link', () => {
    cy.mount(() => (
      <Button href="https://test.test">test</Button>
    ))

    cy.contains('a', 'test').should('have.attr', 'data-cy', 'external')
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

  it('renders button as disabled with disabled prop', () => {
    cy.mount(() => (
      <Button disabled>test</Button>
    ))

    cy.contains('button', 'test').should('be.disabled')
  })

  // context for disabled link pattern: https://www.scottohara.me/blog/2021/05/28/disabled-links.html
  it('handles "disabled" links', () => {
    cy.mount(() => (
      <Button href="https://test.test" disabled>test</Button>
    ))

    cy.contains('a', 'test').should('not.have.attr', 'href')
    cy.contains('a', 'test').should('have.attr', 'aria-disabled')
    cy.contains('a', 'test').should('have.attr', 'role', 'link')
  })

  it('renders prefix icon', () => {
    cy.mount(() => (
      <Button prefixIcon={prefixIcon}>Has a Prefix Icon</Button>
    ))

    cy.get('[data-cy="coffee-icon"]').should('be.visible')
  })

  it('renders button as disabled with a disabled and to prop', () => {
    cy.mount(() => (
      <Button disabled to="cypress.io"> test </Button>
    ))

    cy.contains('a', 'test').should('not.have.attr', 'href')
    cy.contains('a', 'test').should('have.attr', 'aria-disabled', 'true')
    cy.contains('a', 'test').should('have.attr', 'role', 'link')
  })

  it('does not allow hocus styling when disabled', () => {
    const buttonVariants = ['text', 'primary', 'outline', 'white'] as const

    cy.mount(() => <div>{buttonVariants.map((variant) => <Button variant={variant} disabled>{variant}</Button>)}</div>)

    for (const variant of buttonVariants) {
      cy.contains('button', variant).realHover()
      .should('not.have.class', 'hocus-default')
    }
  })
})
