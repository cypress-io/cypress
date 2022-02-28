<template>
  <OpenFileInIDE
    v-slot="{onClick}"
    :file-path="props.gql.absolute"
    :line="props.gql.line ?? 0"
    :column="props.gql.column ?? 0"
  >
    <div
      class="border rounded cursor-pointer flex flex-row bg-gray-50 border-red-100 mt-16px text-indigo-500 text-14px leading-24px items-center"
      tab-index="1"
      @click="onClick"
    >
      <i-cy-document-text_x16 class="h-16px m-12px mr-8px w-16px icon-dark-indigo-500 icon-light-indigo-100" />
      <code>{{ fileText }}</code>
    </div>
  </OpenFileInIDE>
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import { computed } from 'vue'
import OpenFileInIDE from '@packages/frontend-shared/src/gql-components/OpenFileInIDE.vue'
import type { ErrorCodeFrameFragment } from '../generated/graphql'

gql`
fragment ErrorCodeFrame on FileParts {
  id
  absolute
  relative
  line
  column
}`

const props = defineProps<{
  gql: ErrorCodeFrameFragment
}>()

const fileText = computed(() => {
  const { relative, line, column } = props.gql

  return `${relative}${(line && column) ? `:${line}:${column}` : ''}`
})
</script>
