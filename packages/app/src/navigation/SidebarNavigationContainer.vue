<template>
  <SidebarNavigation
    :gql="query.data.value"
    :is-loading="query.fetching.value"
  />
</template>

<script lang="ts" setup>
import SidebarNavigation from './SidebarNavigation.vue'
import { gql, useQuery } from '@urql/vue'
import { SideBarNavigationContainerDocument } from '../generated/graphql'
import { useRelevantRun } from '@packages/app/src/composables/useRelevantRun'
import { ref, watchEffect } from 'vue'

gql`
query SideBarNavigationContainer($runNumber: Int!) {
  ...SidebarNavigation
}
`

const relevantRuns = useRelevantRun()

const variables = ref({ runNumber: -1 })

const query = useQuery({ query: SideBarNavigationContainerDocument, variables, pause: true })

watchEffect(() => {
  if (relevantRuns.value.completed) {
    variables.value.runNumber = relevantRuns.value.completed
    query.executeQuery()
  }
})
</script>
