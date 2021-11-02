<template>
  <div
    data-test-id="browser-error-message"
    class="rounded min-w-200px bg-warning-100 mb-5"
  >
    <h3 class="text-lg text-warning-600 font-medium flex items-center p-5">
      <i-cy-status-errored-outline_x16 class="w-24px h-24px mr-2" /> {{ props.title }}
    </h3>
    <p class="border-t border-warning-200 text-warning-500 py-5 mt-0 mx-5">
      {{ props.message }}
    </p>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  title: String,
  message: String,
}>()
</script>
