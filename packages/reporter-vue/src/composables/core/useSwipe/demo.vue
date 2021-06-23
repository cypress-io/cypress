
<script setup lang="ts">
import { computed, ref } from 'vue'
import { SwipeDirection, useSwipe } from '.'

const target = ref<HTMLElement | null>(null)
const container = ref<HTMLElement | null>(null)
const containerWidth = computed(() => container.value?.offsetWidth)
const left = ref('0')
const opacity = ref(1)

const reset = () => {
  left.value = '0'
  opacity.value = 1
}

const { direction, isSwiping, lengthX, lengthY } = useSwipe(
  target, {
    passive: false,
    onSwipe(e: TouchEvent) {
      if (containerWidth.value) {
        if (lengthX.value < 0) {
          const length = Math.abs(lengthX.value)
          left.value = `${length}px`
          opacity.value = 1.1 - length / containerWidth.value
        }
        else {
          left.value = '0'
          opacity.value = 1
        }
      }
    },
    onSwipeEnd(e: TouchEvent, direction: SwipeDirection) {
      if (lengthX.value < 0 && containerWidth.value && (Math.abs(lengthX.value) / containerWidth.value) >= 0.5) {
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
  <div>
    <div ref="container" class="container select-none">
      <button @click="reset">
        Reset
      </button>
      <div ref="target" class="overlay" :class="{animated: !isSwiping}" :style="{left, opacity}">
        <p>Swipe right</p>
      </div>
    </div>
    <p class="status">
      Direction: {{ direction? direction : '-' }} <br>
      lengthX: {{ lengthX }} | lengthY: {{ lengthY }}
    </p>
  </div>
</template>

<style scoped>
.container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #ccc;
  height: 100;
  overflow: hidden;
}

.overlay {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  position: absolute;
  background: #3fb983;
}

.overlay.animated {
  transition: all 0.2s ease-in-out;
}

.overlay > p {
  color: #fff;
  font-weight: bold;
  text-align: center;
  overflow:hidden;
  white-space: nowrap;
}

.status {
  text-align: center;
}
</style>
