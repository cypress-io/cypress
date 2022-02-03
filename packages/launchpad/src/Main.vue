<template>
  <template v-if="query.data.value">
    <HeaderBar
      class="w-full z-30 fixed"
    />
    <div class="px-24px pt-86px">
      <BaseError
        v-if="query.data.value.baseError"
        :gql="query.data.value.baseError"
      />
      <GlobalPage
        v-else-if="query.data.value.isInGlobalMode || !query.data.value?.currentProject"
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
        <BaseError
          v-else-if="currentProject?.errorLoadingConfigFile"
          :gql="currentProject.errorLoadingConfigFile"
        />
        <BaseError
          v-else-if="currentProject?.errorLoadingNodeEvents"
          :gql="currentProject.errorLoadingNodeEvents"
        />
        <Spinner v-else-if="currentProject?.isLoadingConfigFile" />
        <template v-else-if="currentProject?.isLoadingNodeEvents">
          <LaunchpadHeader
            :title="t('components.loading.config.title')"
            :description="t('components.loading.config.description')"
          />
          <Spinner />
        </template>
        <template v-else-if="!currentProject?.currentTestingType">
          <LaunchpadHeader
            title="Welcome to Cypress!"
            description=""
          />
          <StandardModal
            v-model="isTestingTypeModalOpen"
            class="h-full w-full sm:h-auto sm:mx-[5%] sm:w-auto"
          >
            <template #title>
              Key Differences
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
        <ScaffoldLanguageSelect
          v-else-if="currentProject.currentTestingType === 'e2e' && !currentProject.isE2EConfigured"
          :gql="query.data.value"
        />
        <OpenBrowser v-else />
      </template>
    </div>
  </template>
  <div data-e2e />
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import { MainLaunchpadQueryDocument } from './generated/graphql'
import TestingTypeCards from './setup/TestingTypeCards.vue'
import Wizard from './setup/Wizard.vue'
import ScaffoldLanguageSelect from './setup/ScaffoldLanguageSelect.vue'
import GlobalPage from './global/GlobalPage.vue'
import BaseError from './error/BaseError.vue'
import StandardModal from '@cy/components/StandardModal.vue'
import HeaderBar from '@cy/gql-components/HeaderBar.vue'
import Spinner from '@cy/components/Spinner.vue'
import CompareTestingTypes from './setup/CompareTestingTypes.vue'
import MigrationWizard from './migration/MigrationWizard.vue'
import ScaffoldedFiles from './setup/ScaffoldedFiles.vue'

import { useI18n } from '@cy/i18n'
import { computed, ref } from 'vue'
import LaunchpadHeader from './setup/LaunchpadHeader.vue'
import OpenBrowser from './setup/OpenBrowser.vue'

const { t } = useI18n()
const isTestingTypeModalOpen = ref(false)

gql`
fragment MainLaunchpadQueryData on Query {
  ...TestingTypeCards
  ...Wizard
  ...ScaffoldLanguageSelect
  baseError {
    ...BaseError_Data
  }
  currentTestingType
  currentProject {
    id
    isCTConfigured
    isE2EConfigured
    isLoadingConfigFile
    isLoadingNodeEvents
    needsLegacyConfigMigration
    currentTestingType
    errorLoadingConfigFile {
      ...BaseError_Data
    }
    errorLoadingNodeEvents {
      ...BaseError_Data
    }
  }
  isInGlobalMode
  ...GlobalPage
  ...ScaffoldedFiles
}
`

gql`
query MainLaunchpadQuery {
  ...MainLaunchpadQueryData
}
`

const query = useQuery({ query: MainLaunchpadQueryDocument })
const currentProject = computed(() => query.data.value?.currentProject)
</script>
