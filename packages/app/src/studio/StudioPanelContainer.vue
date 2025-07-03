<template>
  <div
    :class="[
      'studio-panel-container border-l border-gray-900 h-screen flex flex-col',
      containerClass
    ]"
    :data-cy="dataCy"
  >
    <header class="border-b border-gray-800 p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <StudioButton :event-manager="eventManager" />
        </div>
      </div>
    </header>

    <div class="flex flex-col items-center justify-center w-full h-full gap-[16px] p-[48px_16px_0_16px]">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import StudioButton from './StudioButton.vue'
import type { EventManager } from '../runner/event-manager'

defineProps<{
  eventManager: EventManager
  dataCy: string
  containerClass?: string
}>()
</script>

<style scoped lang="scss">
.studio-panel-container {
  background-color: $gray-1100;

  header {
    background-color: $gray-1100;
  }
}
</style>
