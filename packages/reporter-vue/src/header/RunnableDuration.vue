<template>
  <span>{{ durationFormatted }}</span>
</template>

<script lang="ts" setup >
import { defineProps, computed } from "vue";

const props = defineProps({
  duration: {
    type: Number,
    optional: true
  },
})

const durationFormatted = computed((): string => {
  if (props.duration) {
    return (props.duration / 1000)
      .toFixed(2)
      .toString()
      .padStart(5, '0')
  }
  return '--'
})
</script>