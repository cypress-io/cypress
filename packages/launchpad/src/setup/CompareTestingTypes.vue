<template>
  <div class="flex justify-around">
    <CompareTestingCard
      class="w-full border-r p-24px"
      title="End-to-end Tests:"
      :code="code"
      :list-items="e2eItems"
    />
    <CompareTestingCard
      class="w-full border-l p-24px"
      title="Component Tests:"
      :code="code"
      :list-items="ctItems"
    />
  </div>
</template>

<script setup lang="ts">
import CompareTestingCard from './CompareTestingCard.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

const code = `let code = \'here\'
// more code
// mutliline things


`

const e2eItems = [t('welcomePage.compareTypes.e2ebullet1'), t('welcomePage.compareTypes.e2ebullet2'), t('welcomePage.compareTypes.e2ebullet3')]
const ctItems = [t('welcomePage.compareTypes.ctBullet1'), t('welcomePage.compareTypes.ctBullet2'), t('welcomePage.compareTypes.ctBullet3')]
</script>
