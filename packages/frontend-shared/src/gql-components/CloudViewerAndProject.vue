<script setup lang="ts">
import { computed, watchEffect } from 'vue'
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
const { setUserFlag, setProjectFlag, setLoginError, setUserData, setPromptShown, setCypressFirstOpened, setBannersState } = loginConnectStore

useSubscription({ query: CloudViewerAndProject_CheckCloudOrgMembershipDocument })

const query = useQuery({ query: CloudViewerAndProject_RequiredDataDocument })

const cloudProjectId = computed(() => {
  return query.data.value?.currentProject?.config?.find((item: { field: string }) => item.field === 'projectId')?.value
})

watchEffect(() => {
  if (!query.data) {
    return
  }

  const savedState = query.data.value?.currentProject?.savedState

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

  const isLoggedIn = !!query.data.value?.cachedUser?.id || !!query.data.value?.cloudViewer?.id
  // Need to be able to tell whether the lack of `firstOrganization` means they don't have an org or whether it just hasn't loaded yet
  // Not having this check can cause a brief flicker of the 'Create Org' banner while org data is loading
  const isOrganizationLoaded = !!query.data.value?.cloudViewer?.firstOrganization
  const isMemberOfOrganization = (query.data.value?.cloudViewer?.firstOrganization?.nodes?.length ?? 0) > 0
  const isConfigLoaded = !!query.data.value?.currentProject?.isFullConfigReady
  const hasNonExampleSpec = !!query.data.value?.currentProject?.hasNonExampleSpec
  const isProjectConnected = !!cloudProjectId.value && query.data.value?.currentProject?.cloudProject?.__typename === 'CloudProject'
  const error = ['AUTH_COULD_NOT_LAUNCH_BROWSER', 'AUTH_ERROR_DURING_LOGIN', 'AUTH_COULD_NOT_LAUNCH_BROWSER'].includes(query.data.value?.authState?.name ?? '')

  if (isProjectConnected !== loginConnectStore.project.isProjectConnected) {
    setProjectFlag('isProjectConnected', isProjectConnected)
  }

  setProjectFlag('isConfigLoaded', isConfigLoaded)
  setProjectFlag('hasNonExampleSpec', hasNonExampleSpec)

  if (isLoggedIn !== loginConnectStore.user.isLoggedIn) {
    setUserFlag('isLoggedIn', isLoggedIn)
  }

  setUserFlag('isOrganizationLoaded', isOrganizationLoaded)
  setUserFlag('isMemberOfOrganization', isMemberOfOrganization)
  setLoginError(error)
  setUserData((query.data.value?.cloudViewer ?? query.data.value?.cachedUser) ?? undefined)
})

</script>
