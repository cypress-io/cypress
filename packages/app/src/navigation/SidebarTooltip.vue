<template>
  <div
    ref="wrapper"
    @mouseenter="placeTooltip();showTooltip();"
    @mouseleave="hideTooltip()"
    @click="emit('click')"
  >
    <slot />
    <teleport
      v-if="!disabled && hover"
      to="#tooltip-target"
    >
      <transition
        name="enter-from-left"
        enter-from-class="transition-all transform origin-left scale-x-0"
        enter-to-class="transition-all transform origin-left scale-x-100"
      >
        <div
          v-if="scaleUp"
          class="bg-gray-900 text-gray-50 rounded
                  absolute left-64px h-40px
                  w-176px px-16px mx-12px
                  flex items-center justify-center
                  leading-24px text-size-16px
                  content
                  before:block before:absolute before:right-full before:top-1/2 before:-mt-8px
                  before:border-solid before:border-transparent
                  before:border-width-8px before:border-transparent before:border-r-gray-900 before:border-l-0
                  need-content"
          :class="popperClass"
          :style="`top: ${tooltipTop}px`"
          role="tooltip"
        >
          <slot name="popper" />
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import { ref, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  disabled?:boolean,
  popperTopOffset?:number,
  popperClass?:string,
}>(), {
  disabled: false,
  popperTopOffset: 0,
  popperClass: '',
})

const emit = defineEmits(['click'])

const hover = ref(false)
const scaleUp = ref(false)
const tooltipTop = ref(0)

const wrapper = ref<HTMLDivElement | null>(null)

// We cannot do this in onMounted because
// top will changes after the bar is mounted
function placeTooltip () {
  const { y } = wrapper.value?.getBoundingClientRect() || { y: 0 }

  tooltipTop.value = y + props.popperTopOffset
}

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
