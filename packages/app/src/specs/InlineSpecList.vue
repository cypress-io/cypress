<template>
  <div>
    <CreateSpecModal
      v-if="props.gql.currentProject?.currentTestingType"
      :show="showModal"
      :gql="props.gql"
      @close="showModal = false"
    />
    <InlineSpecListHeader
      v-model:search="search"
      :result-count="specs.length"
      @newSpec="showModal = true"
    />
    <InlineSpecListTree
      :specs="specs"
      class="pb-32px"
    />
    <!-- Fading top and bottom of the container. It may make sense for this to exist in a css utility or class. -->
    <div class="bg-gradient-to-b to-transparent from-gray-1000 h-12px top-64px left-0 w-[calc(100%-2px)] scroller-fade absolute" />
    <div class="bg-gradient-to-b from-transparent to-gray-1000 h-12px w-full right-0 bottom-12px scroller-fade absolute" />
  </div>
</template>

<script setup lang="ts">
import { computed, Ref, ref } from 'vue'
import { gql } from '@urql/vue'
import type { Specs_InlineSpecListFragment } from '../generated/graphql'
import InlineSpecListHeader from './InlineSpecListHeader.vue'
import InlineSpecListTree from './InlineSpecListTree.vue'
import CreateSpecModal from './CreateSpecModal.vue'
import fuzzySort from 'fuzzysort'
import type { FuzzyFoundSpec } from '@packages/frontend-shared/src/utils/spec-utils'

gql`
fragment SpecNode_InlineSpecList on SpecEdge {
  node {
    id
    name
    specType
    absolute
    baseName
    fileName
    specFileExtension
    fileExtension
    relative
  }
}
`

gql`
fragment Specs_InlineSpecList on Query {
  ...CreateSpecModal
  currentProject {
    id
    projectRoot
    currentTestingType
    specs: specs(first: 1000) {
      edges {
        ...SpecNode_InlineSpecList
      }
    }
  }
}
`

const props = defineProps<{
  gql: Specs_InlineSpecListFragment
}>()

const showModal = ref(false)
const search = ref('')

const specs = computed<FuzzyFoundSpec[]>(() => {
  const specs = props.gql.currentProject?.specs?.edges.map((x) => ({ ...x.node, indexes: [] })) || []

  if (!search.value) {
    return specs
  }

  return fuzzySort
  .go(search.value, specs || [], { key: 'relative' })
  .map(({ obj, indexes }) => ({ ...obj, indexes }))
})

</script>
