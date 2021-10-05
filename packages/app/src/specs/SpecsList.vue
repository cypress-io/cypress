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
      <router-link
        v-for="spec in filteredSpecs"
        v-slot="{ navigate }"
        :key="spec.node.id"
        :to="path(spec)"
        custom
      >
        <SpecsListRow
          :gql="spec"
          role="link"
          tabindex="0"
          class="grid grid-cols-2"
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
import { computed, ref, watch } from 'vue'
import type { SpecsListFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()
const path = (spec) => `/runner/tests/${spec.node.specType}/${spec.node.name}`

gql`
fragment SpecsList on App {
  activeProject {
    id
    projectRoot
    specs(first: 1000000) {
      edges {
        node {
          specType
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
    return s.node.name.toLowerCase().includes(search.value.toLowerCase())
  })?.sort(sortByGitStatus)
})
</script>
