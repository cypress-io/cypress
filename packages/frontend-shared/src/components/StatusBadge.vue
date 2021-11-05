<template>
  <span
    class="inline-flex items-center border rounded-full pl-8px pr-16px py-8px"
    :class="status ? 'text-jade-500' : 'text-gray-600'"
  >
    <i-cy-grommet_x16
      class="m-4px h-16px w-16px fill-current"
      :class="status ? 'icon-light-jade-500 icon-dark-jade-500' : 'icon-dark-gray-200 icon-dark-gray-50'"
    />
    {{ status ? titleOn : titleOff }}
  </span>
</template>

<script lang="ts" setup>
defineProps<{
  status: boolean,
  titleOn: string,
  titleOff: string
}>()
</script>
