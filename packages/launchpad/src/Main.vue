<template>
  <template v-if="query.data.value">
    <HeaderBar
      class="w-full z-10 fixed"
    />
    <MajorVersionWelcome
      v-if="shouldShowWelcome"
      class="pt-[64px]"
      role="main"
      @clearLandingPage="handleClearLandingPage"
    />
    <main
      v-else
      class="px-[24px] pt-[86px] pb-[24px]"
      role="main"
    >
      <BaseError
        v-if="query.data.value.baseError"
        :gql="query.data.value.baseError"
        @retry="resetErrorAndLoadConfig"
      />
      <GlobalPage
        v-else-if="query.data.value.isGlobalMode && !query.data.value?.currentProject"
        :gql="query.data.value"
      />
      <MigrationWizard
        v-else-if="currentProject?.needsLegacyConfigMigration"
      />
      <template v-else>
        <ScaffoldedFiles
          v-if="query.data.value.scaffoldedFiles"
          :gql="query.data.value"
        />
        <Spinner v-else-if="currentProject?.isLoadingConfigFile" />
        <template v-else-if="!currentProject?.currentTestingType">
          <WarningList :gql="query.data.value" />
          <LaunchpadHeader
            :title="t('welcomePage.title')"
            description=""
          />
          <StandardModal
            v-model="isTestingTypeModalOpen"
            class="h-full w-full sm:h-auto sm:mx-[5%] sm:w-auto"
            help-link="https://on.cypress.io/choosing-testing-type"
          >
            <template #title>
              {{ t('welcomePage.compareTypes.modalTitle') }}
            </template>
            <CompareTestingTypes />
          </StandardModal>
          <button
            class="mx-auto mt-[12px] text-indigo-500 text-[18px] block hocus-link-default group"
            @click="isTestingTypeModalOpen = true"
          >
            {{ t('welcomePage.review') }}<i-cy-arrow-right_x16
              class="ml-[4px] transform transition-transform ease-in translate-y-[-1px] duration-200 inline-block icon-dark-current group-hocus:translate-x-[2px]"
            />
          </button>
          <TestingTypeCards
            :gql="query.data.value"
          />
        </template>
        <Wizard
          v-else-if="currentProject.currentTestingType === 'component' && !currentProject.isCTConfigured"
          :gql="query.data.value"
        />
        <template v-else-if="!currentProject?.isFullConfigReady">
          <LaunchpadHeader
            :title="t('components.loading.config.title')"
            :description="t('components.loading.config.description')"
          />
          <Spinner />
        </template>
        <OpenBrowser v-else />
      </template>
    </main>
    <CloudViewerAndProject />
    <LoginConnectModals />
  </template>
  <Spinner v-else />
  <div data-e2e />
</template>

<script lang="ts" setup>
import { gql, useMutation, useQuery } from '@urql/vue'
import { MainLaunchpadQueryDocument, Main_ResetErrorsAndLoadConfigDocument, Main_LaunchProjectDocument } from './generated/graphql'
import TestingTypeCards from './setup/TestingTypeCards.vue'
import Wizard from './setup/Wizard.vue'
import GlobalPage from './global/GlobalPage.vue'
import BaseError from '@cy/gql-components/error/BaseError.vue'
import WarningList from './warning/WarningList.vue'
import StandardModal from '@cy/components/StandardModal.vue'
import HeaderBar from '@cy/gql-components/HeaderBar.vue'
import Spinner from '@cy/components/Spinner.vue'
import CompareTestingTypes from './setup/CompareTestingTypes.vue'
import MigrationWizard from './migration/MigrationWizard.vue'
import ScaffoldedFiles from './setup/ScaffoldedFiles.vue'
import MajorVersionWelcome from './migration/MajorVersionWelcome.vue'
import { useI18n } from '@cy/i18n'
import { computed, ref, watch } from 'vue'
import LaunchpadHeader from './setup/LaunchpadHeader.vue'
import OpenBrowser from './setup/OpenBrowser.vue'
import LoginConnectModals from '@cy/gql-components/LoginConnectModals.vue'
import CloudViewerAndProject from '@cy/gql-components/CloudViewerAndProject.vue'
import { usePromptManager } from '@cy/gql-components/composables/usePromptManager'
import { GET_MAJOR_VERSION_FOR_CONTENT } from '@packages/types'

const { setMajorVersionWelcomeDismissed } = usePromptManager()
const { t } = useI18n()
const isTestingTypeModalOpen = ref(false)

gql`
fragment MainLaunchpadQueryData on Query {
  ...TestingTypeCards
  ...Wizard
  baseError {
    id
    ...BaseError
  }
  localSettings {
    preferences {
      majorVersionWelcomeDismissed
      wasBrowserSetInCLI
      shouldLaunchBrowserFromOpenBrowser
    }
  }
  currentProject {
    id
    isCTConfigured
    isE2EConfigured
    isLoadingConfigFile
    isLoadingNodeEvents
    isFullConfigReady
    needsLegacyConfigMigration
    currentTestingType
    activeBrowser {
      id
    }
  }
  isGlobalMode
  ...GlobalPage
  ...ScaffoldedFiles
  ...WarningList
}
`

gql`
query MainLaunchpadQuery {
  ...MainLaunchpadQueryData
}
`

gql`
mutation Main_ResetErrorsAndLoadConfig($id: ID!) {
  resetErrorAndLoadConfig(id: $id) {
    ...MainLaunchpadQueryData
  }
}
`

gql`
mutation Main_LaunchProject ($testingType: TestingTypeEnum!)  {
  launchOpenProject {
    id
  }
  setProjectPreferencesInGlobalCache(testingType: $testingType) {
    currentProject {
      id
      title
    }
  }
}
`

const mutation = useMutation(Main_ResetErrorsAndLoadConfigDocument)
const launchProject = useMutation(Main_LaunchProjectDocument)

const resetErrorAndLoadConfig = (id: string) => {
  if (!mutation.fetching.value) {
    mutation.executeMutation({ id })
  }
}
const query = useQuery({ query: MainLaunchpadQueryDocument })
const currentProject = computed(() => query.data.value?.currentProject)
const hasBaseError = computed(() => !!query.data.value?.baseError)

const refetchDelaying = ref(false)
const refetchCount = ref(0)

/*
 * Sometimes the config file has not been loaded by the DataContext's config manager by the
 * time the MainLaunchpadQueryDocument request is sent off. The server ends up resolving
 * the isLoadingConfigFile field as false. In certain situations, there can be a race between
 * opening the project and the DataContext completing its retrieval of the configuration.
 * In these cases, we want to retry the query until the config file is fully loaded.
 *
 * If the ProjectConfigIPC encounters an error while loading the config, it will update the
 * baseError field via subscription, so there is not a limit set here on retries.
 */

watch(
  [currentProject, query.fetching],
  ([currentProject, isFetchingProject]) => {
    const isLoadingConfig = currentProject?.isLoadingConfigFile

    /*
     * conditions for refetch are:
     * - There is a current project, but Config file has not yet loaded
     * - There are no pending (delayed) refetches, or fetches in progress
     * - There is no baseError - we don't want to continue to refetch if
     *   things have errored out.
     */
    if (
      currentProject &&
      isLoadingConfig &&
      !isFetchingProject &&
      !refetchDelaying.value &&
      !hasBaseError.value
    ) {
      refetchDelaying.value = true
      refetchCount.value++
      setTimeout(() => {
        refetchDelaying.value = false
        if (
          (currentProject && !isLoadingConfig) || hasBaseError.value
        ) {
          return
        }

        query.executeQuery({ requestPolicy: 'network-only' })
      }, (refetchCount.value + 1) * 500)
    }
  },
)

function handleClearLandingPage () {
  setMajorVersionWelcomeDismissed(GET_MAJOR_VERSION_FOR_CONTENT())
  const shouldLaunchBrowser = query.data?.value?.localSettings?.preferences?.shouldLaunchBrowserFromOpenBrowser

  const currentTestingType = currentProject.value?.currentTestingType

  if (shouldLaunchBrowser && currentTestingType) {
    launchProject.executeMutation({ testingType: currentTestingType })
  }
}

const shouldShowWelcome = computed(() => {
  if (query.data.value) {
    const hasThisVersionBeenSeen = query.data.value?.localSettings?.preferences?.majorVersionWelcomeDismissed?.[GET_MAJOR_VERSION_FOR_CONTENT()]
    const wasBrowserSetInCLI = query.data?.value?.localSettings.preferences?.wasBrowserSetInCLI
    const currentTestingType = currentProject.value?.currentTestingType

    const activeBrowser = currentProject.value?.activeBrowser

    const needsActiveBrowser = wasBrowserSetInCLI && currentTestingType

    // if Cypress opened with --browser and --testingType flags,
    // the next step is project launch, so we don't show welcome until browser is ready
    if (needsActiveBrowser) {
      return !hasThisVersionBeenSeen && activeBrowser
    }

    return !hasThisVersionBeenSeen
  }

  return false
})

</script>
<style scoped lang="scss">
.major-version-welcome-video {
  aspect-ratio: 15/9;
}
</style>
