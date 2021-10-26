<template>
  <ul>
    
    <li v-for="file in
    files" @click="$emit('createSpec', file)"
    class="cursor-pointer group children:h-40px flex items-center gap-4px"
    
    :key="file?.id">
    <i-cy-document-blank_x24 class="icon-light-gray-50 icon-dark-gray-200"/>
      <div class="h-full inline-flex items-center">
        <span class="font-medium text-gray-700 group-hocus:text-indigo-500">{{ file.fileName }}</span>
        <span class="font-light text-gray-400 group-hocus:text-indigo-500">{{ file.fileExtension }}</span>
        <span class="ml-20px font-light group-hocus:opacity-60 opacity-0 duration-200 text-gray-600">{{ file.relative }}</span>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import SpecsListRow from '../SpecsListRow.vue'

// TODO(tim): fix types
interface FileParts {
  relative: string
  id: string
  fileName: string
  fileExtension: string
}

defineProps<{
  files: FileParts[]
}>()

defineEmits<{
  (eventName: 'createSpec', value: FileParts)
}>()

</script>
