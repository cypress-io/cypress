<template>
  <div class="relative">
    <!-- leave-to classes are marked absolute to allow the entering component to
    animate on top of the leaving component, creating a fading animation with no thrashing -->
    <transition
      enter-from-class="opacity-0"
      enter-active-class="transition duration-300 ease-out"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100 absolute"
      leave-active-class="transition duration-300 ease-in absolute"
      leave-to-class="opacity-0 absolute"
    >
      <slot
        :key="step"
        :step="step"
        :totalSteps="totalSteps"
        :incrementStep="incrementStep"
        :decrementStep="decrementStep"
        :restart="restart"
      />
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'

const props = defineProps<{modelValue: number, totalSteps: number}>()
const emit = defineEmits(['update:modelValue'])
const step = useVModel(props, 'modelValue', emit)

const incrementStep = () => step.value += 1
const decrementStep = () => step.value -= 1
const restart = () => step.value = 0

</script>
