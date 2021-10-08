<template>
  <div class="p-24px">
    <SpecsListHeader
      v-model="search"
      class="pb-32px"
    />
    <div class="grid items-center divide-y-1 children:h-40px">
      <div class="grid grid-cols-2 children:text-gray-800 children:font-medium">
        <div>{{ t('specPage.componentSpecsHeader') }}</div>
        <div>{{ t('specPage.gitStatusHeader') }}</div>
      </div>
      <button
        v-for="spec in filteredSpecs"
        :key="spec.node.id"
        @click.prevent="selectSpec(spec)"
      >
        <SpecsListRow :gql="spec" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import SpecsListHeader from './SpecsListHeader.vue'
import SpecsListRow from './SpecsListRow.vue'
import { gql, useMutation } from '@urql/vue'
import { computed, ref } from 'vue'
import { Specs_SpecsListFragment, SpecNode_SpecsListFragment, SpecsList_SetCurrentSpecDocument } from '../generated/graphql'
import { useI18n } from '@cy/i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()

gql`
mutation SpecsList_SetCurrentSpec($spec: SetCurrentSpec!) {
  setCurrentSpec(spec: $spec) {
    currentSpec {
      id
      relative
      absolute
      name
    }
  }
}
`

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

const setSpecMutation = useMutation(SpecsList_SetCurrentSpecDocument)

const router = useRouter()

async function selectSpec (spec: SpecNode_SpecsListFragment) {
  const { name, absolute, relative } = spec.node

  await setSpecMutation.executeMutation({ spec: { name, absolute, relative } })
  router.push('/runner')
}

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
