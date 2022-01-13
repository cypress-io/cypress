<template>
  <div class="h-full">
    <div
      v-if="files.length"
      class="h-full relative"
      tabindex="0"
    >
      <ul class="h-full overflow-auto">
        <!-- TODO(jess): up arrow and down arrow navigation -->
        <li
          v-for="file in files"
          :key="file?.id"
          class="cursor-pointer flex border-b-1 border-b-gray-50 leading-normal text-16px gap-8px
    group items-center last:border-none last:py-0 children:h-40px children:py-8px"
          data-cy="file-list-row"
          @click="$emit('selectFile', file)"
        >
          <i-cy-document-blank_x16 class="min-w-16px min-h-16px icon-light-gray-50 icon-dark-gray-300" />
          <div class="h-full inline-flex whitespace-nowrap items-center overflow-hidden">
            <span
              class="font-medium text-indigo-500
          group-hocus:text-indigo-500"
            >{{
              name(file) }}</span>
            <span class="font-light text-gray-400">{{ file.fileExtension }}</span>
            <span class="font-light ml-20px opacity-0 text-gray-600 duration-200 truncate group-hocus:opacity-60">{{ file.relative }}</span>
          </div>
        </li>
      </ul>

      <!-- Fading top and bottom of the container. It may make sense for this to exist in a css utility or class. -->
      <div class="bg-gradient-to-b from-white to-transparent h-12px top-0 left-0 w-[calc(100%-2px)] scroller-fade absolute" />
      <div class="bg-gradient-to-b from-transparent to-white h-12px w-full right-0 bottom-0 scroller-fade absolute" />
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
