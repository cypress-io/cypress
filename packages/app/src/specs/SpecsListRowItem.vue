<template>
  <div data-cy="specs-list-row">
    <component
      :is="isLeaf ? 'RouterLink' : 'div'"
      class="h-full outline-none ring-inset grid pr-[20px] focus:outline-transparent focus-within:ring-indigo-300 focus-within:ring-1 children:cursor-pointer"
      :class="gridColumns"
      :to="route"
      :data-cy="isLeaf ? 'spec-item-link' : 'spec-item-directory'"
      @click="emit('toggleRow')"
      @click.meta.prevent="handleCtrlClick"
      @click.ctrl.prevent="handleCtrlClick"
    >
      <div
        data-cy="specs-list-row-file"
      >
        <slot name="file" />
      </div>
      <template
        v-if="lazyRender && isLeaf"
      >
        <div
          data-cy="specs-list-row-git-info"
          class="group"
        >
          <slot name="git-info" />
        </div>
        <div
          data-cy="specs-list-row-latest-runs"
          class="group"
        >
          <slot name="latest-runs" />
        </div>
        <div
          data-cy="specs-list-row-average-duration"
          class="hidden group md:block"
        >
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
  isProjectConnected?: boolean
  gridColumns: string
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
