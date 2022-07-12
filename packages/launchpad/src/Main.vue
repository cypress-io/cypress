<template>
  <template v-if="query.data.value">
    <HeaderBar
      class="w-full z-10 fixed"
    />

    <MigrationLandingPage
      v-if="currentProject?.needsLegacyConfigMigration && !wasLandingPageShown && online && videoHtml"
      class="pt-64px"
      :video-html="videoHtml"
      @clearLandingPage="wasLandingPageShown = true"
    />
    <div
      v-else
      class="px-24px pt-86px pb-24px"
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
        v-else-if="currentProject?.needsLegacyConfigMigration && wasLandingPageShown"
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
            class="mx-auto mt-12px text-indigo-500 text-18px block hocus-link-default group"
            @click="isTestingTypeModalOpen = true"
          >
            {{ t('welcomePage.review') }}<i-cy-arrow-right_x16
              class="ml-4px transform transition-transform ease-in -translate-y-1px duration-200 inline-block icon-dark-current group-hocus:translate-x-2px"
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
    </div>
  </template>
  <div data-e2e />
</template>

<script lang="ts" setup>
import { gql, useMutation, useQuery } from '@urql/vue'
import { MainLaunchpadQueryDocument, Main_ResetErrorsAndLoadConfigDocument } from './generated/graphql'
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
import MigrationLandingPage from './migration/MigrationLandingPage.vue'
import { useI18n } from '@cy/i18n'
import { computed, ref } from 'vue'
import LaunchpadHeader from './setup/LaunchpadHeader.vue'
import OpenBrowser from './setup/OpenBrowser.vue'
import { useOnline } from '@vueuse/core'

const { t } = useI18n()
const isTestingTypeModalOpen = ref(false)
const wasLandingPageShown = ref(false)
const online = useOnline()

gql`
fragment MainLaunchpadQueryData on Query {
  ...TestingTypeCards
  ...Wizard
  baseError {
    id
    ...BaseError
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
  }
  migration {
    videoEmbedHtml
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

const mutation = useMutation(Main_ResetErrorsAndLoadConfigDocument)

const resetErrorAndLoadConfig = (id: string) => {
  if (!mutation.fetching.value) {
    mutation.executeMutation({ id })
  }
}
const query = useQuery({ query: MainLaunchpadQueryDocument })
const currentProject = computed(() => query.data.value?.currentProject)
const videoHtml = computed(() => query.data.value?.migration?.videoEmbedHtml)

</script>
