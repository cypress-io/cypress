<template>
  <Tooltip
    :triggers="['hover', 'focus']"
    :hide-triggers="['hover', 'focus']"
    :distance="8"
    hide-arrow
    handle-resize
    @mouseenter="mouseEnter"
    @mouseleave="mouseLeave"
    @click="click"
  >
    <slot :focus="focus" />
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
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'

const props = defineProps<{
  hoverText: string
  clickText?: string
}>()

const shown = ref(false)
const textToShow = ref(props.hoverText)

function mouseEnter () {
  textToShow.value = props.hoverText
  shown.value = true
}

function mouseLeave () {
  shown.value = false
}

function click () {
  textToShow.value = props.clickText ?? props.hoverText
}

function focus () {
  textToShow.value = props.hoverText
}

</script>
