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
import { useDebounceFn, useOnline } from '@vueuse/core'
import { SideBarNavigationContainerDocument } from '../generated/graphql'
import { useRelevantRun } from '@packages/app/src/composables/useRelevantRun'
import { computed, ref, watchEffect } from 'vue'
import { useDebugStore } from '../store/debug-store'

gql`
query SideBarNavigationContainer($commitShas: [String!]!, $hasRuns: Boolean!) {
  ...SidebarNavigation
}
`

const online = useOnline()

const relevantRuns = useRelevantRun('SIDEBAR')

const debugStore = useDebugStore()

const variables = computed(() => {
  return {
    runNumber: relevantRuns.value?.current || -1,
    hasRuns: (relevantRuns.value?.all?.length ?? []) > 0,
    commitShas: relevantRuns.value?.all ?? [],
  }
})

watchEffect(() => {
  if (!variables.value.commitShas?.[0]) {
    return
  }

  if (!debugStore.selectedRunNumber) {
    debugStore.setSelectedRunNumber(variables.value.commitShas[0])

    return
  }

  if (!debugStore.locked) {
    debugStore.setSelectedRunNumber(variables.value.commitShas[0])
  }
})

const query = useQuery({ query: SideBarNavigationContainerDocument, variables })

const isLoading = ref(true)

const setIsLoading = useDebounceFn((value) => {
  isLoading.value = value
})

watchEffect(() => {
  setIsLoading(!relevantRuns.value || query.fetching.value)
})

</script>
