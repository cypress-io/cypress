<template>
  <span
    class="border rounded-full font-medium p-5px pr-16px text-size-14px leading-20px inline-flex items-center"
    :class="status ? 'text-jade-500' : 'text-gray-600'"
  >
    <i-cy-grommet_x16
      class="h-16px mr-4px ml-4px w-16px"
      :class="status ? 'icon-light-jade-400 icon-dark-jade-400' : 'icon-dark-gray-200 icon-dark-gray-50'"
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
