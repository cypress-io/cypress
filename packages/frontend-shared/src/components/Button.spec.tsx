import Button from './Button.vue'
import IconCoffee from '~icons/mdi/coffee'

describe('<Button />', { viewportWidth: 300, viewportHeight: 300 }, () => {
  it('playground', () => {
    cy.mount(() => (
      <div class="p-6 grid gap-2">
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

  it('can render an interal link', () => {
    cy.mount(() => (
      <Button href="/test" internalLink={true}>test</Button>
    ))

    cy.contains('a', 'test').should('not.have.attr', 'data-cy')
  })
})
