<template>
  <div class="text-center">
    <h1 class="mb-2 text-2rem">
      Add project
    </h1>
    <p class="mb-6 text-lg font-light text-body-gray">
      Get started by adding your first project below.
    </p>
    <FileDropzone @add-project="emit('addProject', $event)" />
  </div>
</template>

<script lang="ts" setup>
import FileDropzone from './FileDropzone.vue'

const emit = defineEmits<{
  (e: 'addProject', value: string | null): void
}>()

</script>
