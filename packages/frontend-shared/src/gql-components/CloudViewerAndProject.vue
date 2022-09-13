<template>
  <slot
    :status="status"
    :userData="userData"
  />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { gql, useSubscription } from '@urql/vue'
import { CloudViewerAndProjectFragment, CloudViewerAndProject_CheckCloudOrgMembershipDocument } from '../generated/graphql'
import { useLoginConnectStore } from '../store/login-connect-store'

gql`
fragment CloudViewerAndProject on Query {
  cloudViewer {
    id
    fullName
    email
    firstOrganization: organizations(first: 1) {
      nodes {
        id
      }
    }
  }
  cachedUser {
    id
    fullName
    email
  }
  authState {
    name
  }
  currentProject {
    id
    projectId
    savedState
    cloudProject {
      __typename
      ... on CloudProject {
        id
        runs(first: 10) {
          nodes {
            id
             # FIXME: added rest of these to avoid infinite loop in testing
            status
            url
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
  if (!props.gql) {
    return
  }

  const isLoggedIn = !!props.gql.cachedUser?.id || !!props.gql.cloudViewer?.id
  // Need to be able to tell whether the lack of `firstOrganization` means they don't have an org or whether it just hasn't loaded yet
  // Not having this check can cause a brief flicker of the 'Create Org' banner while org data is loading
  const isOrganizationLoaded = !!props.gql.cloudViewer?.firstOrganization
  const isMemberOfOrganization = (props.gql.cloudViewer?.firstOrganization?.nodes?.length ?? 0) > 0
  const isProjectConnected = !!props.gql.currentProject?.projectId && props.gql.currentProject.cloudProject?.__typename === 'CloudProject'
  const hasNoRecordedRuns = props.gql.currentProject?.cloudProject?.__typename === 'CloudProject' && (props.gql.currentProject.cloudProject?.runs?.nodes?.length ?? 0) === 0
  const error = ['AUTH_COULD_NOT_LAUNCH_BROWSER', 'AUTH_ERROR_DURING_LOGIN', 'AUTH_COULD_NOT_LAUNCH_BROWSER'].includes(props.gql.authState?.name ?? '')

  return { isLoggedIn, isOrganizationLoaded, isMemberOfOrganization, isProjectConnected, hasNoRecordedRuns, error }
})

const loginConnectStore = useLoginConnectStore()
const { setStatus } = loginConnectStore

watch(() => status.value?.isProjectConnected, (newVal) => {
  if (typeof newVal === 'boolean') {
    if (newVal !== loginConnectStore.isProjectConnected) {
      setStatus('isProjectConnected', newVal)
    }
  }
})

watch(() => status.value?.isLoggedIn, (newVal) => {
  if (typeof newVal === 'boolean') {
    if (newVal !== loginConnectStore.isLoggedIn) {
      setStatus('isLoggedIn', newVal)
    }
  }
})

watch(status, (newVal) => {
  if (typeof newVal === 'object') {
    Object.entries(newVal).forEach((item) => {
      const [key, val] = item

      if (val !== loginConnectStore[key]) {
        setStatus(key, val)
      }
    })
  }
})

const userData = computed(() => {
  return props.gql.cloudViewer ?? props.gql.cachedUser
})

</script>
