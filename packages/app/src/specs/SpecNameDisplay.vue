<template>
  <div
    class="max-w-60 truncate overflow-hidden"
    data-cy="spec-filename"
    :title="specFileName + specFileExtension"
  >
    <span class="font-semibold text-gray-800">{{ props.specFileName }}</span><span class="text-gray-600">{{ props.specFileExtension }}</span>
  </div>
</template>

<script lang="ts" setup>

const props = defineProps<{
  specFileName: string
  specFileExtension: string
}>()

</script>
