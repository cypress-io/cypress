<template>
  <div
    data-cy="debug-pending-splash"
    class="space-around flex"
  >
    <div class="flex flex-col w-full items-center">
      <IconTechnologyDashboardRunning class="mb-16px" />
      <span
        data-cy="title"
        class="font-medium text-lg text-gray-900"
      >
        {{ t('debugPage.pending.title') }}
      </span>
      <div class="font-normal mt-4px text-md text-gray-600">
        {{ t('debugPage.pending.failuresHere') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { IconTechnologyDashboardRunning } from '@cypress-design/vue-icon'

const { t } = useI18n()

</script>
