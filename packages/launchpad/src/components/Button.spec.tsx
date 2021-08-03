import Button from './Button.vue'
import IconCoffee from 'virtual:vite-icons/mdi/coffee'

describe('<Button />', () => {
  it('playground', { viewportWidth: 200, viewportHeight: 300 }, () => {
    cy.mount(() => (
      <div class="p-6 grid gap-2">
        <Button size="sm">Primary with text</Button>
        <Button size="md">Primary with text</Button>
        <Button size="lg">Primary with text</Button>
        <Button variant="outline" size="sm" prefixIcon={IconCoffee}>Primary with text</Button>
        <Button variant="outline">Outline with text</Button>
        <Button variant="underline">An Underlined button</Button>
      </div>
    ))
  })
})
