<template>
  <button @keypress.space.enter.self="toggle">
    <div @click="toggle">
      <slot
        name="target"
        :open="isOpen"
      />
    </div>
    <div
      :style="{ maxHeight: isOpen ? maxHeight : '0px' }"
      :aria-hidden="isOpen"
      :class="['overflow-scroll', {
        'transition transition-all duration-200': isOpen,
      }]"
    >
      <slot
        v-if="!lazy || lazy && isOpen"
        :toggle="toggle"
        :open="isOpen"
      />
    </div>
  </button>
</template>

<script setup lang="ts">
import { useToggle } from '@vueuse/core'

const props = withDefaults(defineProps<{
  maxHeight?: string
  initiallyOpen?: boolean
  lazy?: boolean
}>(), {
  initiallyOpen: false,
  maxHeight: '500px',
  lazy: false,
})

const [isOpen, toggle] = useToggle(props.initiallyOpen)

</script>
