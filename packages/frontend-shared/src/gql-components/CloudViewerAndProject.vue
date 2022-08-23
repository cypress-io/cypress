<template>
  <slot :status="status" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { gql, useSubscription } from '@urql/vue'
import { CloudViewerAndProjectFragment, CloudViewerAndProject_CheckCloudOrgMembershipDocument } from '../generated/graphql'

gql`
fragment CloudViewerAndProject on Query {
  cloudViewer {
    id
    firstOrganization: organizations(first: 1) {
      nodes {
        id
      }
    }
  }
  cachedUser {
    id
  }
  currentProject {
    id
    projectId
    savedState
    cloudProject {
      __typename
      ... on CloudProject {
        id
        runs(first: 1) {
          nodes {
            id
          }
        }
      }
    }
  }
}
`

gql`
subscription CloudViewerAndProject_CheckCloudOrgMembership {
  cloudViewerChange {
    ...CloudViewerAndProject
  }
}
`

const props = defineProps<{
  gql: CloudViewerAndProjectFragment
}>()

useSubscription({ query: CloudViewerAndProject_CheckCloudOrgMembershipDocument })

const status = computed(() => {
  const isLoggedIn = !!props.gql.cachedUser?.id || !!props.gql.cloudViewer?.id
  // Need to be able to tell whether the lack of `firstOrganization` means they don't have an org or whether it just hasn't loaded yet
  // Not having this check can cause a brief flicker of the 'Create Org' banner while org data is loading
  const isOrganizationLoaded = !!props.gql.cloudViewer?.firstOrganization
  const isMemberOfOrganization = (props.gql.cloudViewer?.firstOrganization?.nodes?.length ?? 0) > 0
  const isProjectConnected = !!props.gql.currentProject?.projectId && props.gql.currentProject.cloudProject?.__typename === 'CloudProject'
  const hasNoRecordedRuns = props.gql.currentProject?.cloudProject?.__typename === 'CloudProject' && (props.gql.currentProject.cloudProject?.runs?.nodes?.length ?? 0) === 0

  return { isLoggedIn, isOrganizationLoaded, isMemberOfOrganization, isProjectConnected, hasNoRecordedRuns }
})

</script>
