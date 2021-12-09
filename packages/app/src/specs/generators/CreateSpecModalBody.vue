<template>
  <StandardModalBody
    variant="bare"
    class="w-640px h-444px overflow-scroll"
  >
    <slot />
  </StandardModalBody>
</template>

<script lang="ts" setup>
import StandardModalBody from '@cy/components/StandardModalBody.vue'
</script>
