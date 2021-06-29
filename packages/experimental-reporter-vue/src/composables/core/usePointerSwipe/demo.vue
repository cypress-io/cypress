<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePointerSwipe } from '.'
import { SwipeDirection } from '../useSwipe'

const target = ref<Element | null>(null)
const container = ref<HTMLElement | null>(null)

const containerWidth = computed(() => container.value?.offsetWidth)

const left = ref('0')
const opacity = ref(1)

const reset = () => {
  left.value = '0'
  opacity.value = 1
}

const { distanceX, isSwiping } = usePointerSwipe(target, {
  onSwipe(e: PointerEvent) {
    if (containerWidth.value) {
      if (distanceX.value < 0) {
        const distance = Math.abs(distanceX.value)
        left.value = `${distance}px`
        opacity.value = 1.25 - distance / containerWidth.value
      }
      else {
        left.value = '0'
        opacity.value = 1
      }
    }
  },
  onSwipeEnd(e: PointerEvent, direction: SwipeDirection) {
    if (distanceX.value < 0 && containerWidth.value && (Math.abs(distanceX.value) / containerWidth.value) >= 0.5) {
      left.value = '100%'
      opacity.value = 0
    }
    else {
      left.value = '0'
      opacity.value = 1
    }
  },
})
</script>

<template>
  <div ref="container" class="bg-gray-200 rounded-xl relative w-full h-[80px] max-w-[600px] m-auto flex items-center justify-center overflow-hidden">
    <button @click="reset">
      Reset
    </button>
    <div
      ref="target"
      class="absolute w-full h-full top-0 left-0 bg-[#3eaf7c] flex items-center justify-center"
      :class="{'transition-all duration-200 ease-linear': !isSwiping}"
      :style="{left, opacity}"
    >
      <p class="flex text-white items-center">
        Swipe <mdi-arrow-right />
      </p>
    </div>
  </div>
</template>
