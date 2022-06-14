<template>
  <div data-cy="specs-list-row">
    <component
      :is="isLeaf ? 'RouterLink' : 'div'"
      class="h-full outline-none border-gray-50 pr-20px ring-inset grid grid-cols-5 group focus:outline-transparent focus-within:ring-indigo-300 focus-within:ring-1 children:cursor-pointer"
      :to="route"
      :data-cy="isLeaf ? 'spec-item-link' : 'spec-item-directory'"
      @click="emit('toggleRow')"
      @click.meta.prevent="handleCtrlClick"
      @click.ctrl.prevent="handleCtrlClick"
    >
      <div
        data-cy="specs-list-row-file"
        class="col-span-2"
      >
        <slot name="file" />
      </div>
      <div
        data-cy="specs-list-row-git-info"
      >
        <slot name="git-info" />
      </div>
      <div>
        <slot name="latest-runs" />
      </div>
      <div>
        <slot name="average-duration" />
      </div>
    </component>
  </div>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  isLeaf: boolean
  route?: RouteLocationRaw
}>()

const emit = defineEmits<{
  (event: 'toggleRow'): void
}>()

function handleCtrlClick (): void {
  // noop intended to reduce the chances of opening tests multiple tabs
  // which is not a supported state in Cypress
}
</script>
