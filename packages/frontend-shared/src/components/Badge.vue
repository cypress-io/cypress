<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    label: string,
    status: 'success' | 'warning' | 'error' | 'disabled' | 'skipped'
}>()

const statusClasses = {
  success: '',
  warning: '',
  error: '',
  disabled: '',
  skipped: '',
}
</script>
<template>
  <div
    class="text-sm inline-block rounded px-1 whitespace-nowrap"
    :class="statusClasses[status]"
  >
    {{ label }}
  </div>
</template>
