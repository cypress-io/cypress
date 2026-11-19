<template>
  <div class="grid-cols-2 sm:grid md:w-full">
    <CompareTestingCard
      data-cy="end-to-end-comparison"
      class="border-r border-r-gray-100"
      title="End-to-end tests:"
      :code="e2eCode"
      :list-items="e2eItems"
      code-fragment="cy.visit()"
    />
    <CompareTestingCard
      data-cy="component-comparison"
      title="Component tests:"
      :code="ctCode"
      :list-items="ctItems"
      code-fragment="cy.mount()"
    />
  </div>
</template>

<script setup lang="ts">
import CompareTestingCard from './CompareTestingCard.vue'

const ctCode = `
import BaseModal from './BaseModal'

it('closes when the X button is pressed', () => {
  cy.mount(<BaseModal />)
    .get('[aria-label=Close]')
    .click()
    .get('[data-testid=modal]')
    .should('not.exist')
})
`

const e2eCode = `
it('only shows a modal on first visit', () => {
  cy.visit('http://localhost:3000/')
    .get('[data-testid=modal]')
    .should('be.visible')
    .get('[aria-label=Close]')
    .click()

    // should not load a second time
    .reload()
    .get('[data-testid=modal]')
    .should('not.exist')
})
`

const e2eItems = [
  'Visit URLs via',
  'Test flows and functionality across multiple pages',
  'Ideal for testing integrated flows in CD workflows',
]

const ctItems = [
  'Import components via',
  'Test individual components of a design system in isolation',
  'Ideal for testing isolated flows and components in CI',
]
</script>
