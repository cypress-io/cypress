<template>
  <span></span>
  <component
    :is="DocumentIconBlank"
    class="icon-dark-gray-800 icon-light-gray-900"
  />
  <div class="group text-xs py-4px">
    <span class="font-medium text-gray-400 group-hocus:text-indigo-500">{{ props.gql.fileName }}</span>
    <span class="font-light text-gray-700 group-hocus:text-indigo-500">{{ props.gql.specFileExtension }}</span>
    <span class="font-light text-gray-700 pl-16px hidden group-hover:inline">{{ relativeFolder }}</span>
  </div>
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import { computed } from 'vue-demi'
import DocumentIconBlank from '~icons/cy/document-blank_x16'
import type { Spec_SpecNameFragment } from '../generated/graphql'

gql`
fragment Spec_SpecName on Spec {
  id
  specFileExtension
  fileExtension
  fileName
  relative
  baseName
}
`


const relativeFolder = computed(() => props.gql.relative.replace('/' + props.gql.baseName, ''))

const props = defineProps<{
  gql: Spec_SpecNameFragment
}>()

</script>
