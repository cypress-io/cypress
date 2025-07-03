<template>
  <StudioPanelContainer
    :event-manager="props.eventManager"
    data-cy="loading-studio-panel"
    container-class="text-gray-400"
  >
    <Spinner variant="dark" />
    Setting up Cypress Studio...
  </StudioPanelContainer>
</template>

<script lang="ts" setup>
import Spinner from '@cypress-design/vue-spinner/sfc'
import StudioPanelContainer from './StudioPanelContainer.vue'
import type { EventManager } from '../runner/event-manager'

const props = defineProps<{
  eventManager: EventManager
}>()
</script>
