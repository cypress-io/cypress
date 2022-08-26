<template>
  <div data-cy="specs-list-row">
    <component
      :is="isLeaf ? 'RouterLink' : 'div'"
      class="h-full outline-none ring-inset grid pr-20px grid-cols-[1fr,160px,160px] group md:grid-cols-[1fr,160px,160px,180px] focus:outline-transparent focus-within:ring-indigo-300 focus-within:ring-1 children:cursor-pointer"
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
        <div
          ref="cloudColumnLatestRuns"
          class="relative"
        >
          <slot
            v-if="!shouldShowHoverButtonRuns"
            name="latest-runs"
          />
          <div
            v-if="shouldShowHoverButtonRuns"
            ref="connectButtonRuns"
            class="inset-y-1 right-0 absolute"
          >
            <slot
              name="connect-button"
            />
          </div>
        </div>
        <div
          ref="cloudColumnAverageDuration"
          class="relative hidden md:block"
        >
          <slot
            v-if="!shouldShowHoverButtonDuration"
            name="average-duration"
          />
          <div
            v-if="shouldShowHoverButtonDuration"
            ref="connectButtonDuration"
            class="inset-y-1 right-0 absolute"
          >
            <slot
              name="connect-button"
            />
          </div>
        </div>
      </template>
    </component>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useTimeout, useTimeoutFn, useElementHover } from '@vueuse/core'
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

const cloudColumnLatestRuns = ref()
const cloudColumnAverageDuration = ref()
const connectButtonRuns = ref()
const connectButtonDuration = ref()

const shouldShowHoverButtonRuns = ref(false)
const shouldShowHoverButtonDuration = ref(false)

const isHoveredLatestRuns = useElementHover(cloudColumnLatestRuns)
const isHoveredAverageDuration = useElementHover(cloudColumnAverageDuration)
const isHoveredConnectButtonRuns = useElementHover(connectButtonRuns)
const isHoveredConnectButtonDuration = useElementHover(connectButtonDuration)

function createWatchFunction (
  isColumnHovered: Ref<boolean>,
  isButtonHovered: Ref<boolean>,
  shouldShowButton: Ref<boolean>,
) {
  let controls

  return () => {
    if (controls) {
      controls.stop()
    }

    if (isButtonHovered.value) {
      isColumnHovered.value = false
    }

    if (isColumnHovered.value || isButtonHovered.value) {
      if (shouldShowButton.value) return

      controls = useTimeoutFn(() => {
        shouldShowButton.value = true
      }, 200)
    } else if (!isColumnHovered.value && !isButtonHovered.value) {
      shouldShowButton.value = false
    }
  }
}

watch([isHoveredLatestRuns, isHoveredConnectButtonRuns],
  createWatchFunction(isHoveredLatestRuns, isHoveredConnectButtonRuns, shouldShowHoverButtonRuns))

watch([isHoveredAverageDuration, isHoveredConnectButtonDuration],
  createWatchFunction(isHoveredAverageDuration, isHoveredConnectButtonDuration, shouldShowHoverButtonDuration))

</script>
