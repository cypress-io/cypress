<template>
  <StudioPanelContainer
    :event-manager="props.eventManager"
    data-cy="studio-error-panel"
    container-class="text-center"
  >
    <div class="relative">
      <IconTechnologyDashboardFail
        size="48"
        stroke-color="gray-500"
        fill-color="gray-900"
        secondary-fill-color="red-200"
        secondary-stroke-color="red-500"
      />
    </div>

    <div class="flex flex-col items-center gap-[4px] max-w-[448px]">
      <h2 class="text-white text-[16px] leading-[24px] font-medium">
        Something went wrong
      </h2>
      <p class="text-gray-400 text-[16px] leading-[24px]">
        There was a problem with Cypress Studio. Our team has been notified.
        If the problem persists, please try again later.
      </p>
    </div>

    <Button
      variant="outline-dark"
      size="32"
      data-cy="studio-error-retry-button"
      @click="onRetry"
    >
      <IconActionRefresh
        size="16"
        class="mr-2 pt-[1px]"
        stroke-color="gray-500"
      />
      Retry
    </Button>
  </StudioPanelContainer>
</template>

<script lang="ts" setup>
import Button from '@cypress-design/vue-button'
import { IconTechnologyDashboardFail, IconActionRefresh } from '@cypress-design/vue-icon'
import StudioPanelContainer from './StudioPanelContainer.vue'
import type { EventManager } from '../runner/event-manager'

const props = defineProps<{
  eventManager: EventManager
  onRetry: () => void
}>()
</script>
