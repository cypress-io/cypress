<template>
  <span
    v-if="icon"
    class="flex align-center justify-center"
  >
    <component
      :is="icon"
      :class="iconClass"
    />
  </span>
</template>

<script lang="ts">
export default {
  inheritAttrs: true,
}

</script>
<script lang="ts" setup>
import type { Component } from 'vue'

defineProps<{
  icon?: Component
  iconClass?: string
}>()
</script>
