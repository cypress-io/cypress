<template>
  <StudioPanelContainer
    :event-manager="props.eventManager"
    data-cy="studio-error-panel"
    container-class="text-center"
  >
    <div class="relative">
      <component
        :is="props.icon"
        size="48"
        v-bind="props.iconProps"
      />
    </div>

    <div class="flex flex-col items-center gap-[4px] max-w-[448px]">
      <h2 class="text-white text-[16px] leading-[24px] font-medium">
        {{ props.title }}
      </h2>
      <p class="text-gray-400 text-[16px] leading-[24px]">
        {{ props.message }}
      </p>
    </div>

    <Button
      v-if="props.showLearnMore"
      variant="outline-dark"
      size="32"
      data-cy="studio-error-learn-more-button"
      @click="() => props.eventManager?.ws?.emit('external:open', props.learnMoreUrl)"
    >
      Learn more
    </Button>
    <Button
      v-if="props.showRetry"
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
  </StudioPanelContainer>
</template>

<script lang="ts" setup>
import { withDefaults } from 'vue'
import Button from '@cypress-design/vue-button'
import { IconTechnologyDashboardFail, IconActionRefresh } from '@cypress-design/vue-icon'
import StudioPanelContainer from './StudioPanelContainer.vue'
import type { EventManager } from '../runner/event-manager'

const props = withDefaults(defineProps<{
  eventManager: EventManager
  title?: string
  message?: string
  icon?: any
  iconProps?: Record<string, any>
  showRetry?: boolean
  showLearnMore?: boolean
  learnMoreUrl?: string
  onRetry?: () => void
}>(), {
  title: 'Something went wrong',
  message: 'There was a problem with Cypress Studio. Our team has been notified. If the problem persists, please try again later.',
  icon: IconTechnologyDashboardFail,
  iconProps: () => {
    return {
      'stroke-color': 'gray-500',
      'fill-color': 'gray-900',
      'secondary-fill-color': 'red-200',
      'secondary-stroke-color': 'red-500',
    }
  },
  showRetry: true,
  learnMoreUrl: 'https://on.cypress.io/proxy-configuration',
  onRetry: () => {},
})
</script>
