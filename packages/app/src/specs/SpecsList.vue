<template>
  <div class="p-24px">
    <button @click="go">
      go
    </button>
    <SpecsListHeader
      v-model="search"
      class="pb-32px"
    />
    <div class="grid items-center divide-y-1 children:h-40px">
      <div class="grid grid-cols-2 children:text-gray-800 children:font-medium">
        <div>{{ t('specPage.componentSpecsHeader') }}</div>
        <div>{{ t('specPage.gitStatusHeader') }}</div>
      </div>
      <router-link
        v-for="spec in filteredSpecs"
        v-slot="{ navigate }"
        :key="spec.node.id"
        :to="path(spec)"
      >
        <SpecsListRow
          :gql="spec"
          @click="navigate"
          @keypress.enter="navigate"
        />
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import SpecsListHeader from './SpecsListHeader.vue'
import SpecsListRow from './SpecsListRow.vue'
import { gql } from '@urql/vue'
import { computed, ref } from 'vue'
import type { Specs_SpecsListFragment, SpecNode_SpecsListFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'
import { useRouter } from 'vue-router'

const router = useRouter()
const go = () => {
  router.push('/runner')
}
const { t } = useI18n()
const path = (spec: SpecNode_SpecsListFragment) => `/runner/#${spec.node.absolute}`

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
  activeProject {
    id
    projectRoot
    specs(first: 10) {
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
