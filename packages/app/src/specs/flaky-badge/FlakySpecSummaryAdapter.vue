<template>
  <FlakySpecSummary
    :spec-name="specName"
    :spec-extension="specExtension"
    :severity="flakyStatus?.severity ?? 'NONE'"
    :total-runs="flakyStatus?.flakyRunsWindow ?? 0"
    :total-flaky-runs="flakyStatus?.flakyRuns ?? 0"
    :runs-since-last-flake="flakyStatus?.lastFlaky ?? 0"
  />
</template>

<script setup lang="ts">

import { computed, onBeforeMount } from 'vue'
import FlakySpecSummary from './FlakySpecSummary.vue'
import { gql, useQuery } from '@urql/vue'
import { FlakySpecSummaryQueryDocument } from '../../generated/graphql'

gql`
fragment FlakySpecSummaryQueryData on Query {
  cloudSpecByPath(projectSlug: $projectId, specPath: $specPath) {
    __typename
    ... on CloudProjectSpec {
      id
      flakyStatus(fromBranch: $fromBranch, flakyRunsWindow: 50) {
        severity
        flakyRuns
        flakyRunsWindow
        lastFlaky
      }
    }
  }
}
`

gql`
query FlakySpecSummaryQuery($projectId: String!, $specPath: String!, $fromBranch: String!) {
  ...FlakySpecSummaryQueryData
}
`

const props = defineProps<{
  projectId: string
  specName: string
  specExtension: string
  specPath: string
  fromBranch: string
}>()

const variables = computed(() => {
  return {
    projectId: props.projectId,
    specPath: props.specPath,
    fromBranch: props.fromBranch,
  }
})

const query = useQuery({ query: FlakySpecSummaryQueryDocument, variables, pause: true })

const flakyStatus = computed(() => query.data.value?.cloudSpecByPath?.__typename === 'CloudProjectSpec' ? query.data.value?.cloudSpecByPath?.flakyStatus : null)

onBeforeMount(async () => {
  await query.executeQuery({ requestPolicy: 'network-only' })
})

</script>
