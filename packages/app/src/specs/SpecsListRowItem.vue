<template>
  <div data-cy="specs-list-row">
    <component
      :is="isLeaf ? 'RouterLink' : 'div'"
      class="h-full outline-none ring-inset grid pr-20px grid-cols-7 group md:grid-cols-9 focus:outline-transparent focus-within:ring-indigo-300 focus-within:ring-1 children:cursor-pointer"
      :to="route"
      :data-cy="isLeaf ? 'spec-item-link' : 'spec-item-directory'"
      @click="emit('toggleRow')"
      @click.meta.prevent="handleCtrlClick"
      @click.ctrl.prevent="handleCtrlClick"
    >
      <div
        data-cy="specs-list-row-file"
        class="col-span-4"
      >
        <slot name="file" />
      </div>
      <template
        v-if="lazyRender"
      >
        <div
          data-cy="specs-list-row-git-info"
          class="col-span-2"
        >
          <slot name="git-info" />
        </div>
        <div>
          <slot name="latest-runs" />
        </div>
        <div class="hidden md:col-span-2 md:block">
          <slot name="average-duration" />
        </div>
      </template>
    </component>
  </div>
</template>

<script setup lang="ts">
import { useTimeout } from '@vueuse/core'
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  isLeaf: boolean
  route?: RouteLocationRaw
}>()

const emit = defineEmits<{
  (event: 'toggleRow'): void
}>()

const lazyRender = useTimeout(50)

function handleCtrlClick (): void {
  // noop intended to reduce the chances of opening tests multiple tabs
  // which is not a supported state in Cypress
}
</script>
