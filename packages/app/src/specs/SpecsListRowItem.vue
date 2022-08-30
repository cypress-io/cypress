<template>
  <div data-cy="specs-list-row">
    <component
      :is="isLeaf ? 'RouterLink' : 'div'"
      class="h-full outline-none ring-inset grid pr-20px group focus:outline-transparent focus-within:ring-indigo-300 focus-within:ring-1 children:cursor-pointer"
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
        v-if="lazyRender"
      >
        <div
          data-cy="specs-list-row-git-info"
        >
          <slot name="git-info" />
        </div>
        <SpecsListHoverCell
          data-cy="specs-list-row-latest-runs"
          :is-hover-disabled="isProjectConnected"
        >
          <template #content>
            <slot name="latest-runs" />
          </template>
          <template #hover>
            <slot
              name="connect-button"
              utmMedium="Specs Latest Runs Empty State"
            />
          </template>
        </SpecsListHoverCell>
        <SpecsListHoverCell
          data-cy="specs-list-row-average-duration"
          :is-hover-disabled="isProjectConnected"
          class="hidden md:block"
        >
          <template #content>
            <slot name="average-duration" />
          </template>
          <template #hover>
            <slot
              name="connect-button"
              utmMedium="Specs Average Duration Empty State"
            />
          </template>
        </SpecsListHoverCell>
      </template>
    </component>
  </div>
</template>

<script setup lang="ts">
import SpecsListHoverCell from './SpecsListHoverCell.vue'

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
