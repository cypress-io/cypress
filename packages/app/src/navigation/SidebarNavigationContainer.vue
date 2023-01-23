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
import { computed } from 'vue'

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

const shouldPauseQuery = computed(() => {
  return variables.value.runNumber === -1 || !online
})

const query = useQuery({ query: SideBarNavigationContainerDocument, variables, pause: shouldPauseQuery })

const isLoading = computed(() => {
  return !relevantRuns.value || query.fetching.value
})

</script>
