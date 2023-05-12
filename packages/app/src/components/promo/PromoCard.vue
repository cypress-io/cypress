<template>
  <div class="grid grid-cols-[480px] xl:grid-cols-[300px_470px] p-[40px] gap-y-[16px] gap-x-[100px]">
    <div>
      <h2 class="text-xl font-semibold text-gray-900">
        {{ title }}
      </h2>
      <p class="text-grey-700">
        {{ body }}
      </p>
      <slot name="content" />
    </div>
    <div class="row-end-[span_2] xl:col-start-2">
      <slot name="image" />
    </div>
    <div class="self-end">
      <slot name="action" />
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  title: string
  body: string
}>()

</script>
