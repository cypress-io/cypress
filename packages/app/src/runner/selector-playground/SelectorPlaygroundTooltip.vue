<template>
  <Tooltip
    :triggers="[]"
    :hide-triggers="[]"
    :distance="8"
    hide-arrow
    :auto-hide="false"
    :shown="shown"
    handle-resize
  >
    <div
      :key="'popover-container'"
      @mouseover="mouseOver"
      @mouseleave="mouseLeave"
      @click="click"
    >
      <slot />
    </div>
    <template #popper>
      <div
        class="whitespace-nowrap"
        data-cy="selector-playground-tooltip"
      >
        {{ textToShow }}
      </div>
    </template>
  </Tooltip>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { promiseTimeout } from '@vueuse/core'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'

const props = defineProps<{
  hoverText: string
  clickText?: string
}>()

const shown = ref(false)
const textToShow = ref(props.hoverText)

function mouseOver () {
  shown.value = true
}

async function mouseLeave () {
  shown.value = false
  await promiseTimeout(200)
  textToShow.value = props.hoverText
}

function click () {
  textToShow.value = props.clickText ?? props.hoverText
}

</script>
