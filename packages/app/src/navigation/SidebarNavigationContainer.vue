<template>
  <SidebarNavigation
    :gql="query.data.value"
    :is-loading="isLoading"
    :online="online"
  />
</template>

<script lang="ts" setup>
import SidebarNavigation from './SidebarNavigation.vue'
import { gql, useQuery } from '@urql/vue'
import { useOnline } from '@vueuse/core'
import { SideBarNavigationContainerDocument } from '../generated/graphql'
import { useRelevantRun } from '@packages/app/src/composables/useRelevantRun'
import { ref, watchEffect, computed } from 'vue'

gql`
query SideBarNavigationContainer($runNumber: Int!, $hasCurrentRun: Boolean!) {
  ...SidebarNavigation
}
`

const online = useOnline()

const relevantRuns = useRelevantRun()

const variables = computed(() => {
  return {
    runNumber: relevantRuns.value?.current || -1,
    hasCurrentRun: !!relevantRuns.value?.current,
  }
})

const query = useQuery({ query: SideBarNavigationContainerDocument, variables, pause: true })

const hasLoadedFirstTime = ref(false)

const isLoading = computed(() => {
  return !hasLoadedFirstTime.value || query.fetching.value
})

watchEffect(() => {
  variables.value.runNumber = relevantRuns.value?.current || -1
  variables.value.hasCurrentRun = !!relevantRuns.value?.current
  query.executeQuery()
  hasLoadedFirstTime.value = true
})
</script>
