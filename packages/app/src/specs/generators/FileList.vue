<template>
  <div class="h-full">
    <ul v-if="files.length">
      <li v-for="file in
      files" @click="$emit('selectFile', file)"
      class="cursor-pointer group children:h-40px children:py-8px last:py-0 flex gap-8px
    items-center text-16px last:border-none border-b-1 border-b-gray-50 leading-normal"
      data-testid="file-list-row"
      :key="file?.id">
      <i-cy-document-blank_x16 class="icon-light-gray-50 icon-dark-gray-300 min-w-16px min-h-16px"/>
        <div class="h-full inline-flex whitespace-nowrap items-center overflow-hidden">
          <span class="font-medium text-indigo-500
          group-hocus:text-indigo-500">{{
          name(file) }}</span>
          <span class="font-light text-gray-400">{{ file.fileExtension }}</span>
          <span class="ml-20px font-light group-hocus:opacity-60 truncate opacity-0 duration-200 text-gray-600">{{ file.relative }}</span>
        </div>
      </li>
    </ul>
    <div v-else class="h-full flex items-center justify-center">
      <slot name="no-results"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import SpecsListRow from '../SpecsListRow.vue'
import { computed } from 'vue'
import NoResults from '@cy/components/NoResults.vue'
import { gql } from '@urql/vue'

// TODO(tim): fix types
interface FileParts {
  relative: string
  id: string
  fileName: string
  fileExtension: string
  baseName: string
}

const props = defineProps<{
  files: FileParts[]
}>()

defineEmits<{
  (eventName: 'selectFile', value: FileParts)
}>()

// [...all].vue returns as [ when using the normal fileName
const name = (file) => {
  return file.baseName.replace(file.fileExtension, "")
}
</script>
