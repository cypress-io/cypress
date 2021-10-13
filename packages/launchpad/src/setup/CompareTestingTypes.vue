<template>
  <div class="flex justify-around">
    <CompareTestingCard
      class="w-full p-24px"
      title="End-to-end Tests:"
      :code="e2eCode"
      :list-items="e2eItems"
    />
    <CompareTestingCard
      class="w-full p-24px"
      title="Component Tests:"
      :code="ctCode"
      :list-items="ctItems"
    />
  </div>
</template>

<script setup lang="ts">
import CompareTestingCard from './CompareTestingCard.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

// these are code examples so should not trigger linter
/* eslint-disable no-irregular-whitespace */
const ctCode = `import Button from ‘design-system’
​
it(‘clicks the confirm button’) {
  cy.mount(<Button>)
  cy.get(‘Button’).click()
}
`

const e2eCode = `it(‘clicks the confirm button’) { \n  cy.visit(‘https://yourwebsite.com’) \n  cy.get(‘button[type=submit]’).click()
}

`

const e2eItems = [t('welcomePage.compareTypes.e2ebullet1'), t('welcomePage.compareTypes.e2ebullet2'), t('welcomePage.compareTypes.e2ebullet3')]
const ctItems = [t('welcomePage.compareTypes.ctBullet1'), t('welcomePage.compareTypes.ctBullet2'), t('welcomePage.compareTypes.ctBullet3')]
</script>
