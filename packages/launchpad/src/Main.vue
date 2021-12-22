<template>
  <template v-if="query.data.value">
    <HeaderBar />
    <div class="p-24px">
      <BaseError
        v-if="query.data.value.baseError"
        :gql="query.data.value.baseError"
      />
      <GlobalPage
        v-else-if="query.data.value.isInGlobalMode || !query.data.value?.currentProject"
        :gql="query.data.value"
      />
      <MigrationPage v-else-if="currentProject?.needsLegacyConfigMigration" />
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
            title="Initializing Config..."
            description="Please wait while we load your project and find browsers installed on your system"
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
            class="h-full sm:h-auto sm:w-auto w-full sm:mx-[5%]"
          >
            <template #title>
              Key Differences
            </template>
            <CompareTestingTypes />
          </StandardModal>
          <button
            class="block mx-auto text-indigo-500 text-18px hocus-link-default group mt-12px"
            @click="isTestingTypeModalOpen = true"
          >
            {{ t('welcomePage.review') }}<i-cy-arrow-right_x16
              class="inline-block transition-transform duration-200 ease-in transform -translate-y-1px ml-4px icon-dark-current group-hocus:translate-x-2px"
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
import GlobalPage from './global/GlobalPage.vue'
import BaseError from './error/BaseError.vue'
import StandardModal from '@cy/components/StandardModal.vue'
import HeaderBar from '@cy/gql-components/HeaderBar.vue'
import Spinner from '@cy/components/Spinner.vue'
import CompareTestingTypes from './setup/CompareTestingTypes.vue'
import MigrationPage from './setup/MigrationPage.vue'
import ScaffoldedFiles from './setup/ScaffoldedFiles.vue'

import { useI18n } from '@cy/i18n'
import { computed, ref } from 'vue'
import LaunchpadHeader from './setup/LaunchpadHeader.vue'
import OpenBrowser from './setup/OpenBrowser.vue'

const { t } = useI18n()
const isTestingTypeModalOpen = ref(false)

gql`
query MainLaunchpadQuery {
  ...TestingTypeCards
  ...Wizard
  baseError {
    ...BaseError_Data
  }
  currentTestingType
  currentProject {
    id
    isCTConfigured
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

const query = useQuery({ query: MainLaunchpadQueryDocument })
const currentProject = computed(() => query.data.value?.currentProject)
</script>
