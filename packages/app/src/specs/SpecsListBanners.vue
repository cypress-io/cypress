<template>
  <Alert
    v-if="showSpecNotFound"
    v-model="showSpecNotFound"
    status="error"
    :title="t('specPage.noSpecError.title')"
    class="mb-[16px]"
    :icon="WarningIcon"
    dismissible
  >
    <p class="mb-[24px]">
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
    class="mb-[16px]"
    :icon="WarningIcon"
    dismissible
  >
    <p class="mb-[24px]">
      {{ t('specPage.offlineWarning.explainer') }}
    </p>
  </Alert>
  <Alert
    v-else-if="showFetchError"
    v-model="showFetchError"
    status="warning"
    :title="t('specPage.fetchFailedWarning.title')"
    class="mb-[16px]"
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
      class="mt-[24px]"
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
    class="mb-[16px]"
    :icon="WarningIcon"
    dismissible
  >
    <p class="mb-[24px]">
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
      class="mt-[24px]"
      data-cy="reconnect-button"
      @click="userProjectStatusStore.openLoginConnectModal({utmMedium: 'Tests Tab'})"
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
    class="mb-[16px]"
    :icon="WarningIcon"
    dismissible
  >
    <p class="mb-[24px]">
      {{ props.hasRequestedAccess ? t('runs.errors.unauthorizedRequested.description') : t('runs.errors.unauthorized.description') }}
    </p>
    <RequestAccessButton :gql="props.gql" />
  </Alert>

  <component
    :is="bannerComponentToShow"
    v-else-if="bannerComponentToShow"
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
import { useI18n } from '@cy/i18n'
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
import { SpecsListBannersFragment, SpecsListBanners_CheckCloudOrgMembershipDocument } from '../generated/graphql'
import { AllowedState, BannerIds } from '@packages/types'
import { LoginBanner, ComponentTestingAvailableBanner, CreateOrganizationBanner, ConnectProjectBanner, RecordBanner } from './banners'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'
import { usePromptManager } from '@packages/frontend-shared/src/gql-components/composables/usePromptManager'
import { CohortConfig, CohortOption, useCohorts } from '@packages/frontend-shared/src/gql-components/composables/useCohorts'
import { useSubscription } from '../graphql'

const route = useRoute()
const { t } = useI18n()
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
    { cohort: '', value: t('specPage.banners.login.content') },
  ],
  [BannerIds.ACI_082022_CREATE_ORG]: [
    // Campaign ended in v12.4.0, see GH issue #24472
    { cohort: '', value: t('specPage.banners.createOrganization.title') },
  ],
  [BannerIds.ACI_082022_CONNECT_PROJECT]: [
    // Campaign ended in v12.4.0, see GH issue #24472
    { cohort: '', value: t('specPage.banners.connectProject.content') },
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

</script>
