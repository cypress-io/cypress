<template>
  <div class="h-full">
    <div
      v-if="files.length"
      class="h-full relative"
    >
      <ul class="h-full pb-[24px] overflow-auto">
        <!-- TODO: UNIFY-864 - up arrow and down arrow navigation -->
        <li
          v-for="file in files"
          :key="file.id"
        >
          <Collapsible
            lazy
            data-cy="file-list-row"
          >
            <template #target="{ open }">
              <div
                class="cursor-pointer flex border-b border-b-gray-50 leading-normal text-[16px] gap-[8px]
    group items-center last last:py-0 last:items-start children:h-[40px] children:py-[8px]"
              >
                <i-cy-chevron-down-small_x16
                  class="mr-[8px] text-sm icon-dark-gray-300 group-hocus:icon-dark-gray-700"
                  :class="{'transform rotate-270': !open}"
                />
                <i-cy-document-blank_x16 class="min-w-[16px] min-h-[16px] icon-light-gray-50 icon-dark-gray-300" />
                <div class="h-full inline-flex whitespace-nowrap items-center overflow-hidden">
                  <span class="font-medium text-gray-600">{{ name(file) }}</span>
                  <span class="font-light text-gray-400">{{ file.fileExtension }}</span>
                  <span class="font-light ml-[20px] opacity-0 text-gray-600 duration-200 truncate group-hocus:opacity-60">{{ file.relative }}</span>
                </div>
              </div>
              <div v-if="open">
                <slot
                  :file="file"
                  name="expanded-content"
                />
              </div>
            </template>
          </Collapsible>
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
import Collapsible from '@cy/components/Collapsible.vue'

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
  (eventName: 'selectItem', value: {file: FileListItemFragment, item: any})
}>()

// [...all].vue returns as [ when using the normal fileName
const name = (file) => {
  return file.baseName.replace(file.fileExtension, '')
}
</script>
