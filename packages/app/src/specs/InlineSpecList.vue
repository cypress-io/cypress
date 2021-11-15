<template>
  <div class="w-280px">
    <InlineSpecListHeader
      v-model:tab="tab"
      v-model:search="search"
    />
    <div class="h-[calc(100vh-65px)] overflow-y-auto overflow-x-hidden pt-16px">
      <template v-if="tab === 'flat'">
        <InlineSpecListRow
          v-for="spec in specs"
          :key="spec.node.id"
          :spec="spec.node"
          :selected="isCurrentSpec(spec)"
        />
      </template>
      <template v-else>
        <InlineSpecListTree
          :specs="specs.map(spec => spec.node)"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { gql } from '@urql/vue'
import type { SpecNode_InlineSpecListFragment, Specs_InlineSpecListFragment } from '../generated/graphql'
import { useSpecStore } from '../store'
import InlineSpecListHeader from './InlineSpecListHeader.vue'
import InlineSpecListRow from './InlineSpecListRow.vue'
import InlineSpecListTree from './InlineSpecListTree.vue'
import type { SpecViewType } from './SpecsList.vue'

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

const isCurrentSpec = (spec: SpecNode_InlineSpecListFragment) => {
  return spec.node.relative === specStore.activeSpec?.relative
}

const tab = ref<SpecViewType>('flat')
const search = ref('')

const specs = computed(() => {
  if (!search.value) {
    return props.gql.specs?.edges || []
  }

  return (
    props.gql.specs?.edges.filter((edge) => {
      return (
        edge.node.fileName.toLowerCase() +
        edge.node.specFileExtension.toLowerCase()
      ).includes(search.value.toLocaleLowerCase())
    }) || []
  )
})

</script>
