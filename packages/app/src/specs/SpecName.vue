<template>
  <component
    :is="DocumentIconBlank"
    class="icon-light-gray-50 icon-dark-gray-200"
  />
  <div>
    <span class="font-medium text-gray-700 group-hocus:text-indigo-500">{{ props.gql.fileName }}</span>
    <span class="font-light text-gray-400 group-hocus:text-indigo-500">{{ props.gql.specFileExtension }}</span>
  </div>
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import DocumentIconBlank from '~icons/cy/document-blank_x16'
import type { Spec_SpecNameFragment } from '../generated/graphql'

gql`
fragment Spec_SpecName on Spec {
  id
  specFileExtension
  fileExtension
  fileName
}
`

const props = defineProps<{
  gql: Spec_SpecNameFragment
}>()
</script>
