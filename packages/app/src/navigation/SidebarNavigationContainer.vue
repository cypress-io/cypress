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

gql`
query SideBarNavigationContainer($runNumber: Int!, $hasCurrentRun: Boolean!) {
  ...SidebarNavigation
}
`

const online = useOnline()

const relevantRuns = useRelevantRun('SIDEBAR')

const variables = computed(() => {
  return {
    runNumber: relevantRuns.value?.selectedRun?.runNumber || -1,
    hasCurrentRun: !!relevantRuns.value?.selectedRun?.runNumber,
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
