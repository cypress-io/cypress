<template>
  <Alert
    v-if="showSpecNotFound"
    v-model="showSpecNotFound"
    status="error"
    title="Spec not found"
    class="mb-[16px]"
    :icon="WarningIcon"
    dismissible
  >
    <p class="mb-[24px]">
      There is no spec matching the following location: <InlineCodeFragment variant="error">
        {{ route.params.unrunnable }}
      </InlineCodeFragment>
    </p>
    <p>It is possible that the file has been moved or deleted. Please choose from the list of specs below.</p>
  </Alert>
  <Alert
    v-else-if="showOffline"
    v-model="showOffline"
    data-cy="offline-alert"
    status="warning"
    title="No internet connection"
    class="mb-[16px]"
    :icon="WarningIcon"
    dismissible
  >
    <p class="mb-[24px]">
      Please check your internet connection to resolve this issue. When your internet connection is fixed, we will automatically attempt to fetch the run metrics from Cypress Cloud.
    </p>
  </Alert>
  <Alert
    v-else-if="showFetchError"
    v-model="showFetchError"
    status="warning"
    title="Lost connection"
    class="mb-[16px]"
    :icon="WarningIcon"
    dismissible
  >
    <p>
      The request timed out or failed when trying to retrieve the recorded run metrics from Cypress Cloud. The information that you're seeing in the table below may be incomplete as a result.
    </p>
    <p>
      Please refresh the page to try again and visit our
      <ExternalLink
        href="https://www.cypressstatus.com"
        class="font-medium text-indigo-500 contents group-hocus:text-indigo-600"
      >
        Status Page
      </ExternalLink>
      if this behavior continues.
    </p>
    <Button
      :prefix-icon="RefreshIcon"
      class="mt-[24px]"
      data-cy="refresh-button"
      @click="emit('refetchFailedCloudData')"
    >
      Try again
    </Button>
  </Alert>
  <Alert
    v-else-if="showProjectNotFound"
    v-model="showProjectNotFound"
    data-cy="project-not-found-alert"
    status="warning"
    title="Couldn't find your project"
    class="mb-[16px]"
    :icon="WarningIcon"
    dismissible
  >
    <p class="mb-[24px]">
      We were unable to find an existing project matching the
      <CodeTag
        bg
        class="bg-warning-100"
      >
        projectId: "{{ props.gql.currentProject?.projectId }}"
      </CodeTag>
      set in your Cypress config file. You can reconnect with an existing project or create a new project.
    </p>
    <Button
      :prefix-icon="ConnectIcon"
      class="mt-[24px]"
      data-cy="reconnect-button"
      @click="userProjectStatusStore.openLoginConnectModal({utmMedium: 'Tests Tab'})"
    >
      Reconnect your project
    </Button>
  </Alert>
  <Alert
    v-else-if="showProjectRequestAccess"
    v-model="showProjectRequestAccess"
    data-cy="project-request-access-alert"
    status="warning"
    title="Request access to project"
    class="mb-[16px]"
    :icon="WarningIcon"
    dismissible
  >
    <p class="mb-[24px]">
      {{ requestAccessDescription }}
    </p>
    <RequestAccessButton :gql="props.gql" />
  </Alert>

  <CloudMessageBanner
    v-else-if="activeCloudMessage"
    :key="activeCloudMessage.id"
    :has-banner-been-shown="hasCloudMessageBeenShown"
    :message="activeCloudMessage"
  />
  <component
    :is="bannerComponentToShow"
    v-else-if="cloudMessagesHaveResolved && bannerComponentToShow"
    :has-banner-been-shown="hasCurrentBannerBeenShown"
    :cohort-option="currentCohortOption.cohort"
    :framework="ctFramework"
    :bundler="ctBundler"
    :machine-id="props.gql.machineId"
  />
</template>

<script setup lang="ts">
import Button from '@cy/components/Button.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import Alert from '@packages/frontend-shared/src/components/Alert.vue'
import CodeTag from '@packages/frontend-shared/src/components/CodeTag.vue'
import InlineCodeFragment from '@packages/frontend-shared/src/components/InlineCodeFragment.vue'
import ConnectIcon from '~icons/cy/chain-link_x16.svg'
import WarningIcon from '~icons/cy/warning_x16.svg'
import RefreshIcon from '~icons/cy/action-restart_x16'
import { useRoute } from 'vue-router'
import { computed, reactive, ref, watch } from 'vue'
import RequestAccessButton from './RequestAccessButton.vue'
import { gql } from '@urql/vue'
import { SpecsListBanners_CheckCloudOrgMembershipDocument } from '../generated/graphql'
import type { SpecsListBannersFragment } from '../generated/graphql'
import { BannerIds } from '@packages/types'
import type { AllowedState } from '@packages/types'
import { LoginBanner, ComponentTestingAvailableBanner, CreateOrganizationBanner, ConnectProjectBanner, RecordBanner, CloudMessageBanner } from './banners'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'
import { usePromptManager } from '@packages/frontend-shared/src/gql-components/composables/usePromptManager'
import { useCohorts } from '@packages/frontend-shared/src/gql-components/composables/useCohorts'
import type { CohortConfig, CohortOption } from '@packages/frontend-shared/src/gql-components/composables/useCohorts'
import { useSubscription } from '../graphql'

const route = useRoute()
const userProjectStatusStore = useUserProjectStatusStore()

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
  cachedUser {
    id
  }
  currentProject {
    id
    projectId
    savedState
    currentTestingType
    config
  }
  machineId
  wizard {
    framework {
      id
      name
      icon
      type
    }
    bundler {
      id
      name
    }
  }
  cloudAppMessages {
    id
    enabled
    priority
    visualStyle
    title
    body
    ctas {
      id
      text
      href
      style
      utm {
        content
        term
        id
      }
    }
    dismissal {
      scope
    }
    analytics {
      campaign
      category
      utm {
        content
        term
        id
      }
    }
  }
  localSettings {
    preferences {
      banners
    }
  }
}
`

gql`
subscription SpecsListBanners_CheckCloudOrgMembership {
  cloudViewerChange {
    ...SpecsListBanners
  }
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
}>()

const requestAccessDescription = computed(() => {
  return props.hasRequestedAccess
    ? 'The owner of this project has been notified of your request. We\'ll notify you via email when your access request has been granted.'
    : 'This is a private project that you do not currently have access to. Please request access from the project owner in order to view the list of runs.'
})

useSubscription({ query: SpecsListBanners_CheckCloudOrgMembershipDocument })

const showSpecNotFound = ref(props.isSpecNotFound)
const showOffline = ref(props.isOffline)
const showFetchError = ref(props.isFetchError)
const showProjectNotFound = ref(props.isProjectNotFound)
const showProjectRequestAccess = ref(props.isProjectUnauthorized)

const bannerIds = {
  isLoggedOut: BannerIds.ACI_082022_LOGIN,
  needsOrgConnect: BannerIds.ACI_082022_CREATE_ORG,
  needsProjectConnect: BannerIds.ACI_082022_CONNECT_PROJECT,
  needsRecordedRun: BannerIds.ACI_082022_RECORD,
  isComponentTestingCandidate: BannerIds.CT_052023_AVAILABLE,
} as const

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

const { getEffectiveBannerState } = usePromptManager()

const bannerComponentToShow = computed(() => {
  const componentsByStatus = {
    isLoggedOut: LoginBanner,
    needsOrgConnect: CreateOrganizationBanner,
    needsProjectConnect: ConnectProjectBanner,
    needsRecordedRun: RecordBanner,
    isComponentTestingCandidate: ComponentTestingAvailableBanner,
  }

  const bannerStateToShow = getEffectiveBannerState('specsListBanner')

  return bannerStateToShow ? componentsByStatus[bannerStateToShow] : null
})

const hasCurrentBannerBeenShown = computed(() => {
  const bannerStateToShow = getEffectiveBannerState('specsListBanner')
  const bannersState = (props.gql.currentProject?.savedState as AllowedState)?.banners
  const bannerId = bannerStateToShow && bannerIds[bannerStateToShow]

  return !!bannersState?._disabled || (!!bannerId && !!bannersState?.[bannerId]?.lastShown)
})

type BannerKeys = keyof typeof BannerIds
type BannerId = typeof BannerIds[BannerKeys]
type BannerCohortOptions = Partial<Record<BannerId, CohortOption[]>>

const bannerCohortOptions: BannerCohortOptions = {
  [BannerIds.ACI_082022_LOGIN]: [
    // Campaign ended in v12.4.0, see GH issue #24472
    { cohort: '', value: 'When you configure Cypress to record tests to Cypress Cloud, you\'ll see data from your latest recorded runs in the Cypress app. This increased visibility into your test history allows you to debug your tests faster and more effectively, all within your local workflow.' },
  ],
  [BannerIds.ACI_082022_CREATE_ORG]: [
    // Campaign ended in v12.4.0, see GH issue #24472
    { cohort: '', value: 'Finish setting up Cypress Cloud' },
  ],
  [BannerIds.ACI_082022_CONNECT_PROJECT]: [
    // Campaign ended in v12.4.0, see GH issue #24472
    { cohort: '', value: 'Bring your recorded test results into your local development workflow to monitor, run, and fix tests all in the Cypress app.' },
  ],
}

const cohortBuilder = useCohorts()

const getCohortForBanner = (bannerId: BannerId) => {
  const cohortConfig: CohortConfig = {
    name: bannerId,
    options: bannerCohortOptions[bannerId] || [],
  }

  // tslint:disable-next-line:no-floating-promises
  return cohortBuilder.getCohort(cohortConfig)
}

const currentCohortOption = computed(() => {
  if (!bannerCohortOptions[bannerIds[userProjectStatusStore.cloudStatus]]) {
    return { cohort: null }
  }

  return reactive({ cohort: getCohortForBanner(bannerIds[userProjectStatusStore.cloudStatus]) })
})

const ctFramework = computed(() => {
  return {
    name: props.gql.wizard?.framework?.name,
    type: props.gql.wizard?.framework?.type,
    icon: props.gql.wizard?.framework?.icon,
  }
})

const ctBundler = computed(() => props.gql.wizard?.bundler?.name)

const cloudMessageDismissalKey = (id: string) => `cloud:${id}` as const

function getDismissalState (msg: NonNullable<SpecsListBannersFragment['cloudAppMessages']>[number]) {
  if (msg.dismissal.scope === 'user') {
    const globalBanners = props.gql.localSettings?.preferences?.banners as AllowedState['banners']

    return globalBanners?.[cloudMessageDismissalKey(msg.id)]
  }

  const projectBanners = (props.gql.currentProject?.savedState as AllowedState)?.banners

  return projectBanners?.[cloudMessageDismissalKey(msg.id)]
}

function isCloudMessageEligible (msg: NonNullable<SpecsListBannersFragment['cloudAppMessages']>[number]) {
  if (!msg.enabled) {
    return false
  }

  // `_disabled` is the E2E-test kill switch for all banners.
  const projectBanners = (props.gql.currentProject?.savedState as AllowedState)?.banners

  if (projectBanners?._disabled) {
    return false
  }

  return !getDismissalState(msg)?.dismissed
}

// Gates onboarding banners until the cloud query resolves (undefined → loading).
const cloudMessagesHaveResolved = computed(() => {
  return props.gql.cloudAppMessages !== undefined
})

const activeCloudMessage = computed(() => {
  const messages = props.gql.cloudAppMessages ?? []
  const eligible = messages.filter((m): m is NonNullable<typeof m> => !!m && isCloudMessageEligible(m))
  const sorted = [...eligible].sort((a, b) => b.priority - a.priority)

  return sorted[0] ?? null
})

const hasCloudMessageBeenShown = computed(() => {
  const msg = activeCloudMessage.value

  if (!msg) {
    return false
  }

  return !!getDismissalState(msg)?.lastShown
})

</script>
