<script lang="ts">
export type BadgeRowStatus = 'success' | 'warning' | 'error' | 'skipped' | 'disabled';

export const statusClassesObject: Record<BadgeRowStatus, string> = {
  disabled: 'bg-gray-50 text-gray-500',
  error: 'bg-error-100 text-error-600',
  skipped: 'bg-gray-100 text-gray-700',
  success: 'bg-success-100 text-success-600',
  warning: 'bg-warning-100 text-warning-600',
}
</script>

<script setup lang="ts">
defineProps<{
  label: string | undefined
  status?: BadgeRowStatus
}>()

const statusClasses = statusClassesObject
</script>

<template>
  <div
    class="rounded mx-1 text-sm px-1 inline-block whitespace-nowrap"
    :class="statusClasses[status || '']"
  >
    {{ label }}
  </div>
</template>
