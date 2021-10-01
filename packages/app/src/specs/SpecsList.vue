<template>
  <h3 class="text-2xl">Specs List</h3>
  <SpecsListHeader v-model="search" />
  <SpecsListRow
    v-for="spec in gql.activeProject?.specs?.edges"
    :key="spec?.node?.absolute"
  ></SpecsListRow>
</template>

<script setup lang="ts">
import SpecsListHeader from './SpecsListHeader.vue'
import SpecsListRow from './SpecsListRow.vue'
import { gql } from '@urql/vue'
import type { SpecsList_SpecsFragment } from '../generated/graphql'
import { computed, ref } from 'vue'

gql`
fragment SpecsList_Specs on App {
  activeProject {
    specs(first: 1000) {
      edges {
        node {
          ...SpecListRow
        }
      }
    }
  }
}
`

interface GitInfo {
  comitter?: string,
  timeAgo?: number | Date,
  fileState: 'modified' | 'unmodified' | 'added' | 'deleted'
}

// interface Spec {
//   id: string,
//   relativePath: string,
//   name: string,
//   componentName: string,
//   extension: string,
//   specExtension: string,
//   gitInfo?: GitInfo
// }

const props = defineProps<{
  gql: SpecsList_SpecsFragment
}>()

const search = ref('')
const specs = computed(() => props.gql.activeProject?.specs?.edges)

</script>
