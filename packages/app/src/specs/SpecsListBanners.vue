<template>
  <Alert
    v-if="showSpecNotFound"
    v-model="showSpecNotFound"
    status="error"
    :title="t('specPage.noSpecError.title')"
    class="mb-16px"
    :icon="WarningIcon"
    dismissible
  >
    <p class="mb-24px">
      {{ t('specPage.noSpecError.intro') }} <InlineCodeFragment variant="error">
        {{ route.params.unrunnable }}
      </InlineCodeFragment>
    </p>
    <p>{{ t('specPage.noSpecError.explainer') }}</p>
  </Alert>
  <Alert
    v-else-if="showOffline"
    v-model="showOffline"
    data-cy="offline-alert"
    status="warning"
    :title="t('specPage.offlineWarning.title')"
    class="mb-16px"
    :icon="WarningIcon"
    dismissible
  >
    <p class="mb-24px">
      {{ t('specPage.offlineWarning.explainer') }}
    </p>
  </Alert>
  <Alert
    v-else-if="showFetchError"
    v-model="showFetchError"
    status="warning"
    :title="t('specPage.fetchFailedWarning.title')"
    class="mb-16px"
    :icon="WarningIcon"
    dismissible
  >
    <p>
      {{ t('specPage.fetchFailedWarning.explainer1') }}
    </p>
    <p>
      <i18n-t
        scope="global"
        keypath="specPage.fetchFailedWarning.explainer2"
      >
        <ExternalLink
          href="https://www.cypressstatus.com"
          class="font-medium text-indigo-500 contents group-hocus:text-indigo-600"
        >
          Status Page
        </ExternalLink>
      </i18n-t>
    </p>
    <Button
      :prefix-icon="RefreshIcon"
      class="mt-24px"
      data-cy="refresh-button"
      @click="emit('refetchFailedCloudData')"
    >
      {{ t('specPage.fetchFailedWarning.refreshButton') }}
    </Button>
  </Alert>
  <Alert
    v-else-if="showProjectNotFound"
    v-model="showProjectNotFound"
    data-cy="project-not-found-alert"
    status="warning"
    :title="t('runs.errors.notFound.title')"
    class="mb-16px"
    :icon="WarningIcon"
    dismissible
  >
    <p class="mb-24px">
      <i18n-t
        scope="global"
        keypath="runs.errors.notFound.description"
      >
        <CodeTag
          bg
          class="bg-warning-100"
        >
          projectId: "{{ props.gql.currentProject?.projectId }}"
        </CodeTag>
      </i18n-t>
    </p>
    <Button
      :prefix-icon="ConnectIcon"
      class="mt-24px"
      data-cy="reconnect-button"
      @click="emit('reconnectProject')"
    >
      {{ t('runs.errors.notFound.button') }}
    </Button>
  </Alert>
  <Alert
    v-else-if="showProjectRequestAccess"
    v-model="showProjectRequestAccess"
    data-cy="project-request-access-alert"
    status="warning"
    :title="t('specPage.unauthorizedBannerTitle')"
    class="mb-16px"
    :icon="WarningIcon"
    dismissible
  >
    <p class="mb-24px">
      {{ props.hasRequestedAccess ? t('runs.errors.unauthorizedRequested.description') : t('runs.errors.unauthorized.description') }}
    </p>
    <RequestAccessButton :gql="props.gql" />
  </Alert>
  <RecordBanner
    v-else-if="showRecordBanner"
    v-model="showRecordBanner"
  />
  <ConnectProjectBanner
    v-else-if="showConnectBanner"
    v-model="showConnectBanner"
  />
  <CreateOrganizationBanner
    v-else-if="showCreateOrganizationBanner"
    v-model="showCreateOrganizationBanner"
  />
  <LoginBanner
    v-else-if="showLoginBanner"
    v-model="showLoginBanner"
  />
</template>

<script setup lang="ts">
import Button from '@cy/components/Button.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { useI18n } from '@cy/i18n'
import Alert from '@packages/frontend-shared/src/components/Alert.vue'
import CodeTag from '@packages/frontend-shared/src/components/CodeTag.vue'
import InlineCodeFragment from '@packages/frontend-shared/src/components/InlineCodeFragment.vue'
import ConnectIcon from '~icons/cy/chain-link_x16.svg'
import WarningIcon from '~icons/cy/warning_x16.svg'
import RefreshIcon from '~icons/cy/action-restart_x16'
import { useRoute } from 'vue-router'
import { ref, watch } from 'vue'
import RequestAccessButton from './RequestAccessButton.vue'
import { gql } from '@urql/vue'
import type { SpecsListBannersFragment } from '../generated/graphql'
import interval from 'human-interval'
import type { AllowedState } from '@packages/types/src'
import RecordBanner from './banners/RecordBanner.vue'
import ConnectProjectBanner from './banners/ConnectProjectBanner.vue'
import CreateOrganizationBanner from './banners/CreateOrganizationBanner.vue'
import LoginBanner from './banners/LoginBanner.vue'
import { BannerIds } from './banners'

const route = useRoute()
const { t } = useI18n()

gql`
fragment SpecsListBanners on Query {
  ...RequestAccessButton
  cloudViewer {
    id
    firstOrganization: organizations(first: 1) {
      nodes {
        id
      }
    }
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
mutation SpecsListBanners_SetBannerShown($bannerId: String!) {
  setBannerShown(bannerId: $bannerId)
}
`

gql`
mutation SpecsListBanners_SetBannerDismissed($bannerId: String!) {
  setBannerDismissed(bannerId: $bannerId)
}
`

const props = withDefaults(defineProps<{
  gql: SpecsListBannersFragment
  hasRequestedAccess?: boolean
  isSpecNotFound?: boolean
  isOffline?: boolean
  isFetchError?: boolean
  isProjectNotFound?: boolean
  isProjectUnauthorized?: boolean
}>(), {
  isSpecNotFound: undefined,
  isOffline: undefined,
  isFetchError: undefined,
  isProjectNotFound: undefined,
  isProjectUnauthorized: undefined,
})

const emit = defineEmits<{
  (e: 'refetchFailedCloudData'): void
  (e: 'reconnectProject'): void
}>()

const isLoggedIn = !!props.gql.cloudViewer?.id
const isMemberOfOrganization = !!props.gql.cloudViewer?.firstOrganization
const isProjectConnected = !!props.gql.currentProject?.projectId && props.gql.currentProject.cloudProject?.__typename === 'CloudProject'
const hasNoRecordedRuns = props.gql.currentProject?.cloudProject?.__typename === 'CloudProject' && (props.gql.currentProject.cloudProject.runs?.nodes?.length ?? 0) === 0
const hasFourDaysOfCypressUse = (Date.now() - props.gql.currentProject?.savedState?.firstOpened) > interval('4 days')

const showSpecNotFound = ref(props.isSpecNotFound)
const showOffline = ref(props.isOffline)
const showFetchError = ref(props.isFetchError)
const showProjectNotFound = ref(props.isProjectNotFound)
const showProjectRequestAccess = ref(props.isProjectUnauthorized)
const showRecordBanner = ref(!hasBannerBeenDismissed(BannerIds.ACI_082022_RECORD) && isLoggedIn && isProjectConnected && isMemberOfOrganization && isProjectConnected && hasNoRecordedRuns && hasFourDaysOfCypressUse)
const showConnectBanner = ref(!hasBannerBeenDismissed(BannerIds.ACI_082022_CONNECT_PROJECT) && isLoggedIn && isMemberOfOrganization && !isProjectConnected && hasFourDaysOfCypressUse)
const showCreateOrganizationBanner = ref(!hasBannerBeenDismissed(BannerIds.ACI_082022_CREATE_ORG) && isLoggedIn && !isMemberOfOrganization && hasFourDaysOfCypressUse)
const showLoginBanner = ref(!hasBannerBeenDismissed(BannerIds.ACI_082022_LOGIN) && !isLoggedIn && hasFourDaysOfCypressUse)

watch(
  () => ([props.isSpecNotFound, props.isOffline, props.isFetchError, props.isProjectNotFound, props.isProjectUnauthorized]),
  () => {
    showSpecNotFound.value = props.isSpecNotFound
    showOffline.value = props.isOffline
    showFetchError.value = props.isFetchError
    showProjectNotFound.value = props.isProjectNotFound
    showProjectRequestAccess.value = props.isProjectUnauthorized
  },
)

function hasBannerBeenDismissed (bannerId: string) {
  const bannersState = (props.gql.currentProject?.savedState as AllowedState)?.banners

  return !!bannersState?.[bannerId]?.dismissed
}

</script>
