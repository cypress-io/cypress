<template>
  <StandardModalBody
    variant="bare"
    class="rounded h-[444px] w-[640px] overflow-auto"
  >
    <slot />
  </StandardModalBody>
</template>

<script lang="ts" setup>
import StandardModalBody from '@cy/components/StandardModalBody.vue'
</script>
