<template>
  <div
    class="border rounded-full font-medium p-[5px] pr-[16px] text-[14px] leading-[20px] inline-flex items-center relative"
    :class="{'text-jade-500': props.status, 'text-gray-600': !props.status}"
  >
    <i-cy-grommet_x16
      class="h-[16px] mr-[4px] ml-[4px] w-[16px]"
      :class="{'icon-light-jade-400 icon-dark-jade-400': props.status, 'icon-dark-gray-200 icon-dark-gray-50': !props.status}"
    />
    {{ props.title }}
  </div>
</template>

<script lang="ts" setup>

const props = defineProps<{
  status: boolean
  title: string
}>()

</script>
