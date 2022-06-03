<template>
  <component
    :is="isLeaf ? 'RouterLink' : 'div'"
    class="h-full outline-none border-gray-50 ring-inset grid group focus:outline-transparent focus-within:ring-indigo-300 focus-within:ring-1 children:cursor-pointer"
    :class="[isLeaf ? 'grid-cols-2' : 'grid-cols-1']"
    :to="route"
    data-cy="specs-list-row"
    @click="emit('toggleRow')"
    @click.meta.prevent="handleCtrlClick"
    @click.ctrl.prevent="handleCtrlClick"
  >
    <div>
      <slot name="file" />
    </div>

    <div>
      <slot name="git-info" />
    </div>
  </component>
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
