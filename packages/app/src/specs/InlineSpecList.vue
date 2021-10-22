<template>
  <div>
    <button
      v-for="spec in specs"
      :key="spec.node.id"
      class="text-left grid grid-cols-[16px,auto,auto] items-center gap-10px"
      :class="{ 'border border-4 border-red-400': isCurrentSpec(spec.node.relative) }"
      @click.prevent="selectSpec(spec.node.relative)"
    >
      <SpecName :gql="spec.node" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { gql } from '@urql/vue'
import type { Specs_InlineSpecListFragment } from '../generated/graphql'
import SpecName from './SpecName.vue'
import { useRoute } from 'vue-router'

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

const emit = defineEmits<{
  (event: 'selectSpec', id: string): void
}>()

const route = useRoute()

const isCurrentSpec = (relative: string) => relative === route.query.spec

async function selectSpec (id: string) {
  emit('selectSpec', id)
}

const props = defineProps<{
  gql: Specs_InlineSpecListFragment
}>()

const specs = computed(() => props.gql.activeProject?.specs?.edges || [])
</script>
