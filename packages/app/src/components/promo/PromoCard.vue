<template>
  <div class="w-full">
    <div class="grid lg:grid-cols-2 p-[40px] gap-[16px]">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">
          {{ title }}
        </h2>
        <p class="text-grey-700">{{ body }}</p>
        <slot name="content" />
      </div>
      <div class="row-end-[span_2] lg:col-start-2">
        <slot name="image" />
      </div>
      <div class="self-end">
        <slot name="action" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  title: string
  body: string
}>()

</script>
