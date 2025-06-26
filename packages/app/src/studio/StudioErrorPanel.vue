<template>
  <div
    class="studio-error-panel border-l border-gray-900 h-screen flex flex-col"
    data-cy="studio-error-panel"
  >
    <header class="border-b border-gray-800 p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <StudioButton :event-manager="props.eventManager" />
        </div>
      </div>
    </header>

    <div class="flex flex-col items-center justify-center w-full h-full gap-[16px] p-[48px_16px_0_16px] text-center">
      <!-- Browser Icon with Error Indicator -->
      <div class="relative">
        <IconTechnologyDashboardFail 
          size="48"
          stroke-color="gray-500"
          fill-color="gray-100"
          secondary-fill-color="red-400"
        />
      </div>
      
      <!-- Error Message -->
      <div class="flex flex-col items-center gap-[4px] max-w-[448px]">
        <h2 class="text-white text-[16px] leading-[24px] font-medium">
          Something went wrong
        </h2>
        <p class="text-gray-400 text-[16px] leading-[24px]">
          There was a problem with data loading. Our team has been notified.
          If the problem persists, please try again later.
        </p>
      </div>
      
      <!-- Retry Button -->
      <Button
        variant="outline-dark"
        size="32"
        data-cy="studio-error-retry-button"
        @click="handleRetry"
      >
        <template #prefix>
          <IconActionRefresh
            size="16"
            stroke-color="gray-500"
          />
        </template>
        Retry
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Button from '@cypress-design/vue-button'
import { IconTechnologyDashboardFail, IconActionRefresh } from '@cypress-design/vue-icon'
import StudioButton from './StudioButton.vue'
import type { EventManager } from '../runner/event-manager'

const props = defineProps<{
  eventManager: EventManager
  onRetry?: () => void
}>()

const handleRetry = () => {
  if (props.onRetry) {
    props.onRetry()
  }
}
</script>

<style scoped lang="scss">
.studio-error-panel {
  background-color: $gray-1100;

  header {
    background-color: $gray-1100;
  }
}
</style> 