<script setup lang="ts">
import { defineProps, defineEmit, ref, watch } from 'vue'
import { useMouseInElement, useVModel, useEventListener } from '@vueuse/core'

const scrubber = ref()
const scrubbing = ref(false)
const pendingValue = ref(0)

useEventListener('mouseup', () => scrubbing.value = false)

const emit = defineEmit(['update:modelValue'])
const props = defineProps({
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  secondary: { type: Number, default: 0 },
  modelValue: { type: Number, required: true },
})

const value = useVModel(props, 'modelValue', emit)
const { elementX, elementWidth } = useMouseInElement(scrubber)

watch([scrubbing, elementX], () => {
  const progress = Math.max(0, Math.min(1, (elementX.value) / elementWidth.value))
  pendingValue.value = progress * props.max
  if (scrubbing.value)
    value.value = pendingValue.value
})
</script>

<template>
  <div ref="scrubber" class="relative h-2 rounded cursor-pointer select-none bg-black dark:bg-white dark:bg-opacity-10 bg-opacity-20" @mousedown="scrubbing = true">
    <div class="relative overflow-hidden h-full w-full rounded">
      <div class="h-full absolute opacity-30 left-0 top-0 bg-emerald-700 w-full rounded" :style="{ 'transform': `translateX(${ secondary / max * 100 - 100 }%)` }" />
      <div class="relative h-full w-full bg-emerald-500 rounded" :style="{ 'transform': `translateX(${ value / max * 100 - 100 }%)` }" />
    </div>
    <div class="absolute inset-0 hover:opacity-100 opacity-0" :class="{ '!opacity-100': scrubbing }">
      <slot :pendingValue="pendingValue" :position="`${Math.max(0, Math.min(elementX, elementWidth))}px`" />
    </div>
  </div>
</template>
