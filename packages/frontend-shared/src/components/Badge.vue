<script setup lang="ts">
const props = defineProps<{
    label: string,
    status: 'success' | 'warning' | 'error' | 'disabled'
}>()
</script>
<template>
  <div class="text-sm inline-block rounded px-1">
    <p
      class="whitespace-nowrap w-min"
      data-testid="badge-label"
      v-bind="$attrs"
    >
      {{ label }}
    </p>
  </div>
</template>
