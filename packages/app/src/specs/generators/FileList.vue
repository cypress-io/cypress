<template>
  <div class="h-full">
    <div
      v-if="files.length"
      class="h-full relative"
      tabindex="0"
    >
      <ul class="h-full">
        <!-- TODO: UNIFY-864 - up arrow and down arrow navigation -->
        <li
          v-for="file in files"
          :key="file?.id"
          class="cursor-pointer flex border-b border-b-gray-50 leading-normal text-[16px] gap-[8px]
    group items-center last last:border-none last:h-[64px] last:py-0 last:items-start children:h-[40px] children:py-[8px]"
          data-cy="file-list-row"
          @click="$emit('selectFile', file)"
        >
          <i-cy-document-blank_x16 class="min-w-[16px] min-h-[16px] icon-light-gray-50 icon-dark-gray-300" />
          <div class="h-full inline-flex whitespace-nowrap items-center overflow-hidden">
            <span
              class="font-medium text-indigo-500
          group-hocus:text-indigo-500"
            >{{
              name(file) }}</span>
            <span class="font-light text-gray-400">{{ file.fileExtension }}</span>
            <span class="font-light ml-[20px] opacity-0 text-gray-600 duration-200 truncate group-hocus:opacity-60">{{ file.relative }}</span>
          </div>
        </li>
      </ul>
    </div>
    <div
      v-else
      class="flex h-full items-center justify-center"
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

defineProps<{
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
