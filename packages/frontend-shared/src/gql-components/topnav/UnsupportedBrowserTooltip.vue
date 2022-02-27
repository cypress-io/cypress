<template>
  <div
    data-cy="unsupported-browser-tooltip"
    @mouseenter="showTooltip()"
    @mouseleave="hideTooltip()"
  >
    <slot />
    <transition
      :name="`unsupported-browser-enter-to-${placement}`"
      :enter-from-class="`transition-all transform ${placement === 'top' ? 'origin-bottom' : 'origin-top'} scale-y-0`"
      :enter-to-class="`transition-all transform ${placement === 'top' ? 'origin-bottom' : 'origin-top'} scale-y-100`"
    >
      <div
        v-if="scaleUp"
        class="rounded flex h-fit bg-gray-900
                  text-center
                  py-16px px-24px text-gray-300
                  text-size-14px leading-20px z-40 absolute
                  content need-content
                  before:(border-solid border-transparent border-width-8px right-1/2
                  block absolute) "
        :class="{
          'bottom-7 before:(top-full -mr-8px border-b-0 border-t-gray-900)': placement === 'top',
          'top-7 before:(bottom-full -mr-8px border-t-0 border-b-gray-900)': placement === 'bottom'
        }"
        :style="`left: ${tooltipLeft}px; width: ${tooltipWidth}px`"
        role="tooltip"
      >
        <slot name="popper" />
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
// NOTE: This is not currently meant to be a widely-reusable tooltip, but it's probably most of the way there
// It would need to be able to pop open on left & right and might also need a variable-width option instead of just fixed-width
import { ref, nextTick, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  placement?: string
  tooltipWidth?: number
}>(), {
  placement: 'bottom',
  tooltipWidth: 340,
})

const hover = ref(false)
const scaleUp = ref(false)
const tooltipLeft = ref(0)

function placeTooltip () {
  tooltipLeft.value = -1 * props.tooltipWidth / 2 + 8
}

onMounted(() => {
  placeTooltip()
})

function showTooltip () {
  if (hover.value) {
    return
  }

  hover.value = true
  nextTick(() => {
    scaleUp.value = true
  })
}

function hideTooltip () {
  if (!hover.value) {
    return
  }

  hover.value = false
  scaleUp.value = false
}

</script>

<style lang="scss" scoped>
// This issue needs this line
// https://github.com/windicss/windicss/issues/419
.need-content:before{
  content: ''
}
</style>
