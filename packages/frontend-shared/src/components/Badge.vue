<script setup lang="ts">
const props = defineProps<{
    label: string,
    status: 'success' | 'warning' | 'error' | 'disabled' | 'skipped'
}>()

const statusClasses = {
  disabled: 'bg-gray-50 text-gray-500',
  error: 'bg-error-100 text-error-600',
  skipped: 'bg-gray-100 text-gray-700',
  success: 'bg-success-100 text-success-600',
  warning: 'bg-warning-100 text-warning-600',
}
</script>

<template>
  <div
    class="text-sm inline-block rounded px-1 m-1 whitespace-nowrap"
    :class="statusClasses[status]"
  >
    {{ label }}
  </div>
</template>
