<template>
  <div class="w-300px overflow-x-hidden h-full">
    <InlineSpecListRow
      v-for="spec in specs"
      :key="spec.node.id"
      :spec="spec.node"
      :selected="isCurrentSpec(spec)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { gql } from '@urql/vue'
import type { SpecNode_InlineSpecListFragment, Specs_InlineSpecListFragment } from '../generated/graphql'
import { useSpecStore } from '../store'
import { useRouter } from 'vue-router'
import InlineSpecListRow from './InlineSpecListRow.vue'

gql`
fragment SpecNode_InlineSpecList on SpecEdge {
  node {
    name
    specType
    absolute
    relative
    baseName
  }
  ...SpecListRow
}
`

gql`
fragment Specs_InlineSpecList on App {
  activeProject {
    id
    projectRoot
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

const specStore = useSpecStore()

const isCurrentSpec = (spec: SpecNode_InlineSpecListFragment) => {
  return spec.node.relative === specStore.activeSpec?.relative
}

const specs = computed(() => props.gql.activeProject?.specs?.edges || [])

</script>
