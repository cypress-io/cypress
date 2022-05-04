<template>
  <div class="min-h-700px lp-wrapper">
    <h1 class="font-medium text-center pt-20px text-32px text-teal-1000">
      {{ t('migration.landingPage.title') }}
    </h1>
    <p
      class="mx-42px mt-12px text-center mb-32px text-teal-600 text-18px"
    >
      {{ t('migration.landingPage.description') }}
    </p>

    <div class="mx-auto text-center w-688px">
      <div class="bg-white  border-4px-gray-500 h-408px " />
      <div class="flex bg-gray-50 py-16px px-24px gap-8px">
        <Button @click="handleClick">
          {{ t('migration.landingPage.actionContinue') }}
          <template #suffix>
            <i-cy-arrow-right_x16 />
          </template>
        </Button>
        <Button
          href="https://on.cypress.io/changelog"
          variant="outline"
        >
          {{ t('migration.landingPage.linkReleaseNotes') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Button from '@cy/components/Button.vue'

import { useI18n } from '@cy/i18n'
const { t } = useI18n()

const emit = defineEmits<{
  (eventName: 'clearLandingPage', value: void): void
}>()

const handleClick = () => {
  emit('clearLandingPage')
}
</script>

<style scoped>
.lp-wrapper {
  background-image: url("../images/Background.svg")
}
</style>
