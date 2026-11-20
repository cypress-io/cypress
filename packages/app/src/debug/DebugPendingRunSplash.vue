<template>
  <div
    data-cy="debug-pending-splash"
    class="flex p-12"
  >
    <div class="flex flex-col w-full items-center justify-center">
      <IconTechnologyDashboardRunning class="mb-[16px]" />
      <span
        data-cy="title"
        class="font-medium text-lg text-gray-900"
      >
        {{ title }}
      </span>
      <div
        v-if="!isCompletionScheduled"
        data-cy="splash-subtitle"
        class="font-normal mt-[4px] text-md text-gray-600"
      >
        Failures will be displayed here
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconTechnologyDashboardRunning } from '@cypress-design/vue-icon'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  isCompletionScheduled?: boolean
}>(), {
  isCompletionScheduled: false,
})

const title = computed(() => {
  if (props.isCompletionScheduled) {
    return 'Scheduled to complete...'
  }

  return 'Testing in progress...'
})

</script>
