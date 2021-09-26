<template>
<<<<<<< HEAD
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
      <router-link
        v-for="spec in filteredSpecs"
        v-slot="{ navigate }"
        :key="spec.node.id"
        :to="path(spec)"
        custom
      >
        <SpecsListRow
          :gql="spec"
          @click="navigate"
          @keypress.enter="navigate"
        />
      </router-link>
    </div>
  </div>
=======
  <SpecsListHeader v-model="searchString"/>
>>>>>>> 0332774429 (wip)
</template>

<script setup lang="ts">
import SpecsListHeader from './SpecsListHeader.vue'
import SpecsListRow from './SpecsListRow.vue'
import { gql } from '@urql/vue'
import { computed, ref } from 'vue'
import type { SpecsListFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'

<<<<<<< HEAD
const { t } = useI18n()
const path = (spec) => `/runner/tests/${spec.node.specType}/${spec.node.name}${spec.node.fileExtension}`

gql`
fragment SpecsList on App {
  activeProject {
    id
    projectRoot
    specs(first: 1) {
      edges {
        node {
          name
          specType
          relative
        }
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

// If this search becomes any more complex, push it into the server
const sortByGitStatus = (a, b) => a.node.gitInfo ? 1 : -1
const filteredSpecs = computed(() => {
  return specs.value?.filter((s) => {
    return s.node.relative.toLowerCase().includes(search.value.toLowerCase())
  })?.sort(sortByGitStatus)
})
=======
const searchString = ref('')
>>>>>>> 0332774429 (wip)
</script>
