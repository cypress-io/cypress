<template>
  <div class="w-280px">
    <InlineSpecListHeader
      v-model:tab="tab"
      v-model:search="search"
    />
    <div class="h-[calc(100vh-65px)] overflow-y-auto overflow-x-hidden pt-16px">
      <div v-if="tab === 'flat'">
        <InlineSpecListRow
          v-for="spec in specs"
          :key="spec.absolute"
          :spec="spec"
          :selected="isCurrentSpec(spec)"
        />
      </div>
      <InlineSpecListTree
        v-else
        :specs="specs"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, ComputedRef } from 'vue'
import { gql } from '@urql/vue'
import type { SpecNode_InlineSpecListFragment, Specs_InlineSpecListFragment } from '../generated/graphql'
import { useSpecStore } from '../store'
import InlineSpecListHeader from './InlineSpecListHeader.vue'
import InlineSpecListRow from './InlineSpecListRow.vue'
import InlineSpecListTree from './InlineSpecListTree.vue'
import type { SpecViewType } from './SpecsList.vue'

import fuzzySort from 'fuzzysort'
import type { FuzzyFoundSpec } from '@packages/frontend-shared/src/utils/buildSpecTree'

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

const specStore = useSpecStore()

const isCurrentSpec = (spec: FuzzyFoundSpec) => {
  return spec.relative === specStore.activeSpec?.relative
}

const tab = ref<SpecViewType>('tree')
const search = ref('')

const specs: ComputedRef<FuzzyFoundSpec[]> = computed(() => {
  const specs = props.gql.specs?.edges || []

  if (!search.value) {
    return specs.map((spec) => ({ ...spec.node, indexes: [] as number[] }))
  }

  const res = fuzzySort.go(search.value, specs.map((spec) => spec.node) || [], { key: 'relative' })

  return res.map(({ obj, indexes }) => ({ ...obj, indexes }))
})

</script>
