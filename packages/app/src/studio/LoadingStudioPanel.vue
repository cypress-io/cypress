<template>
  <div
    class="loading-studio-panel border-l border-gray-900 h-screen flex flex-col"
    data-cy="loading-studio-panel"
  >
    <header class="border-b border-gray-800 p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <StudioButton :event-manager="props.eventManager" />
        </div>
      </div>
    </header>

    <div class="flex flex-col items-center justify-center w-full h-full gap-[16px] p-[48px_16px_0_16px] text-gray-400">
      <Spinner variant="dark" />
      Setting up Cypress Studio...
    </div>
  </div>
</template>

<script lang="ts" setup>
import Spinner from '@cypress-design/vue-spinner/sfc'
import StudioButton from './StudioButton.vue'
import type { EventManager } from '../runner/event-manager'

const props = defineProps<{
  eventManager: EventManager
}>()

</script>

<style scoped lang="scss">

.loading-studio-panel {
  background-color: $gray-1100;

  header {
    background-color: $gray-1100;
  }
}
</style>
