<template>
  <div
    data-cy="no-runs"
    class="flex flex-col mx-auto min-h-full max-w-688px leading-24px items-center justify-center"
  >
    <i-cy-dashboard-checkmark_x48 class="h-48px w-48px icon-dark-gray-500 icon-light-gray-100" />
    <h2 class="mt-32px mb-8px text-gray-900 text-18px">
      {{ t("runs.empty.title") }}
    </h2>
    <p class="h-48px mb-8px text-gray-600">
      {{ t("runs.empty.description") }}
    </p>
    <RecordPromptAdapter class="w-full" />
  </div>
</template>

<script lang="ts" setup>
import RecordPromptAdapter from '@packages/frontend-shared/src/gql-components/RecordPromptAdapter.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()
</script>

<style scoped lang="scss">
// make the marker black while the rest of the line is gray
ol li::marker{
  @apply text-gray-900;
}
</style>
