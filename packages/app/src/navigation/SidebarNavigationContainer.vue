<template>
  <SidebarNavigation
    :gql="query.data.value"
    :is-loading="isLoading"
  />
</template>

<script lang="ts" setup>
import SidebarNavigation from './SidebarNavigation.vue'
import { gql, useQuery } from '@urql/vue'
import { SideBarNavigationContainerDocument } from '../generated/graphql'
import { useRelevantRun } from '@packages/app/src/composables/useRelevantRun'
import { ref, watchEffect, computed } from 'vue'

gql`
query SideBarNavigationContainer($runNumber: Int!, $hasCurrentRun: Boolean!) {
  ...SidebarNavigation
}
`

const relevantRuns = useRelevantRun()

const variables = ref({ runNumber: -1, hasCurrentRun: false })

const query = useQuery({ query: SideBarNavigationContainerDocument, variables, pause: true })

const hasLoadedFirstTime = ref(false)

const isLoading = computed(() => {
  return !hasLoadedFirstTime.value || query.fetching.value
})

watchEffect(() => {
  variables.value.runNumber = relevantRuns.value.current || -1
  variables.value.hasCurrentRun = !!relevantRuns.value.current
  query.executeQuery()
  hasLoadedFirstTime.value = true
})
</script>
