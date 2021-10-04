<template>
  <h3 class="text-2xl">
    Specs List
  </h3>
  <div class="p-24px">
  <SpecsListHeader v-model="search" class="pb-32px"/>
  <div class="grid items-center divide-y-1 children:h-40px">
    <div class="grid grid-cols-2 children:text-gray-800 children:font-medium">
      <div>{{ t('specPage.componentSpecsHeader') }}</div>
      <div>{{ t('specPage.gitStatusHeader') }}</div>
    </div>
    <SpecsListRow :gql="spec" v-for="spec in filteredSpecs" :key="spec.node.id" role="button" tabindex="0" class="grid grid-cols-2" />
  </div>
  </div>
</template>

<script setup lang="ts">
import SpecsListHeader from './SpecsListHeader.vue'
import SpecsListRow from './SpecsListRow.vue'
import { gql } from '@urql/vue'
import { computed, ref } from 'vue'
import type { SpecsListFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
fragment SpecsList on App {
  activeProject {
    id
    projectRoot
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

const filteredSpecs = computed(() => specs.value?.filter(s => s.node.name.toLowerCase().includes(search.value.toLowerCase())))
</script>
