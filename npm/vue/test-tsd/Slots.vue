<script lang="ts" setup>
defineProps<{
  label: string
}>()
</script>

<template>
  <button
    type="button"
    :title="label"
    :aria-label="label"
  >
    <slot />
  </button>
</template>
