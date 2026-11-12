<template>
  <div
    class="flex flex-col items-center"
    data-cy="debug-passed"
  >
    <DashboardCheckmark class="icon-dark-gray-500" />
    <span class="font-medium mt-[24px] text-gray-900">
      Well Done!
    </span>
    <span class="mt-[5px] text-gray-700">All your tests passed.</span>
  </div>
</template>

<script lang="ts" setup>
import DashboardCheckmark from '~icons/cy/dashboard-checkmark_x48.svg'
</script>
