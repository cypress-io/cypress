<template>
  <span
    class="inline-flex items-center border rounded-full p-5px pr-16px text-size-14px leading-20px"
    :class="status ? 'text-jade-500' : 'text-gray-600'"
  >
    <i-cy-grommet_x16
      class="mx-4px h-16px w-16px"
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
