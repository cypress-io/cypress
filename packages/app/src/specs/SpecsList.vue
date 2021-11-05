<template>
  <div class="p-24px">
    <CreateSpecModal
      v-if="props.gql.activeTestingType"
      :show="showModal"
      :gql="props.gql"
      @close="showModal = false"
    />
    <SpecsListHeader
      v-model="search"
      class="pb-32px"
      @newSpec="showModal = true"
    />
    <div class="grid items-center divide-y-1 children:h-40px">
      <div class="grid grid-cols-2 children:text-gray-800 children:font-medium">
        <div>{{ t('specPage.componentSpecsHeader') }}</div>
        <div>{{ t('specPage.gitStatusHeader') }}</div>
      </div>
      <RouterLink
        v-for="spec in filteredSpecs"
        :key="spec.node.id"
        class="text-left"
        :to="{ path: 'runner', query: { file: spec.node.relative } }"
      >
        <SpecsListRow :gql="spec" />
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import SpecsListHeader from './SpecsListHeader.vue'
import SpecsListRow from './SpecsListRow.vue'
import { gql } from '@urql/vue'
import { computed, ref } from 'vue'
import CreateSpecModal from './CreateSpecModal.vue'
import type { Specs_SpecsListFragment, SpecNode_SpecsListFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
fragment SpecNode_SpecsList on SpecEdge {
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
fragment Specs_SpecsList on App {
  ...CreateSpecModal
  activeProject {
    id
    projectRoot
    specs: specs(first: 100) {
      edges {
        ...SpecNode_SpecsList
      }
    }
  }
}
`

const props = defineProps<{
  gql: Specs_SpecsListFragment
}>()

const showModal = ref(false)
const search = ref('')
const specs = computed(() => props.gql.activeProject?.specs?.edges)

// If this search becomes any more complex, push it into the server
const sortByGitStatus = (
  a: SpecNode_SpecsListFragment,
  b: SpecNode_SpecsListFragment,
) => {
  return a.node.gitInfo ? 1 : -1
}
const filteredSpecs = computed(() => {
  return specs.value?.filter((s) => {
    return s.node.relative.toLowerCase().includes(search.value.toLowerCase())
  })?.sort(sortByGitStatus)
})
</script>
