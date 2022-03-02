<template>
  <OpenFileInIDE
    v-slot="{onClick}"
    :file-path="props.gql.file.absolute"
    :line="props.gql.line ?? 0"
    :column="props.gql.column ?? 0"
  >
    <div
      class="border rounded cursor-pointer flex flex-row bg-gray-50 border-red-100 mt-16px text-indigo-500 text-14px leading-24px items-center"
      tab-index="1"
      data-testid="error-code-frame"
      @click="onClick"
    >
      <i-cy-document-text_x16 class="h-16px m-12px mr-8px w-16px icon-dark-indigo-500 icon-light-indigo-100" />
      <code>{{ fileText }}</code>
    </div>
  </OpenFileInIDE>
  <ShikiHighlight
    v-if="props.gql.codeBlock"
    :code="props.gql.codeBlock"
    lang="js"
    line-numbers
    skip-trim
    :initial-line="props.gql.codeBlockStartLine ?? 0"
  />
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import { computed } from 'vue'
import ShikiHighlight from '@packages/frontend-shared/src/components/ShikiHighlight.vue'
import OpenFileInIDE from '@packages/frontend-shared/src/gql-components/OpenFileInIDE.vue'
import type { ErrorCodeFrameFragment } from '../generated/graphql'

gql`
fragment ErrorCodeFrame on CodeFrame {
  line
  column
  codeBlock
  codeBlockStartLine
  file {
    id
    absolute
    relative
  }
}`

const props = defineProps<{
  gql: ErrorCodeFrameFragment
}>()

const fileText = computed(() => {
  const { file, line, column } = props.gql

  return `${file.relative}${(line && column) ? `:${line}:${column}` : ''}`
})
</script>
