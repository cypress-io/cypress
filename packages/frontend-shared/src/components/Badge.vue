<script lang="ts">
export type BadgeRowStatus = 'success' | 'warning' | 'error' | 'skipped' | 'disabled';
</script>

<script setup lang="ts">
const props = defineProps<{
  label: string | undefined,
  status?: BadgeRowStatus
}>()

const statusClasses: Record<BadgeRowStatus, string> = {
  disabled: 'bg-gray-50 text-gray-500',
  error: 'bg-error-100 text-error-600',
  skipped: 'bg-gray-100 text-gray-700',
  success: 'bg-success-100 text-success-600',
  warning: 'bg-warning-100 text-warning-600',
}
</script>

<template>
  <div
    class="inline-block px-1 mx-1 text-sm rounded whitespace-nowrap"
    :class="statusClasses[status || '']"
  >
    {{ label }}
  </div>
</template>
