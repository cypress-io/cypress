<template>
  <template v-if="data">
    <HeaderBar />
    <div class="p-24px">
      <ErrorDisplay
        v-if="data.globalError"
        :gql="data.globalError"
      />
      <GlobalPage
        v-else-if="!data.currentProject"
        :gql="data"
      />
      <template v-else-if="data.currentProject">
        <ErrorDisplay
          v-if="data.currentProject.errorLoadingConfig"
          :gql="data.currentProject.errorLoadingConfig"
          :retry="retryLoadConfig"
        />
        <ErrorDisplay
          v-else-if="data.currentProject.errorLoadingPlugins"
          :gql="data.currentProject.errorLoadingPlugins"
          :retry="retryLoadPlugins"
        />
        <Spinner v-else-if="data.currentProject.isLoadingConfig" />
        <ChooseTestingTypeContainer
          v-else-if="!data.currentProject.currentTestingType"
          :gql="data.currentProject"
        />
        <SetupComponentTestingWizard
          v-else-if="data.currentProject.currentTestingType === 'component' && data.currentProject"
          :gql="data"
        />
        <MigrationWizard
          v-else-if="data.currentProject"
          :gql="data"
        />
        <OpenBrowserContainer
          v-else
          :gql="data.currentProject"
        />
      </template>
    </div>
  </template>
  <div v-else>
    Loading
  </div>
</template>

<script lang="ts" setup>
import { gql, useMutation, useQuery } from '@urql/vue'
import { LaunchpadMainDocument, LaunchpadMain_ReloadConfigDocument, LaunchpadMain_ReloadPluginsDocument } from './generated/graphql'
import SetupComponentTestingWizard from './setup/SetupComponentTestingWizard.vue'
import GlobalPage from './global/GlobalPage.vue'
import ErrorDisplay from './error/ErrorDisplay.vue'
import OpenBrowserContainer from './setup/OpenBrowserContainer.vue'
import ChooseTestingTypeContainer from './setup/ChooseTestingTypeContainer.vue'
import HeaderBar from '@cy/gql-components/HeaderBar.vue'
import Spinner from '@cy/components/Spinner.vue'

import { useI18n } from '@cy/i18n'
import { computed } from 'vue-demi'

const { t } = useI18n()

gql`
mutation LaunchpadMain_reloadConfig {
  retryLoadConfig {
    ...LaunchpadMain_Data
  }
}
`

gql`
mutation LaunchpadMain_reloadPlugins {
  retryLoadPlugins {
    ...LaunchpadMain_Data
  }
}
`

const reloadConfigMutation = useMutation(LaunchpadMain_ReloadConfigDocument)
const reloadPluginsMutation = useMutation(LaunchpadMain_ReloadPluginsDocument)

const retryLoadConfig = () => {
  reloadConfigMutation.executeMutation({})
}

const retryLoadPlugins = () => {
  reloadPluginsMutation.executeMutation({})
}

gql`
fragment LaunchpadMain_Data on Query {
  currentProject {
    id
    currentTestingType
    isLoadingConfig
    ...TestingTypeCards
    errorLoadingConfig {
      ...ErrorDisplay
    }
    errorLoadingPlugins {
      ...ErrorDisplay 
    }
    ...OpenBrowserContainer
  }
  globalError {
    ...ErrorDisplay
  }
  isInGlobalMode
  ...GlobalPage
  ...SetupComponentTestingWizard
}
`

gql`
query LaunchpadMain {
  ...LaunchpadMain_Data
}
`

const query = useQuery({ query: LaunchpadMainDocument })
const data = computed(() => query.data.value)
</script>
