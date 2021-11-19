<template>
  <div
    v-if="props?.gql?.savedState?.isSpecListOpen"
    class="w-280px"
  >
    <InlineSpecListHeader
      v-model:search="search"
    />
    <div class="h-[calc(100vh-65px)] overflow-y-auto overflow-x-hidden pt-16px">
      <InlineSpecListTree
        :specs="specs"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { gql } from '@urql/vue'
import { useRunnerStore } from '../store'
import type { Specs_InlineSpecListFragment } from '../generated/graphql'
import InlineSpecListHeader from './InlineSpecListHeader.vue'
import InlineSpecListTree from './InlineSpecListTree.vue'

import fuzzySort from 'fuzzysort'
import type { FuzzyFoundSpec } from '@packages/frontend-shared/src/utils/spec-utils'

gql`
fragment SpecNode_InlineSpecList on SpecEdge {
  node {
    id
    name
    specType
    absolute
    relative
    baseName
    specFileExtension
    fileExtension
    fileName
  }
}
`

gql`
fragment Specs_InlineSpecList on CurrentProject {
  id
  projectRoot
  savedState
  specs: specs(first: 1000) {
    edges {
      ...SpecNode_InlineSpecList
    }
  }
}
`

const props = defineProps<{
  gql: Specs_InlineSpecListFragment
}>()

const runnerStore = useRunnerStore()
const search = ref('')

const specs = computed<FuzzyFoundSpec[]>(() => {
  const specs = props.gql.specs?.edges.map((x) => ({ ...x.node, indexes: [] })) || []

  if (!search.value) {
    return specs
  }

  return fuzzySort
  .go(search.value, specs || [], { key: 'relative' })
  .map(({ obj, indexes }) => ({ ...obj, indexes }))
})

</script>
