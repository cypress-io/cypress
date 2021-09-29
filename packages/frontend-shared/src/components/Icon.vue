<template>
  <span
    v-if="icon"
    class="flex align-center justify-center"
  >
    <component :is="icon" />
  </span>
</template>

<script lang="ts">
export default {
  inheritAttrs: true,
}

</script>
<script lang="ts" setup>
import type { FunctionalComponent, SVGAttributes } from 'vue'

defineProps<{
  icon?: FunctionalComponent<SVGAttributes, {}>
}>()
</script>
