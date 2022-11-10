<!--
  This component exists to avoid repeating this logic between the root components
  of packages/app and packages/launchpad. It doesn't render anything and can
  probably be a composable. It hasn't been made into a composable yet as we
  have a convention where we put GQL queries into Vue components, so for simplicity's sake
  this is a regular ole component.
-->

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
    config
    isFullConfigReady
    hasNonExampleSpec
    savedState
    cloudProject {
      __typename
      ... on CloudProject {
        id
        runs(first: 10) {
          nodes {
            id
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
const {
  setUserFlag,
  setProjectFlag,
  setUserData,
  setPromptShown,
  setCypressFirstOpened,
  setBannersState,
} = loginConnectStore

useSubscription({ query: CloudViewerAndProject_CheckCloudOrgMembershipDocument })

const query = useQuery({ query: CloudViewerAndProject_RequiredDataDocument })

watchEffect(() => {
  if (!query.data.value) {
    return
  }

  const {
    currentProject,
    cachedUser,
    cloudViewer,
    authState,
  } = query.data.value

  const savedState = currentProject?.savedState

  if (savedState?.promptsShown) {
    for (const item in savedState.promptsShown) {
      setPromptShown(item, savedState.promptsShown[item])
    }
  }

  if (savedState?.firstOpened) {
    setCypressFirstOpened(savedState.firstOpened)
  }

  if (savedState?.banners) {
    setBannersState(savedState.banners)
  }

  const AUTH_STATE_ERRORS = ['AUTH_COULD_NOT_LAUNCH_BROWSER', 'AUTH_ERROR_DURING_LOGIN', 'AUTH_COULD_NOT_LAUNCH_BROWSER']

  // 1. set user-related information in store
  setUserData((cloudViewer ?? cachedUser) ?? undefined)
  setUserFlag('isLoggedIn', !!cachedUser?.id || !!cloudViewer?.id)
  setUserFlag('loginError', AUTH_STATE_ERRORS.includes(authState?.name ?? ''))

  if (cloudViewer) {
    // Need to be able to tell whether the lack of `firstOrganization` means they don't have an org or whether it just hasn't loaded yet
    // Not having this check can cause a brief flicker of the 'Create Org' banner while org data is loading
    setUserFlag('isOrganizationLoaded', !!cloudViewer.firstOrganization)
    setUserFlag('isMemberOfOrganization', (cloudViewer.firstOrganization?.nodes?.length ?? 0) > 0)
  }

  // 2. set project-related information in the store
  setProjectFlag('isConfigLoaded', !!currentProject?.isFullConfigReady)
  setProjectFlag('isNotAuthorized', currentProject?.cloudProject?.__typename === 'CloudProjectUnauthorized')
  setProjectFlag('isNotFound', currentProject?.cloudProject?.__typename === 'CloudProjectNotFound')
  setProjectFlag('hasNonExampleSpec', !!currentProject?.hasNonExampleSpec)
  setProjectFlag('hasNoRecordedRuns', currentProject?.cloudProject?.__typename === 'CloudProject' && (currentProject.cloudProject?.runs?.nodes?.length ?? 0) === 0)

  if (currentProject?.cloudProject || !loginConnectStore.user.isLoggedIn) {
    setProjectFlag('isProjectConnected', currentProject?.cloudProject?.__typename === 'CloudProject')
  }
})

</script>
