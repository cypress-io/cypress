<template>
  <div class="relative">
    <!-- leave-to classes are marked absolute to allow the entering component to
    animate on top of the leaving component, creating a fading animation with no thrashing -->
    <transition-group
      enter-from-class="opacity-0"
      enter-active-class="transition duration-300 ease-out"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100 absolute"
      leave-active-class="transition duration-300 ease-in absolute"
      leave-to-class="opacity-0 absolute"
    >
      <slot
        :key="step"
        name="default"
        :step="step"
        :go-back="decrement"
        :go-forward="increment"
        :reset="reset"
      />
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const step = ref(0)

const decrement = () => {
  step.value--
}

const increment = () => {
  step.value++
}

const reset = () => {
  step.value = 0
}

</script>
