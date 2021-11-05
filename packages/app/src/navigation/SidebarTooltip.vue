<template>
  <div
    ref="wrapper"
    @mouseover="placeTooltip();hover=true"
    @mouseout="hover=false"
    @click="emit('click')"
  >
    <slot />
    <teleport
      v-if="!disabled && hover"
      to="#tooltip-target"
    >
      <div
        class="bg-gray-900 text-gray-50 rounded
                  absolute left-64px h-40px
                  w-160px px-16px mx-12px
                  flex items-center justify-center
                  leading-24px text-size-16px
                  content
                  before:block before:absolute before:right-full before:top-1/2 before:-mt-8px
                  before:border-solid before:border-transparent
                  before:border-width-8px before:border-transparent before:border-r-gray-900 before:border-l-0
                  need-content"
        :class="poppperClass"
        :style="`top: ${tooltipTop}px`"
        role="tooltip"
      >
        <slot name="popper" />
      </div>
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  disabled?:boolean,
  popperTopOffset?:number,
  poppperClass?:string,
}>(), {
  disabled: false,
  popperTopOffset: 0,
  poppperClass: '',
})

const emit = defineEmits(['click'])

const hover = ref(false)
const tooltipTop = ref(0)

const wrapper = ref<HTMLDivElement | null>(null)

// We cannot do this in onMounted because
// top will changes after the bar is mounted
function placeTooltip () {
  const { y } = wrapper.value?.getBoundingClientRect() || { y: 0 }

  tooltipTop.value = y + props.popperTopOffset
}

</script>

<style lang="scss" scoped>
// This issue needs this line
// https://github.com/windicss/windicss/issues/419
.need-content:before{
  content: ''
}
</style>
