<script setup lang="ts">
import { watchEffect } from 'vue'
import { gql, useQuery, useSubscription } from '@urql/vue'
import { CloudViewerAndProject_RequiredDataDocument, CloudViewerAndProject_CheckCloudOrgMembershipDocument } from '../generated/graphql'
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
query CloudViewerAndProject_RequiredData {
  ...CloudViewerAndProject
}
`

gql`
subscription CloudViewerAndProject_CheckCloudOrgMembership {
  cloudViewerChange {
    ...CloudViewerAndProject
  }
}
`

const loginConnectStore = useLoginConnectStore()
const { setStatus, setLoginError, setUserData } = loginConnectStore

useSubscription({ query: CloudViewerAndProject_CheckCloudOrgMembershipDocument })

const query = useQuery({ query: CloudViewerAndProject_RequiredDataDocument })

watchEffect(() => {
  if (!query.data) {
    return
  }

  const isLoggedIn = !!query.data.value?.cachedUser?.id || !!query.data.value?.cloudViewer?.id
  // Need to be able to tell whether the lack of `firstOrganization` means they don't have an org or whether it just hasn't loaded yet
  // Not having this check can cause a brief flicker of the 'Create Org' banner while org data is loading
  const isOrganizationLoaded = !!query.data.value?.cloudViewer?.firstOrganization
  const isMemberOfOrganization = (query.data.value?.cloudViewer?.firstOrganization?.nodes?.length ?? 0) > 0
  const isProjectConnected = !!query.data.value?.currentProject?.projectId && query.data.value?.currentProject.cloudProject?.__typename === 'CloudProject'
  const hasRecordedRuns = query.data.value?.currentProject?.cloudProject?.__typename === 'CloudProject' && (query.data.value?.currentProject.cloudProject?.runs?.nodes?.length ?? 0) > 0
  const error = ['AUTH_COULD_NOT_LAUNCH_BROWSER', 'AUTH_ERROR_DURING_LOGIN', 'AUTH_COULD_NOT_LAUNCH_BROWSER'].includes(query.data.value?.authState?.name ?? '')

  if (isProjectConnected !== loginConnectStore.isProjectConnected) {
    setStatus('isProjectConnected', isProjectConnected)
  }

  if (isLoggedIn !== loginConnectStore.isLoggedIn) {
    setStatus('isLoggedIn', isLoggedIn)
  }

  setStatus('isOrganizationLoaded', isOrganizationLoaded)
  setStatus('isMemberOfOrganization', isMemberOfOrganization)
  setStatus('hasRecordedRuns', hasRecordedRuns)

  setLoginError(error)

  setUserData((query.data.value?.cloudViewer ?? query.data.value?.cachedUser) ?? undefined)
})

</script>
