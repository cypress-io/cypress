<template>
  <!--
    NOTE: This is not currently meant to be a widely-reusable tooltip, but it's probably most of the way there
    It would need to be able to pop open on left & right and might also need a variable-width option instead of just fixed-width
  -->
  <div
    ref="wrapper"
    @mouseenter="showTooltip()"
    @mouseleave="hideTooltip()"
    @click="emit('click')"
  >
    <slot />
    <transition
      name="enter-from-bottom"
      enter-from-class="transition-all transform origin-bottom scale-y-0"
      enter-to-class="transition-all transform origin-bottom scale-y-100"
    >
      <div
        v-if="scaleUp"
        class="rounded flex h-fit
                  bg-gray-900
                  text-center py-16px px-24px
                  text-gray-300 text-size-14px leading-20px
                  absolute content
                  need-content before:border-solid before:border-transparent before:border-width-8px
                  before:right-1/2 before:block before:absolute
                  "
        :class="{
          'bottom-7 before:top-full before:-mr-8px before:border-b-0 before:border-t-gray-900': placement === 'top',
          'top-7 before:bottom-full before:-mr-8px before:border-t-0 before:border-b-gray-900': placement === 'bottom'
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
import { ref, nextTick, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  disabled?:boolean,
  placement?:string,
  tooltipWidth?:number
}>(), {
  disabled: false,
  placement: 'bottom',
  tooltipWidth: 350,
})

const emit = defineEmits(['click'])

const hover = ref(false)
const scaleUp = ref(false)
const tooltipLeft = ref(0)

const wrapper = ref<HTMLDivElement | null>(null)

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
