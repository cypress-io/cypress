<template>
  <div class="grid-cols-2 sm:grid md:w-full">
    <CompareTestingCard
      data-cy="end-to-end-comparison"
      class="border-r border-r-gray-100"
      :title="t('welcomePage.compareTypes.content.e2eTitle') + ':'"
      :code="e2eCode"
      :list-items="e2eItems"
      code-fragment="cy.visit()"
    />
    <CompareTestingCard
      data-cy="component-comparison"
      :title="t('welcomePage.compareTypes.content.componentTitle') + ':'"
      :code="ctCode"
      :list-items="ctItems"
      code-fragment="cy.mount()"
    />
  </div>
</template>

<script setup lang="ts">
import CompareTestingCard from './CompareTestingCard.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

// these are code examples so should not trigger linter
/* eslint-disable no-irregular-whitespace */
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
  t('welcomePage.compareTypes.content.e2eBullet1'),
  t('welcomePage.compareTypes.content.e2eBullet2'),
  t('welcomePage.compareTypes.content.e2eBullet3'),
]

const ctItems = [
  t('welcomePage.compareTypes.content.ctBullet1'),
  t('welcomePage.compareTypes.content.ctBullet2'),
  t('welcomePage.compareTypes.content.ctBullet3'),
]
</script>
