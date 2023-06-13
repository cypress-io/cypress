<template>
  <div
    class="max-w-[15rem] truncate overflow-hidden"
    data-cy="spec-filename"
    :title="specFileName + specFileExtension"
  >
    <span class="font-semibold text-gray-800">{{ specFileName }}</span><span class="text-gray-600">{{ specFileExtension }}</span>
  </div>
</template>

<script lang="ts" setup>

defineProps<{
  specFileName: string
  specFileExtension: string
}>()

</script>
