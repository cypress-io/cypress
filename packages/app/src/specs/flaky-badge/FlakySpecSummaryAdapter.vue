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
import { gql, useMutation, useQuery } from '@urql/vue'
import { FlakySpecSummaryQueryDocument, PurgeCloudSpecCacheDocument } from '../../generated/graphql'

gql`
fragment FlakySpecSummaryQueryData on Query {
  cloudSpecByPath(projectSlug: $projectId, specPath: $specPath) {
    __typename
    ... on CloudProjectSpec {
      id
      flakyStatus(fromBranch: $fromBranch, flakyRunsWindow: 50) {
        __typename
        ... on CloudProjectSpecFlakyStatus {
          severity
          flakyRuns
          flakyRunsWindow
          lastFlaky
        }
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

gql`
mutation PurgeCloudSpecCache ($projectSlug: String!, $specPaths: [String!]!) {
  purgeCloudSpecByPathCache(projectSlug: $projectSlug, specPaths: $specPaths)
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
const purgeCloudSpecCacheMutation = useMutation(PurgeCloudSpecCacheDocument)

const flakyStatus = computed(() => {
  if (query.data.value?.cloudSpecByPath?.__typename === 'CloudProjectSpec' &&
      query.data.value?.cloudSpecByPath?.flakyStatus?.__typename === 'CloudProjectSpecFlakyStatus') {
    return query.data.value.cloudSpecByPath.flakyStatus
  }

  return null
})

onBeforeMount(async () => {
  // Ensure we have the latest flaky data - since we manually query for flaky data here the background polling
  // won't auto-refetch it for us when stale data is detected based on lastProjectUpdate
  await purgeCloudSpecCacheMutation.executeMutation({ projectSlug: props.projectId, specPaths: [props.specPath] })
  await query.executeQuery({ requestPolicy: 'network-only' })
})

</script>
