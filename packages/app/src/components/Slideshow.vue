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
      <component
        :is="current.component"
        v-bind="current.props"
        :key="step"
        :step="step"
        :total-steps="steps.length"
        :increment-step="incrementStep"
        :decrement-step="decrementStep"
      />
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed } from 'vue'
import type { Component } from 'vue'

export type SlideshowStep = {
  component: Component
  props: Record<string, any>
}

const props = defineProps<{
  modelValue: number
  steps: SlideshowStep[]
}>()
const emit = defineEmits(['update:modelValue', 'slideshowComplete'])
const step = useVModel(props, 'modelValue', emit)

const current = computed(() => props.steps[step.value])

const incrementStep = () => {
  const nextStep = step.value + 1

  if (nextStep < props.steps.length) {
    step.value = nextStep
  } else {
    step.value = 0
    emit('slideshowComplete')
  }
}
const decrementStep = () => step.value -= 1

</script>
