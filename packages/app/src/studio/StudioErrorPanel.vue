<template>
  <StudioPanelContainer
    :event-manager="props.eventManager"
    data-cy="studio-error-panel"
    container-class="text-center"
  >
    <div
      data-cy="studio-error-icon"
      class="relative"
    >
      <component :is="props.icon" />
    </div>

    <div class="flex flex-col items-center gap-[4px] max-w-[448px]">
      <h2
        data-cy="studio-error-title"
        class="text-white text-[16px] leading-[24px] font-medium"
      >
        {{ props.title }}
      </h2>
      <p
        data-cy="studio-error-message"
        class="text-gray-400 text-[16px] leading-[24px]"
      >
        {{ props.message }}
      </p>
    </div>

    <div class="flex gap-3">
      <Button
        v-if="props.learnMoreUrl"
        variant="outline-dark"
        size="32"
        data-cy="studio-error-learn-more-button"
        @click="() => props.eventManager?.ws?.emit('external:open', props.learnMoreUrl)"
      >
        Learn more
      </Button>
      <Button
        variant="outline-dark"
        size="32"
        data-cy="studio-error-retry-button"
        @click="props.onRetry"
      >
        <IconActionRefresh
          size="16"
          class="mr-2 pt-[1px]"
          stroke-color="gray-500"
        />
        Retry
      </Button>
    </div>
  </StudioPanelContainer>
</template>

<script lang="ts" setup>
import { withDefaults, h } from 'vue'
import Button from '@cypress-design/vue-button'
import { IconTechnologyDashboardFail, IconActionRefresh } from '@cypress-design/vue-icon'
import StudioPanelContainer from './StudioPanelContainer.vue'
import type { EventManager } from '../runner/event-manager'

const props = withDefaults(defineProps<{
  eventManager: EventManager
  title?: string
  message?: string
  icon?: any
  learnMoreUrl?: string
  onRetry: () => void
}>(), {
  title: 'Something went wrong',
  message: 'There was a problem with Cypress Studio. Our team has been notified. If the problem persists, please try again later.',
  icon: () => {
    return h(IconTechnologyDashboardFail, {
      size: '48',
      'stroke-color': 'gray-500',
      'fill-color': 'gray-900',
      'secondary-fill-color': 'red-200',
      'secondary-stroke-color': 'red-500',
    })
  },
})
</script>
