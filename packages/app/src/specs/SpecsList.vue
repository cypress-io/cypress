<template>
  <h3 class="text-2xl">
    Specs List
  </h3>
  <SpecsListHeader v-model="search" />
  <template
    v-for="spec in specs"
    :key="spec.node.id"
  >
    <SpecsListRow :gql="spec" />
  </template>
</template>

<script setup lang="ts">
import SpecsListHeader from './SpecsListHeader.vue'
import SpecsListRow from './SpecsListRow.vue'
import { gql } from '@urql/vue'
import { computed, ref } from 'vue'
import type { SpecsListFragment } from '../generated/graphql'

gql`
fragment SpecsList on App {
  activeProject {
    specs(first: 1000000) {
      edges {
        ...SpecListRow
      }
    }
  }
}
`

const props = defineProps<{
  gql: SpecsListFragment
}>()

const search = ref('')
const specs = computed(() => props.gql.activeProject?.specs?.edges)
</script>
