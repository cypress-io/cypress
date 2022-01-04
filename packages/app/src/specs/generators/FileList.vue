<template>
  <div
    class="h-full outline-none"
    tabindex="0"
  >
    <ul v-if="files.length">
      <!-- TODO(jess): up arrow and down arrow navigation -->
      <li
        v-for="file in files"
        :key="file?.id"
        class="cursor-pointer group children:h-40px children:py-8px last:py-0 flex gap-8px
    items-center text-16px last:border-none border-b-1 border-b-gray-50 leading-normal"
        data-cy="file-list-row"
        @click="$emit('selectFile', file)"
      >
        <i-cy-document-blank_x16 class="icon-light-gray-50 icon-dark-gray-300 min-w-16px min-h-16px" />
        <div class="h-full inline-flex whitespace-nowrap items-center overflow-hidden">
          <span
            class="font-medium text-indigo-500
          group-hocus:text-indigo-500"
          >{{
            name(file) }}</span>
          <span class="font-light text-gray-400">{{ file.fileExtension }}</span>
          <span class="ml-20px font-light group-hocus:opacity-60 truncate opacity-0 duration-200 text-gray-600">{{ file.relative }}</span>
        </div>
      </li>
    </ul>
    <div
      v-else
      class="h-full flex items-center justify-center"
    >
      <slot name="no-results" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { gql } from '@urql/vue'
import type { FileListItemFragment } from '../../generated/graphql'

gql`
fragment FileListItem on FileParts {
  id
  relative
  fileName
  fileExtension
  baseName
}
`

const props = defineProps<{
  files: FileListItemFragment[]
}>()

defineEmits<{
  (eventName: 'selectFile', value: FileListItemFragment)
}>()

// [...all].vue returns as [ when using the normal fileName
const name = (file) => {
  return file.baseName.replace(file.fileExtension, '')
}
</script>
