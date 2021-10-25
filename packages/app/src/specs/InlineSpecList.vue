<template>
  <div>
    <router-link
      v-for="spec in specs"
      :key="spec.node.id"
      class="text-left grid grid-cols-[16px,auto,auto] items-center gap-10px"
      :class="{ 'border-2 border-red-400': isCurrentSpec(spec) }"
      :to="{ path: 'spec', query: { file: spec.node.relative } }"
    >
      <SpecName :gql="spec.node" />
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { gql } from '@urql/vue'
import type { SpecNode_InlineSpecListFragment, Specs_InlineSpecListFragment } from '../generated/graphql'
import SpecName from './SpecName.vue'
import { useSpecStore } from '../store'
import { useRouter } from 'vue-router'

gql`
fragment SpecNode_InlineSpecList on SpecEdge {
  node {
    name
    specType
    absolute
    relative
  }
  ...SpecListRow
}
`

gql`
fragment Specs_InlineSpecList on App {
  activeProject {
    id
    projectRoot
    specs: specs(first: 25) {
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
  return spec.node.relative === specStore.currentSpec?.relative
}

const router = useRouter()

const specs = computed(() => props.gql.activeProject?.specs?.edges || [])
</script>
